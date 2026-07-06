"""Auth page + protected routes redirect."""
import allure

pytestmark = [allure.epic("axiom/lab"), allure.feature("Auth")]


def test_auth_page_loads(page):
    r = page.goto("/auth")
    assert r.status == 200


def test_auth_has_email_input(page):
    page.goto("/auth")
    assert page.locator('input[type="email"]').count() >= 1


def test_auth_has_password_input(page):
    page.goto("/auth")
    assert page.locator('input[type="password"]').count() >= 1


def test_auth_submit_button(page):
    page.goto("/auth")
    buttons = page.locator('button[type="submit"], button:has-text("Sign")').count()
    assert buttons >= 1


def test_auth_noindex(page):
    page.goto("/auth")
    robots = page.locator('meta[name="robots"]').first
    if robots.count() > 0:
        assert "noindex" in (robots.get_attribute("content") or "").lower()


def test_dashboard_redirects_when_unauthed(page):
    page.goto("/dashboard")
    page.wait_for_load_state("networkidle")
    assert "/auth" in page.url or "sign" in page.content().lower()


def test_admin_redirects_when_unauthed(page):
    page.goto("/admin")
    page.wait_for_load_state("networkidle")
    assert "/auth" in page.url or "sign" in page.content().lower()
