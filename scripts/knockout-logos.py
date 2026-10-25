#!/usr/bin/env python3
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCES = {
    "mark": ROOT / "app/assets/logo-mark.jpg",
    "wordmark": ROOT / "app/assets/logo-wordmark.jpg",
}
DESTINATIONS = [
    ROOT / "app/assets",
    ROOT / "frontend/public",
]


def knockout(src: Path) -> Image.Image:
    image = Image.open(src).convert("RGBA")
    pixels = list(image.getdata())
    cleaned = []
    for red, green, blue, _alpha in pixels:
        brightness = (red + green + blue) / 3
        if brightness >= 248:
            alpha = 0
        elif brightness >= 200:
            alpha = int(255 * (248 - brightness) / 48)
        else:
            alpha = 255
        cleaned.append((0, 0, 0, alpha))
    image.putdata(cleaned)
    bbox = image.getbbox()
    if bbox:
        pad = 8
        left = max(0, bbox[0] - pad)
        top = max(0, bbox[1] - pad)
        right = min(image.width, bbox[2] + pad)
        bottom = min(image.height, bbox[3] + pad)
        image = image.crop((left, top, right, bottom))
    return image


def main() -> None:
    for name, source in SOURCES.items():
        if not source.exists():
            raise SystemExit(f"Missing source: {source}")
        png = knockout(source)
        for dest_dir in DESTINATIONS:
            dest_dir.mkdir(parents=True, exist_ok=True)
            target = dest_dir / f"logo-{name}.png"
            png.save(target, "PNG")
            print(f"wrote {target}")


if __name__ == "__main__":
    main()
