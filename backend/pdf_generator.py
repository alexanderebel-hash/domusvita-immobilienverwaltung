"""
Einzugspaket PDF Generator
Generates personalized move-in document packages for Pflege-WG residents.
Uses Jinja2 templates + WeasyPrint for HTML-to-PDF conversion.
"""

import logging
from datetime import date
from pathlib import Path
from jinja2 import Environment, FileSystemLoader

logger = logging.getLogger(__name__)

TEMPLATES_DIR = Path(__file__).parent / "templates" / "einzugspaket"

# All available document sections in order
DOCUMENT_SECTIONS = [
    "willkommen",
    "vereinbarung",
    "haushaltsbuch",
    "sepa",
    "kosten",
    "mietvertrag",
    "hausordnung",
    "kurzprofil",
    "todo",
]

SECTION_LABELS = {
    "willkommen": "Willkommensschreiben",
    "vereinbarung": "Gemeinschaftsvereinbarung",
    "haushaltsbuch": "Haushaltsbuch-Erklärung",
    "sepa": "SEPA-Lastschriftmandat",
    "kosten": "Kostenübersicht",
    "mietvertrag": "Nutzungsvertrag (Mietvertrag)",
    "hausordnung": "Hausordnung",
    "kurzprofil": "Bewohner-Kurzprofil",
    "todo": "Einzugs-Checkliste",
}


class EinzugspaketGenerator:
    def __init__(self):
        self.env = Environment(loader=FileSystemLoader(str(TEMPLATES_DIR)))

    def generate(self, klient: dict, wg: dict, zimmer: dict,
                 stammdaten: dict, mietbeginn: str = None,
                 sections: list = None) -> bytes:
        """
        Generate a complete Einzugspaket PDF.

        Args:
            klient: Client data dict
            wg: WG data dict (from PFLEGE_WGS_DATA)
            zimmer: Room data dict
            stammdaten: WG-Stammdaten dict
            mietbeginn: Optional move-in date string (DD.MM.YYYY)
            sections: Optional list of section names to include (default: all)

        Returns:
            PDF bytes
        """
        from weasyprint import HTML

        if sections is None:
            sections = DOCUMENT_SECTIONS

        # Calculate costs
        kosten_config = self._get_kosten_config(stammdaten, zimmer)

        # Build template context
        context = {
            "klient": klient,
            "wg": wg,
            "zimmer": zimmer,
            "stammdaten": stammdaten,
            "datum_heute": date.today().strftime("%d.%m.%Y"),
            "mietbeginn": mietbeginn or date.today().strftime("%d.%m.%Y"),
            **kosten_config,
        }

        # Render each section and combine
        html_parts = []
        for section in sections:
            if section not in DOCUMENT_SECTIONS:
                logger.warning(f"Unknown section: {section}, skipping")
                continue
            try:
                template = self.env.get_template(f"{section}.html")
                html_parts.append(template.render(**context))
            except Exception as e:
                logger.error(f"Error rendering section {section}: {e}")
                raise

        # Combine all sections into one HTML document
        combined_html = self._combine_sections(html_parts)

        # Generate PDF
        pdf_bytes = HTML(string=combined_html).write_pdf()
        logger.info(
            f"Generated Einzugspaket PDF for {klient.get('vorname')} "
            f"{klient.get('nachname')} ({len(pdf_bytes)} bytes, "
            f"{len(sections)} sections)"
        )
        return pdf_bytes

    def generate_preview_html(self, klient: dict, wg: dict, zimmer: dict,
                              stammdaten: dict, mietbeginn: str = None,
                              sections: list = None) -> str:
        """Generate HTML preview (without PDF conversion)."""
        if sections is None:
            sections = DOCUMENT_SECTIONS

        kosten_config = self._get_kosten_config(stammdaten, zimmer)

        context = {
            "klient": klient,
            "wg": wg,
            "zimmer": zimmer,
            "stammdaten": stammdaten,
            "datum_heute": date.today().strftime("%d.%m.%Y"),
            "mietbeginn": mietbeginn or date.today().strftime("%d.%m.%Y"),
            **kosten_config,
        }

        html_parts = []
        for section in sections:
            if section in DOCUMENT_SECTIONS:
                template = self.env.get_template(f"{section}.html")
                html_parts.append(template.render(**context))

        return self._combine_sections(html_parts)

    def _get_kosten_config(self, stammdaten: dict, zimmer: dict) -> dict:
        """Calculate cost values for templates."""
        # Get room rent: try explicit fields first, then calculate from m²
        miete_zimmer = (
            zimmer.get("grundmiete_kalt")  # Drachenwiese/Drachenblick style
            or zimmer.get("nettokaltmiete")  # Kupferkessel style
            or zimmer.get("zahlbetrag_gesamt")  # Full amount if available
            or zimmer.get("miete", 0)
        )
        if not miete_zimmer:
            # Calculate from m² using WG-specific rate or fallback
            flaeche = zimmer.get("flaeche_qm") or zimmer.get("mietflaeche_qm") or 20
            rate = stammdaten.get("nettokaltmiete_pro_qm", 13.0)
            miete_zimmer = flaeche * rate

        lebensmittel = stammdaten.get("lebensmittelpauschale", 290.0)
        wg_beitrag = stammdaten.get("wg_beitrag", 30.0)
        wg_zuschlag = stammdaten.get("wg_zuschlag", 224.0)
        entlastung = stammdaten.get("entlastungsbetrag", 125.0)

        gesamt_monatlich = miete_zimmer + lebensmittel + wg_beitrag + wg_zuschlag
        eigenanteil = gesamt_monatlich - entlastung - wg_zuschlag
        kaution = miete_zimmer * 2

        return {
            "miete_zimmer": miete_zimmer,
            "gesamt_monatlich": gesamt_monatlich,
            "eigenanteil": max(eigenanteil, 0),
            "kaution": kaution,
        }

    def _combine_sections(self, html_parts: list) -> str:
        """Combine multiple rendered HTML sections into one document."""
        # Use the base template CSS but combine all section bodies
        base_template = self.env.get_template("base.html")
        base_html = base_template.render()

        # Extract body contents from each rendered section
        bodies = []
        for html in html_parts:
            # Each section extends base.html, so extract between <body> tags
            start = html.find("<body>")
            end = html.find("</body>")
            if start != -1 and end != -1:
                bodies.append(html[start + 6:end])
            else:
                bodies.append(html)

        # Insert all bodies into base
        combined_body = "\n".join(bodies)
        head_end = base_html.find("</head>")
        return (
            base_html[:head_end]
            + "</head>\n<body>\n"
            + combined_body
            + "\n</body>\n</html>"
        )
