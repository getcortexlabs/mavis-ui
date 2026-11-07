"""Pixel oracle for actual iOS/Android PNG exports; requires Pillow on the native test host."""
from pathlib import Path
import sys
from PIL import Image
colors = [(255, 0, 0), (0, 255, 0), (0, 0, 255), (255, 255, 0)]
orders = {0: [0, 1, 2, 3], 90: [2, 0, 3, 1], 180: [3, 2, 1, 0], 270: [1, 3, 0, 2]}
for rotation, order in orders.items():
    with Image.open(Path(sys.argv[1]) / f"crop-{rotation}.png") as image:
        assert image.size == (40, 40), (rotation, image.size)
        rgb = image.convert("RGB")
        actual = [rgb.getpixel(point) for point in [(10, 10), (30, 10), (10, 30), (30, 30)]]
        assert actual == [colors[i] for i in order], (rotation, actual, order)
print("Native crop: all four rotations match source pixel quadrants.")
exif_orders = {1: [0, 1, 2, 3], 2: [1, 0, 3, 2], 3: [3, 2, 1, 0], 4: [2, 3, 0, 1], 5: [0, 2, 1, 3], 6: [2, 0, 3, 1], 7: [3, 1, 2, 0], 8: [1, 3, 0, 2]}
for orientation, order in exif_orders.items():
    with Image.open(Path(sys.argv[1]) / f"exif-{orientation}.png") as image:
        rgb = image.convert("RGB")
        actual = [rgb.getpixel(point) for point in [(10, 10), (30, 10), (10, 30), (30, 30)]]
        assert all(abs(a-b) <= 4 for p, i in zip(actual, order) for a, b in zip(p, colors[i])), (orientation, actual, order)
print("Native crop: all eight EXIF orientations, including mirrored images, match expected pixels.")
