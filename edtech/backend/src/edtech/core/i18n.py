"""Minimal message catalog. Every user-facing string goes through :func:`t`.

Catalogs live in :mod:`edtech.locales`. French is the reference language and the fallback; a test
guarantees that every catalog defines exactly the same keys and placeholders.
"""

from __future__ import annotations

from collections.abc import Mapping

from edtech.locales import en, fr

FALLBACK_LOCALE = "fr"
CATALOGS: Mapping[str, Mapping[str, str]] = {"fr": fr.MESSAGES, "en": en.MESSAGES}
SUPPORTED_LOCALES = tuple(CATALOGS)


def normalize_locale(value: str | None, default: str = FALLBACK_LOCALE) -> str:
    """Map a Telegram ``language_code`` (``fr``, ``fr-FR``, ``en-US``...) to a supported locale."""
    if not value:
        return default
    base = value.split("-")[0].split("_")[0].lower()
    return base if base in CATALOGS else default


def t(locale: str | None, key: str, **params: object) -> str:
    catalog = CATALOGS.get(locale or FALLBACK_LOCALE, CATALOGS[FALLBACK_LOCALE])
    template = catalog.get(key) or CATALOGS[FALLBACK_LOCALE].get(key)
    if template is None:
        raise KeyError(f"Message inconnu : {key}")
    return template.format(**params) if params else template


def localized(names: Mapping[str, str] | None, locale: str | None) -> str:
    """Pick a translated name from a ``{"fr": ..., "en": ...}`` mapping."""
    if not names:
        return ""
    return (
        names.get(locale or FALLBACK_LOCALE)
        or names.get(FALLBACK_LOCALE)
        or next(iter(names.values()))
    )
