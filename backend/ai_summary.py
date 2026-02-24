"""AI-powered communication summary using Anthropic Claude Haiku."""

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

    try:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=ANTHROPIC_API_KEY)

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
