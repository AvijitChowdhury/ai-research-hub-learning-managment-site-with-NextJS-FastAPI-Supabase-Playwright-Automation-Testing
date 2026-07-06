"""Structured data (JSON-LD) validity."""
import json
import allure
import pytest

pytestmark = [allure.epic("axiom/lab"), allure.feature("Structured Data")]


def _ld(page, path):
    page.goto(path)
    return page.locator('script[type="application/ld+json"]').all_text_contents()


def test_home_ld_valid_json(page):
    for s in _ld(page, "/"):
        json.loads(s)


def test_catalog_ld_valid_json(page):
    for s in _ld(page, "/courses"):
        json.loads(s)


def test_home_has_organization_or_website(page):
    blobs = [json.loads(s) for s in _ld(page, "/")]
    types = []
    for b in blobs:
        t = b.get("@type") if isinstance(b, dict) else None
        if t:
            types.append(t)
    assert any(t in ("Organization", "WebSite") for t in types)


def test_catalog_ld_has_course_items(page):
    blobs = [json.loads(s) for s in _ld(page, "/courses")]
    found = False
    for b in blobs:
        if isinstance(b, dict) and b.get("@type") in ("CollectionPage", "ItemList"):
            found = True
        if isinstance(b, dict) and "hasPart" in b:
            found = True
    assert found


@pytest.mark.parametrize("slug", ["transformers-from-scratch", "diffusion-models"])
def test_course_page_ld_json_valid(page, slug):
    for s in _ld(page, f"/courses/{slug}"):
        json.loads(s)
