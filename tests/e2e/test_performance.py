"""Performance smoke: main routes render within a generous budget."""
import time
import allure
import pytest

pytestmark = [allure.epic("axiom/lab"), allure.feature("Performance smoke")]


@pytest.mark.parametrize("path", ["/", "/courses", "/auth", "/checkout/return"])
def test_route_renders_under_budget(page, path):
    start = time.time()
    page.goto(path, wait_until="domcontentloaded")
    elapsed = time.time() - start
    assert elapsed < 15.0, f"{path} took {elapsed:.2f}s"


def test_catalog_shows_cards_quickly(page):
    page.goto("/courses")
    page.wait_for_selector('a[href^="/courses/"]', timeout=10_000)
