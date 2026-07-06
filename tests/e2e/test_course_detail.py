"""Course detail pages."""
import allure
import pytest
from conftest import COURSE_SLUGS

pytestmark = [allure.epic("axiom/lab"), allure.feature("Course Detail")]


@pytest.mark.parametrize("slug", COURSE_SLUGS)
def test_course_page_loads(page, slug):
    r = page.goto(f"/courses/{slug}")
    assert r.status == 200


@pytest.mark.parametrize("slug", COURSE_SLUGS)
def test_course_has_h1(page, slug):
    page.goto(f"/courses/{slug}")
    assert page.locator("h1").first.is_visible()


@pytest.mark.parametrize("slug", COURSE_SLUGS)
def test_course_meta_description(page, slug):
    page.goto(f"/courses/{slug}")
    desc = page.locator('meta[name="description"]').first.get_attribute("content")
    assert desc and len(desc) > 20


@pytest.mark.parametrize("slug", COURSE_SLUGS)
def test_course_canonical(page, slug):
    page.goto(f"/courses/{slug}")
    href = page.locator('link[rel="canonical"]').first.get_attribute("href")
    assert href and href.startswith("http")


@pytest.mark.parametrize("slug", COURSE_SLUGS)
def test_course_og_tags(page, slug):
    page.goto(f"/courses/{slug}")
    og_title = page.locator('meta[property="og:title"]').first.get_attribute("content")
    assert og_title


def test_course_404_for_unknown_slug(page):
    r = page.goto("/courses/this-course-does-not-exist-xyz")
    # TanStack notFound may still render 200 with a not-found component
    assert r.status in (200, 404)
    content = page.content().lower()
    assert "not found" in content or "404" in content or "does not exist" in content or r.status == 404
