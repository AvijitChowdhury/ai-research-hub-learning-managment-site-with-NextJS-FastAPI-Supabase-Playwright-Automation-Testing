"""Navigation flow tests."""
import allure

pytestmark = [allure.epic("axiom/lab"), allure.feature("Navigation")]


def test_home_to_catalog(page):
    page.goto("/")
    page.locator('a[href="/courses"]').first.click()
    page.wait_for_url("**/courses")
    assert "/courses" in page.url


def test_catalog_to_course_detail(page):
    page.goto("/courses")
    first = page.locator('a[href^="/courses/"]').first
    href = first.get_attribute("href")
    first.click()
    page.wait_for_load_state("domcontentloaded")
    assert href and href in page.url


def test_footer_present_on_home(page):
    page.goto("/")
    assert page.locator("footer").first.is_visible()


def test_header_present_on_catalog(page):
    page.goto("/courses")
    assert page.locator("header").first.is_visible()


def test_back_navigation(page):
    page.goto("/")
    page.goto("/courses")
    page.go_back()
    page.wait_for_load_state("domcontentloaded")
    assert page.url.rstrip("/").endswith("8080")
