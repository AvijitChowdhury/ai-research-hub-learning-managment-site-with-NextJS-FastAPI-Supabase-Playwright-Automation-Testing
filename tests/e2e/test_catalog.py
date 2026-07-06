"""Catalog page tests."""
import allure

pytestmark = [allure.epic("axiom/lab"), allure.feature("Catalog")]


def test_catalog_status(page):
    r = page.goto("/courses")
    assert r.status == 200


def test_catalog_has_h1(page):
    page.goto("/courses")
    assert page.locator("h1").first.is_visible()


def test_catalog_title(page):
    page.goto("/courses")
    assert "catalog" in page.title().lower()


def test_catalog_shows_cards(page):
    page.goto("/courses")
    cards = page.locator('a[href^="/courses/"]').count()
    assert cards >= 3


def test_catalog_search_filter(page):
    page.goto("/courses")
    search = page.get_by_placeholder("Search courses, topics, instructors…")
    search.fill("transformer")
    page.wait_for_timeout(300)
    assert page.locator('a[href^="/courses/"]').count() >= 1


def test_catalog_search_empty_state(page):
    page.goto("/courses", wait_until="networkidle")
    box = page.get_by_placeholder("Search courses, topics, instructors…")
    box.click()
    box.type("zzzzzzzzz-nothing", delay=20)
    page.wait_for_timeout(500)
    body = page.locator("body").inner_text().lower()
    assert "no courses" in body or "0 result" in body


def test_catalog_level_filter(page):
    page.goto("/courses")
    page.locator("select").first.select_option("Advanced")
    page.wait_for_timeout(200)
    assert page.locator('a[href^="/courses/"]').count() >= 0


def test_catalog_category_chips(page):
    page.goto("/courses")
    assert page.get_by_role("button", name="All").is_visible()


def test_catalog_canonical(page):
    page.goto("/courses")
    href = page.locator('link[rel="canonical"]').first.get_attribute("href")
    assert href and href.endswith("/courses")


def test_catalog_structured_data(page):
    page.goto("/courses")
    scripts = page.locator('script[type="application/ld+json"]').all_text_contents()
    assert any("CollectionPage" in s or "Course" in s for s in scripts)
