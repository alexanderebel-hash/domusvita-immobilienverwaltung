"""PR Impact Analysis Script for GitHub Actions.

Analyzes a PR's changed files, searches the knowledge base for context,
runs basic impact checks, and posts a structured comment on the PR.

Usage (in GitHub Actions):
  python scripts/pr-impact-analysis.py \
    --repo domusvita-portal \
    --pr 42 \
    --module portal-landing

Environment variables:
  GITHUB_TOKEN            - GitHub token (from actions/checkout)
  AZURE_SEARCH_SERVICE_NAME - AI Search service name
  AZURE_SEARCH_ADMIN_KEY  - AI Search admin key
  AGENT_API_URL           - Agent API base URL (optional)
"""
import os
import sys
import json
import re
import argparse
import subprocess
from datetime import datetime, timezone
from typing import Dict, List, Optional, Tuple

try:
    import httpx
except ImportError:
    print("httpx not installed. Run: pip install httpx")
    sys.exit(1)

# --- Configuration ---
SEARCH_SERVICE = os.environ.get("AZURE_SEARCH_SERVICE_NAME", "domusvita-knowledge")
SEARCH_KEY = os.environ.get("AZURE_SEARCH_ADMIN_KEY", "")
SEARCH_URL = f"https://{SEARCH_SERVICE}.search.windows.net"
API_VERSION = "2024-07-01"
AGENT_API_URL = os.environ.get("AGENT_API_URL", "")

TIER_0_MODULES = {"sgb-xii"}

# Patterns for impact detection
IMPACT_PATTERNS = {
    "database": {
        "files": ["migration", "schema", ".sql", "database.py", "db_layer.py"],
        "diff": ["CREATE TABLE", "ALTER TABLE", "DROP TABLE", "CREATE INDEX", "DROP INDEX"],
        "severity": "high",
    },
    "auth": {
        "files": ["auth.py", "msal", "AuthProvider", "msalConfig", "login"],
        "diff": ["get_current_user", "require_admin", "EntraIDValidator", "MSAL"],
        "severity": "high",
    },
    "deployment": {
        "files": ["Dockerfile", "docker-compose", "deploy", ".github/workflows"],
        "diff": ["FROM ", "EXPOSE", "CMD ", "ENTRYPOINT"],
        "severity": "medium",
    },
    "dependencies": {
        "files": ["requirements.txt", "package.json", "package-lock.json"],
        "diff": [],
        "severity": "medium",
    },
    "api_contract": {
        "files": ["server.py", "router.py"],
        "diff": ["@app.get", "@app.post", "@app.put", "@app.delete", "@router."],
        "severity": "medium",
    },
    "cors": {
        "files": [],
        "diff": ["CORS", "allow_origins", "CORS_ORIGINS"],
        "severity": "medium",
    },
    "dsgvo": {
        "files": [],
        "diff": ["klient", "patient", "bewohner", "pflegegrad", "diagnose", "sozialamt"],
        "severity": "high",
    },
}

# Cross-module dependencies (shared DB)
SHARED_DB_MODULES = {"portal-landing", "sgb-xii", "immobilien"}


def get_pr_info(pr_number: int) -> Tuple[List[str], str, str]:
    """Get PR changed files, diff, and title via gh CLI."""
    try:
        # Get changed files
        files_result = subprocess.run(
            ["gh", "pr", "view", str(pr_number), "--json", "files", "-q", ".files[].path"],
            capture_output=True, text=True, timeout=30,
        )
        changed_files = [f for f in files_result.stdout.strip().split("\n") if f]

        # Get diff
        diff_result = subprocess.run(
            ["gh", "pr", "diff", str(pr_number)],
            capture_output=True, text=True, timeout=30,
        )
        diff_content = diff_result.stdout[:100000]

        # Get title
        title_result = subprocess.run(
            ["gh", "pr", "view", str(pr_number), "--json", "title", "-q", ".title"],
            capture_output=True, text=True, timeout=30,
        )
        title = title_result.stdout.strip()

        return changed_files, diff_content, title
    except Exception as e:
        print(f"Error getting PR info: {e}")
        return [], "", ""


def detect_impacts(changed_files: List[str], diff_content: str) -> List[Dict]:
    """Detect impact areas based on file patterns and diff content."""
    impacts = []
    diff_upper = diff_content.upper()

    for area, config in IMPACT_PATTERNS.items():
        file_hits = [f for f in changed_files if any(p.lower() in f.lower() for p in config["files"])]
        diff_hits = [p for p in config["diff"] if p.upper() in diff_upper]

        if file_hits or diff_hits:
            impacts.append({
                "area": area,
                "severity": config["severity"],
                "file_hits": file_hits[:5],
                "diff_hits": diff_hits[:3],
            })

    return impacts


def search_kb(query: str, index: str = "code-chunks", module: str = None, top: int = 5) -> List[Dict]:
    """Search Azure AI Search knowledge base."""
    if not SEARCH_KEY:
        return []

    params = {
        "search": query,
        "queryType": "simple",
        "$top": top,
        "$select": "module,file_path,chunk_content,security_tags",
    }
    if module:
        params["$filter"] = f"module eq '{module}'"

    try:
        response = httpx.post(
            f"{SEARCH_URL}/indexes/{index}/docs/search?api-version={API_VERSION}",
            headers={"Content-Type": "application/json", "api-key": SEARCH_KEY},
            json=params,
            timeout=15,
        )
        if response.status_code == 200:
            return response.json().get("value", [])
    except Exception as e:
        print(f"KB search error: {e}")

    return []


def check_cross_module(module: str, changed_files: List[str], diff_content: str) -> List[str]:
    """Check for cross-module impact."""
    cross_impacts = []

    # Database changes on shared server
    has_db_change = any("migration" in f.lower() or ".sql" in f.lower() or "database.py" in f for f in changed_files)
    if has_db_change and module in SHARED_DB_MODULES:
        other_modules = SHARED_DB_MODULES - {module}
        cross_impacts.append(
            f"DB-Aenderung auf geteiltem PG16-Server. Module {', '.join(other_modules)} koennten betroffen sein."
        )

    # Check for references to other modules in diff
    module_refs = {
        "portal-landing": ["domusvita-portal.de", "api.domusvita-portal.de"],
        "sgb-xii": ["rechnung.domusvita-portal.de", "domusvita-rechnung"],
        "controlling": ["controlling.domusvita-portal.de"],
        "immobilien": ["immobilien.domusvita-portal.de", "immo-api.domusvita-portal.de"],
    }
    for other_module, refs in module_refs.items():
        if other_module != module:
            if any(ref in diff_content for ref in refs):
                cross_impacts.append(f"Referenz auf {other_module} im Diff erkannt.")

    return cross_impacts


def build_comment(
    module: str,
    pr_title: str,
    changed_files: List[str],
    impacts: List[Dict],
    cross_impacts: List[str],
    kb_evidence: List[Dict],
) -> str:
    """Build the PR comment in markdown format."""
    is_tier0 = module in TIER_0_MODULES

    # Overall severity
    severities = [i["severity"] for i in impacts]
    if "critical" in severities or is_tier0:
        overall = "critical"
        emoji = "🚨"
    elif "high" in severities:
        overall = "high"
        emoji = "⚠️"
    elif "medium" in severities:
        overall = "medium"
        emoji = "📋"
    else:
        overall = "low"
        emoji = "✅"

    lines = [
        f"## {emoji} Agent Impact-Analyse",
        "",
        f"**Modul:** {module}" + (" (Tier-0!)" if is_tier0 else ""),
        f"**Geaenderte Dateien:** {len(changed_files)}",
        f"**Gesamt-Severity:** {overall}",
        "",
    ]

    # Impact areas
    if impacts:
        lines.append("### Impact-Bereiche")
        lines.append("")
        lines.append("| Bereich | Severity | Betroffene Dateien | Erkannte Patterns |")
        lines.append("|---------|----------|--------------------|--------------------|")
        for imp in impacts:
            files_str = ", ".join(f"`{f}`" for f in imp["file_hits"][:3]) or "-"
            diff_str = ", ".join(imp["diff_hits"][:3]) or "-"
            sev_emoji = {"critical": "🔴", "high": "🟠", "medium": "🟡", "low": "🟢"}.get(imp["severity"], "⚪")
            lines.append(f"| {imp['area']} | {sev_emoji} {imp['severity']} | {files_str} | {diff_str} |")
        lines.append("")
    else:
        lines.append("### Keine besonderen Impact-Bereiche erkannt")
        lines.append("")

    # Cross-module
    if cross_impacts:
        lines.append("### Cross-Modul Auswirkungen")
        for ci in cross_impacts:
            lines.append(f"- ⚠️ {ci}")
        lines.append("")

    # Tier-0 warnings
    if is_tier0:
        lines.append("### ⚠️ Tier-0 Modul (SGB XII)")
        lines.append("- Erhoehte Pruefungstiefe erforderlich")
        lines.append("- DB-Aenderungen brauchen Backup + Rollback-Plan")
        lines.append("- Deployment nur mit Canary-Strategie")
        lines.append("")

    # KB Evidence
    if kb_evidence:
        lines.append("<details>")
        lines.append(f"<summary>Wissensbasis-Evidenz ({len(kb_evidence)} Treffer)</summary>")
        lines.append("")
        for ev in kb_evidence[:10]:
            content = ev.get("chunk_content", "")[:150].replace("\n", " ")
            tags = ev.get("security_tags", [])
            tag_str = f" [{', '.join(tags)}]" if tags else ""
            lines.append(f"- `{ev.get('module', '?')}:{ev.get('file_path', '?')}`{tag_str}")
            lines.append(f"  > {content}...")
            lines.append("")
        lines.append("</details>")
        lines.append("")

    # Changed files list
    lines.append("<details>")
    lines.append(f"<summary>Geaenderte Dateien ({len(changed_files)})</summary>")
    lines.append("")
    for f in changed_files[:30]:
        lines.append(f"- `{f}`")
    if len(changed_files) > 30:
        lines.append(f"- ... und {len(changed_files) - 30} weitere")
    lines.append("")
    lines.append("</details>")
    lines.append("")

    lines.append("---")
    lines.append(f"*Generiert am {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')} vom DomusVita Agent System*")

    return "\n".join(lines)


def post_pr_comment(pr_number: int, comment: str):
    """Post comment on PR via gh CLI."""
    try:
        result = subprocess.run(
            ["gh", "pr", "comment", str(pr_number), "--body", comment],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode == 0:
            print(f"Comment posted on PR #{pr_number}")
        else:
            print(f"Error posting comment: {result.stderr}")
    except Exception as e:
        print(f"Error posting comment: {e}")


def main():
    parser = argparse.ArgumentParser(description="PR Impact Analysis")
    parser.add_argument("--repo", required=True, help="Repo name (e.g. domusvita-portal)")
    parser.add_argument("--pr", type=int, required=True, help="PR number")
    parser.add_argument("--module", required=True, help="Module slug")
    parser.add_argument("--post-comment", action="store_true", help="Post as PR comment")
    parser.add_argument("--output", help="Output file for the comment")
    args = parser.parse_args()

    print(f"Analyzing PR #{args.pr} in {args.repo} (module: {args.module})")

    # Step 1: Get PR info
    changed_files, diff_content, pr_title = get_pr_info(args.pr)
    if not changed_files:
        print("No changed files found, skipping analysis")
        return

    print(f"Found {len(changed_files)} changed files")

    # Step 2: Detect impacts
    impacts = detect_impacts(changed_files, diff_content)
    print(f"Detected {len(impacts)} impact areas")

    # Step 3: Check cross-module
    cross_impacts = check_cross_module(args.module, changed_files, diff_content)
    if cross_impacts:
        print(f"Cross-module impacts: {len(cross_impacts)}")

    # Step 4: Search KB for evidence
    kb_evidence = []
    if SEARCH_KEY:
        # Search for changed file paths
        for f in changed_files[:3]:
            results = search_kb(f, module=args.module, top=2)
            kb_evidence.extend(results)

        # Search for impact-related docs
        for imp in impacts[:3]:
            results = search_kb(imp["area"], index="docs-chunks", module=args.module, top=2)
            kb_evidence.extend(results)

        print(f"KB evidence: {len(kb_evidence)} hits")

    # Step 5: Build comment
    comment = build_comment(
        module=args.module,
        pr_title=pr_title,
        changed_files=changed_files,
        impacts=impacts,
        cross_impacts=cross_impacts,
        kb_evidence=kb_evidence,
    )

    # Step 6: Output
    if args.output:
        with open(args.output, "w") as f:
            f.write(comment)
        print(f"Comment written to {args.output}")

    if args.post_comment:
        post_pr_comment(args.pr, comment)
    else:
        print("\n" + comment)


if __name__ == "__main__":
    main()
