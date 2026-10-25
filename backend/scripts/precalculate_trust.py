"""Pre-calcula Trust Scores de la demo contra POST /trust/analyze.

Uso, desde backend/:

    python -m scripts.precalculate_trust
    python -m scripts.precalculate_trust --base-url http://localhost:8000
"""

import argparse
import json
import sys
import time

import httpx

DEMO_POLICIES = (
    ("google", "https://policies.google.com/privacy"),
    ("apple", "https://www.apple.com/legal/privacy/"),
    ("microsoft", "https://privacy.microsoft.com/privacystatement"),
    ("spotify", "https://www.spotify.com/legal/privacy-policy/"),
    ("netflix", "https://help.netflix.com/legal/privacy"),
    ("uber", "https://privacy.uber.com/policy"),
    ("airbnb", "https://www.airbnb.com/help/article/2855"),
    ("paypal", "https://www.paypal.com/legalhub/privacy-full"),
    ("amazon", "https://www.amazon.com/privacy"),
    ("meta", "https://www.facebook.com/privacy/policy/?locale=en_US"),
    ("tiktok", "https://www.tiktok.com/legal/page/us/privacy-policy/en"),
    ("x", "https://x.com/en/privacy"),
    ("mercadolibre", "https://www.mercadolibre.cl/privacidad"),
)


def main() -> int:
    parser = argparse.ArgumentParser(description="Pre-calcula evaluaciones de políticas para la demo.")
    parser.add_argument("--base-url", default="http://localhost:8000")
    parser.add_argument("--url", action="append", dest="urls", help="URL extra de política. Se puede repetir.")
    args = parser.parse_args()

    jobs = list(DEMO_POLICIES)
    for extra in args.urls or []:
        jobs.append((extra, extra))

    results = []
    with httpx.Client(timeout=120.0) as client:
        health = f"{args.base_url.rstrip('/')}/health"
        for _ in range(30):
            try:
                if client.get(health).status_code == 200:
                    break
            except httpx.HTTPError:
                pass
            print("Esperando a que la API termine de arrancar...", file=sys.stderr)
            time.sleep(2)
        else:
            print("La API no respondió en /health.", file=sys.stderr)
            return 1

        for company, url in jobs:
            try:
                response = client.post(
                    f"{args.base_url.rstrip('/')}/trust/analyze",
                    json={"url": url},
                )
                payload = response.json()
            except httpx.HTTPError as error:
                print(f"{company}: error {error}", file=sys.stderr)
                results.append({"company": company, "url": url, "error": str(error)})
                continue

            if response.is_success:
                grade = payload.get("grade")
                total = payload.get("scoreTotal")
                print(f"{company}: {grade} ({total})")
                results.append({"company": company, "url": url, "evaluation": payload})
            else:
                detail = payload.get("detail", response.text)
                print(f"{company}: HTTP {response.status_code} {detail}", file=sys.stderr)
                results.append(
                    {
                        "company": company,
                        "url": url,
                        "error": detail,
                        "status": response.status_code,
                    }
                )

    print(json.dumps(results, ensure_ascii=False, indent=2))
    return 0 if all("evaluation" in item for item in results) else 1


if __name__ == "__main__":
    raise SystemExit(main())
