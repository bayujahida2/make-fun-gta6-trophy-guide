"""Take the 3-4 screenshots of the Leonida Trophy Guide for the entry.

  /home/hatch/workspace/airdrop-agent/.venv/bin/python tools/take-shots.py

Starts its own server on :8080, seeds a demo earned set (12 trophies) so the
progress bar shows real progress, and shoots:
  1-cover.jpg    main view, platinum card guide open
  2-roadmap.jpg  the roadmap phases
  3-filters.jpg  grade filter on silver (6 cards)
  4-missable.jpg missable filter with the Positive Mental Attitude guide open
Each shot is 1280x800 JPEG. Existing screenshots/*.jpg are replaced.
"""
import struct
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
SHOTS = REPO / "screenshots"
BASE = "http://127.0.0.1:8080"

DEMO_EARNED = [
    "Just Like Paradise", "Paradise Lost", "Trust",
    "Cunning Stunts", "Master of None", "Stick Fiddler",
    "Baited My Tackle", "Whip It Good", "The Goodtime State",
    "Treat Yo Self", "On the Spot", "Earn Cash, Not Kudos",
]

SHOTS_TO_TAKE = [
    ("1-cover.jpg", "cover"),
    ("2-roadmap.jpg", "roadmap"),
    ("3-filters.jpg", "filters"),
    ("4-missable.jpg", "missable"),
]


def jpeg_size(path):
    """Read width/height out of a JPEG file without Pillow."""
    data = path.read_bytes()
    i = 2
    while i < len(data) - 9:
        if data[i] != 0xFF:
            i += 1
            continue
        marker = data[i + 1]
        if marker in (0xC0, 0xC1, 0xC2):
            height, width = struct.unpack(">HH", data[i + 5:i + 9])
            return width, height
        size = struct.unpack(">H", data[i + 2:i + 4])[0]
        i += 2 + size
    raise ValueError(f"no SOF marker in {path}")


def wait_for_server(proc, timeout=20):
    deadline = time.time() + timeout
    while time.time() < deadline:
        if proc.poll() is not None:
            raise RuntimeError("server exited early")
        try:
            urllib.request.urlopen(BASE + "/", timeout=2)
            return
        except Exception:
            time.sleep(0.3)
    raise RuntimeError("server did not come up")


def main():
    from playwright.sync_api import sync_playwright

    for old in SHOTS.glob("*.jpg"):
        old.unlink()
    for old in SHOTS.glob("*.png"):
        old.unlink()

    server = subprocess.Popen(
        ["node", "serve.ts", "--port", "8080"],
        cwd=REPO,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    try:
        wait_for_server(server)
        with sync_playwright() as pw:
            browser = pw.chromium.launch()
            page = browser.new_page(viewport={"width": 1280, "height": 800})
            page.goto(BASE + "/", wait_until="networkidle")
            page.wait_for_selector(".card", timeout=10000)
            # Seed the demo progress before the first shot.
            page.evaluate(
                "(names) => localStorage.setItem('gta6-trophy-guide-v1', JSON.stringify(names))",
                DEMO_EARNED,
            )
            page.reload(wait_until="networkidle")
            page.wait_for_selector(".card", timeout=10000)

            for filename, kind in SHOTS_TO_TAKE:
                if kind == "cover":
                    # Main view: trophy list with the platinum card's guide open.
                    page.locator(".card").first.locator(".card-head").click()
                    page.wait_for_timeout(300)
                    page.locator(".card").first.scroll_into_view_if_needed()
                    page.evaluate("window.scrollBy(0, -140)")
                    page.wait_for_timeout(200)
                elif kind == "roadmap":
                    page.evaluate("document.querySelector('.roadmap').scrollIntoView()")
                    page.evaluate("window.scrollBy(0, -140)")
                    page.wait_for_timeout(300)
                elif kind == "filters":
                    page.evaluate("window.scrollTo(0, 0)")
                    page.select_option("#gradeFilter", "silver")
                    page.wait_for_timeout(300)
                    page.evaluate("document.querySelector('main h2').scrollIntoView()")
                    page.evaluate("window.scrollBy(0, -140)")
                    page.wait_for_timeout(200)
                elif kind == "missable":
                    page.select_option("#gradeFilter", "all")
                    page.check("#missableOnly")
                    page.wait_for_timeout(300)
                    page.locator(".card").first.locator(".card-head").click()
                    page.wait_for_timeout(300)
                    page.locator(".card").first.scroll_into_view_if_needed()
                    page.wait_for_timeout(200)
                page.screenshot(path=str(SHOTS / filename), type="jpeg", quality=82)
                w, h = jpeg_size(SHOTS / filename)
                size = (SHOTS / filename).stat().st_size
                print(f"{filename}: {w}x{h}, {size} bytes")
                # Reset state for the next shot.
                if kind in ("filters", "missable"):
                    page.select_option("#gradeFilter", "all")
                    page.uncheck("#missableOnly") if kind == "missable" else None
                    page.evaluate("window.scrollTo(0, 0)")
                    page.wait_for_timeout(200)
            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    main()
