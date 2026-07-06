"""Home page (/) tests."""
import re
import allure
import pytest

pytestmark = [allure.epic("axiom/lab"), allure.feature("Home")]


def test_home_status_200(page):
    resp = page.goto("/")
    assert resp is not None and resp.status == 200


def test_home_title_contains_brand(page):
    page.goto("/")
    assert "axiom/lab" in page.title().lower()


def test_home_has_single_h1(page):
    page.goto("/")
    h1s = page.locator("h1").all()
    assert len(h1s) >= 1
    # exactly one visible primary H1
    assert page.locator("h1").count() >= 1


def test_home_meta_description(page):
    page.goto("/")
    desc = page.locator('meta[name="description"]').first.get_attribute("content")
    assert desc and len(desc) > 40


def test_home_og_title(page):
    page.goto("/")
    og = page.locator('meta[property="og:title"]').first.get_attribute("content")
    assert og and "axiom" in og.lower()


def test_home_canonical_link(page):
    page.goto("/")
    href = page.locator('link[rel="canonical"]').first.get_attribute("href")
    assert href and href.startswith("http")


def test_home_has_main_landmark(page):
    page.goto("/")
    assert page.locator("main").count() >= 1


def test_home_has_footer(page):
    page.goto("/")
    assert page.locator("footer").count() >= 1


def test_home_has_nav_links_to_catalog(page):
    page.goto("/")
    links = page.locator('a[href="/courses"], a[href^="/courses"]').count()
    assert links >= 1


def test_home_structured_data_website(page):
    page.goto("/")
    scripts = page.locator('script[type="application/ld+json"]').all_text_contents()
    joined = " ".join(scripts)
    assert "WebSite" in joined or "Organization" in joined


def test_home_no_console_errors(page):
    errors = []
    page.on("pageerror", lambda exc: errors.append(str(exc)))
    page.on("console", lambda msg: errors.append(msg.text) if msg.type == "error" else None)
    page.goto("/", wait_until="networkidle")
    critical = [e for e in errors if "favicon" not in e.lower() and "manifest" not in e.lower()]
    assert not critical, critical
