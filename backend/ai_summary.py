"""AI-powered communication summary using Anthropic Claude Haiku."""

# K-05/DSGVO: Diese Funktion sendet Kommunikationsinhalte an die Anthropic API.
# Inhalte koennen personenbezogene Daten (Name, Adresse) und ggf. Gesundheitsdaten
# (Pflegebedarf bei WG-Bewohnern) enthalten — Art. 9 DSGVO.
# Pseudonymisierung ist bei Freitext-Kommunikation nicht zuverlaessig moeglich.
# Voraussetzung: AVV mit Anthropic (K-07), DSFA (K-06).

import os
import logging

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")


async def generate_summary(text: str) -> list[str]:
    """Generate a 2-4 bullet-point summary in German using Claude Haiku.

    Returns a list of summary strings, or empty list on failure.
    """
    if not ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY not set, skipping summary generation")
        return []

    if not text or len(text.strip()) < 20:
        return []

    logger.info("DSGVO Audit: Anthropic API call (ai_summary)", extra={
        "event": "anthropic_api_call",
        "module": "immobilien",
        "function": "generate_summary",
        "text_length": len(text),
        "has_potential_pii": True,
        "pseudonymized": False,
        "avv_required": "K-07"
    })

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY, timeout=60.0, max_retries=2)

        message = await client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Fasse diese Kommunikation in 2-4 deutschen Stichpunkten zusammen. "
                        "Gib NUR die Stichpunkte zurueck, je einer pro Zeile, ohne Aufzaehlungszeichen.\n\n"
                        f"{text[:2000]}"
                    ),
                }
            ],
        )

        raw = message.content[0].text.strip()
        lines = [line.strip().lstrip("•-– ") for line in raw.split("\n") if line.strip()]
        return lines[:4]

    except Exception as e:
        logger.error(f"AI summary generation failed: {e}")
        return []
