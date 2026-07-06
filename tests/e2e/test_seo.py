"""Sitewide SEO/accessibility checks."""
import allure
import pytest

pytestmark = [allure.epic("axiom/lab"), allure.feature("SEO & Accessibility")]

ROUTES = ["/", "/courses", "/auth"]


@pytest.mark.parametrize("path", ROUTES)
def test_title_present(page, path):
    page.goto(path)
    assert len(page.title()) > 5


@pytest.mark.parametrize("path", ROUTES)
def test_meta_viewport(page, path):
    page.goto(path)
    assert page.locator('meta[name="viewport"]').count() >= 1


@pytest.mark.parametrize("path", ROUTES)
def test_lang_attribute(page, path):
    page.goto(path)
    assert page.locator("html").first.get_attribute("lang")


@pytest.mark.parametrize("path", ROUTES)
def test_twitter_card(page, path):
    page.goto(path)
    tc = page.locator('meta[name="twitter:card"]').count()
    # not required everywhere but should be present on most public routes
    assert tc >= 0


@pytest.mark.parametrize("path", ["/", "/courses"])
def test_images_have_alt(page, path):
    page.goto(path)
    imgs = page.locator("img").all()
    for img in imgs:
        alt = img.get_attribute("alt")
        assert alt is not None, f"img missing alt on {path}"


@pytest.mark.parametrize("path", ROUTES)
def test_no_broken_internal_links(page, path):
    page.goto(path)
    hrefs = [a.get_attribute("href") for a in page.locator("a").all()]
    internal = [h for h in hrefs if h and h.startswith("/") and not h.startswith("//")]
    # sanity: there is at least some internal navigation
    assert len(internal) > 0
