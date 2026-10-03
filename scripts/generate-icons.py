from pathlib import Path

from PIL import Image, ImageDraw

PUBLIC = Path(__file__).resolve().parents[1] / "public"
ORANGE = (244, 160, 60, 255)
INK = (17, 17, 17, 255)
WHITE = (255, 255, 255, 255)


def draw_mark(size: int) -> Image.Image:
    image = Image.new("RGBA", (size, size), WHITE)
    draw = ImageDraw.Draw(image)
    margin = size * 0.16
    left = margin
    top = margin
    side = size - margin * 2
    cell = side / 3
    stroke = max(2, round(size * 0.035))

    draw.rounded_rectangle(
        [left, top, left + side, top + side],
        radius=size * 0.04,
        outline=INK,
        width=stroke,
    )
    for step in (1, 2):
        position = left + cell * step
        draw.line([(position, top), (position, top + side)], fill=INK, width=stroke)
        draw.line([(left, position), (left + side, position)], fill=INK, width=stroke)

    pad = stroke
    draw.rectangle(
        [left + cell + pad, top + cell + pad, left + cell * 2 - pad, top + cell * 2 - pad],
        fill=ORANGE,
    )
    return image


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)
    draw_mark(180).save(PUBLIC / "apple-touch-icon.png")
    draw_mark(192).save(PUBLIC / "icon-192.png")
    draw_mark(512).save(PUBLIC / "icon-512.png")
    draw_mark(32).save(PUBLIC / "favicon.png")


if __name__ == "__main__":
    main()
