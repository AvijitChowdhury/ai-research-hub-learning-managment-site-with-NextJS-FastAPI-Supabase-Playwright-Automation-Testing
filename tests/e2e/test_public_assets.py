"""Public assets: robots.txt, sitemap.xml, llms.txt."""
import allure
import requests

pytestmark = [allure.epic("axiom/lab"), allure.feature("Public Assets")]

BASE = "http://localhost:8080"


def test_robots_txt_200():
    r = requests.get(f"{BASE}/robots.txt")
    assert r.status_code == 200
    assert "User-agent" in r.text or "user-agent" in r.text.lower()


def test_robots_disallows_admin():
    r = requests.get(f"{BASE}/robots.txt")
    assert "/admin" in r.text


def test_robots_references_sitemap():
    r = requests.get(f"{BASE}/robots.txt")
    assert "sitemap" in r.text.lower()


def test_sitemap_xml_200():
    r = requests.get(f"{BASE}/sitemap.xml")
    assert r.status_code == 200
    assert "<urlset" in r.text or "<sitemap" in r.text


def test_sitemap_contains_home():
    r = requests.get(f"{BASE}/sitemap.xml")
    assert "<loc>" in r.text


def test_llms_txt_200():
    r = requests.get(f"{BASE}/llms.txt")
    assert r.status_code == 200
    assert len(r.text) > 20
