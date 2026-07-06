"""Certificate verify page + 404 handling."""
import allure

pytestmark = [allure.epic("axiom/lab"), allure.feature("Certificates & 404s")]


def test_certificate_unknown_code(page):
    r = page.goto("/certificates/00000000-0000-0000-0000-000000000000")
    assert r.status in (200, 404)
    body = page.content().lower()
    assert "not found" in body or "doesn't match" in body or r.status == 404


def test_certificate_route_is_noindex_for_missing(page):
    page.goto("/certificates/nonexistent-code")
    robots = page.locator('meta[name="robots"]').first
    if robots.count() > 0:
        assert "noindex" in (robots.get_attribute("content") or "").lower()


def test_unknown_route_404(page):
    r = page.goto("/this-route-really-does-not-exist")
    assert r.status in (200, 404)
    assert "not found" in page.content().lower() or "404" in page.content()


def test_checkout_return_no_params(page):
    r = page.goto("/checkout/return")
    assert r.status == 200
    assert page.locator("main").count() >= 1


def test_checkout_return_has_noindex(page):
    page.goto("/checkout/return")
    robots = page.locator('meta[name="robots"]').first.get_attribute("content")
    assert robots and "noindex" in robots.lower()
