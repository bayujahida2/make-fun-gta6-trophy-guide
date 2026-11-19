"""Smoke test for the Leonida Trophy Guide (starts its own server on :8080).

  /home/hatch/workspace/airdrop-agent/.venv/bin/python tools/smoke.py

Checks: the app loads with zero external network requests and no console
errors; all 55 trophies render; toggling a trophy saves to localStorage and
survives a reload; export/import round-trips progress; the grade filter,
search, missable filter and spoiler setting work; the progress bar updates.
"""
import json
import struct
import subprocess
import sys
import time
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
VENV_PY = "/home/hatch/workspace/airdrop-agent/.venv/bin/python"
BASE = "http://127.0.0.1:8080"
TMP = Path("/tmp/gta6-trophy-smoke")
TMP.mkdir(exist_ok=True)

CHECKS = []


def check(name, ok, detail=""):
    CHECKS.append((name, ok, detail))
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f"  ({detail})" if detail else ""))


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
            context = browser.new_context(viewport={"width": 1280, "height": 800})
            page = context.new_page()
            requests = []
            errors = []
            page.on("request", lambda r: requests.append(r.url))
            page.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            page.on("pageerror", lambda e: errors.append(str(e)))

            page.goto(BASE + "/", wait_until="networkidle")
            page.wait_for_selector(".card", timeout=10000)

            external = [u for u in requests if not u.startswith("http://127.0.0.1:8080")]
            check("zero external network requests", not external, f"{len(requests)} requests, {len(external)} external")
            check("no console/page errors", not errors, "; ".join(errors[:2]))

            cards = page.locator(".card")
            check("55 trophies render", cards.count() == 55, f"{cards.count()} cards")

            # Toggle one trophy, check persistence across reload.
            first_box = page.locator(".card input[type=checkbox]").first
            first_box.click()
            page.wait_for_timeout(200)
            stored = page.evaluate("JSON.parse(localStorage.getItem('gta6-trophy-guide-v1') || '[]')")
            check("toggle saves to localStorage", stored == ["Vice Got a Price!"], str(stored))
            check("progress bar updates", "1 of 55 earned" in page.locator("#progressText").inner_text())
            page.reload(wait_until="networkidle")
            page.wait_for_selector(".card", timeout=10000)
            check(
                "earned state survives reload",
                page.locator(".card input[type=checkbox]").first.is_checked(),
            )

            # Export, reset, import round-trip.
            with page.expect_download() as dl:
                page.click("#exportBtn")
            download = dl.value
            exported_path = TMP / "exported.json"
            download.save_as(exported_path)
            exported = json.loads(exported_path.read_text())
            check("export writes earned list", exported.get("earned") == ["Vice Got a Price!"])
            page.on("dialog", lambda d: d.accept())
            page.click("#resetBtn")
            page.wait_for_timeout(200)
            check("reset clears progress", "0 of 55 earned" in page.locator("#progressText").inner_text())
            page.set_input_files("#importFile", str(exported_path))
            page.wait_for_timeout(300)
            check(
                "import restores progress",
                "1 of 55 earned" in page.locator("#progressText").inner_text()
                and page.locator(".card input[type=checkbox]").first.is_checked(),
            )

            # Filters and search.
            page.select_option("#gradeFilter", "silver")
            page.wait_for_timeout(200)
            check("grade filter silver shows 6", page.locator(".card").count() == 6)
            page.select_option("#gradeFilter", "all")
            page.fill("#search", "meditate at every spot")
            page.wait_for_timeout(200)
            check(
                "search 'meditate at every spot' shows 1",
                page.locator(".card").count() == 1
                and "Positive Mental Attitude" in page.locator(".card h3").first.inner_text(),
            )
            page.fill("#search", "")
            page.check("#missableOnly")
            page.wait_for_timeout(200)
            check(
                "missable filter shows 1",
                page.locator(".card").count() == 1
                and "Positive Mental Attitude" in page.locator(".card h3").first.inner_text(),
            )
            page.uncheck("#missableOnly")

            # Spoiler setting masks story/hidden names until earned.
            # (The first card is the platinum, already earned above, so the
            # second card, Just Like Paradise, is the one that must mask.)
            page.check("#spoilerToggle")
            page.wait_for_timeout(200)
            second_name = page.locator(".card h3").nth(1).inner_text()
            check("spoiler setting masks story trophies", second_name == "Hidden trophy", f"second card shows {second_name!r}")
            page.uncheck("#spoilerToggle")
            page.wait_for_timeout(200)
            check(
                "spoiler off shows names again",
                page.locator(".card h3").nth(1).inner_text() == "Just Like Paradise",
            )

            # Second toggle moves the progress bar.
            page.locator(".card input[type=checkbox]").nth(1).click()
            page.wait_for_timeout(200)
            check("progress bar reaches 2 of 55", "2 of 55 earned" in page.locator("#progressText").inner_text())

            browser.close()
    finally:
        server.terminate()
        try:
            server.wait(timeout=5)
        except subprocess.TimeoutExpired:
            server.kill()

    failed = [c for c in CHECKS if not c[1]]
    print(f"\n{len(CHECKS) - len(failed)}/{len(CHECKS)} checks passed")
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
