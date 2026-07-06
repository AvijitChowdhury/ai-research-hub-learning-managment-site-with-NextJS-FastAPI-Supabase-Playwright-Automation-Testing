import pytest

BASE_URL = "http://localhost:8080"


@pytest.fixture(scope="session")
def base_url():
    return BASE_URL


@pytest.fixture(scope="session")
def browser_context_args(browser_context_args):
    return {**browser_context_args, "viewport": {"width": 1280, "height": 1800}, "base_url": BASE_URL}


# Sample slug list captured from live catalog
COURSE_SLUGS = [
    "transformers-from-scratch",
    "rlhf-and-alignment",
    "diffusion-models",
    "ml-systems-engineering",
    "reading-ai-papers",
]


@pytest.fixture(scope="session")
def course_slugs():
    return COURSE_SLUGS
