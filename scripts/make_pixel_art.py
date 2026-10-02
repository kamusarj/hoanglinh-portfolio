#!/usr/bin/env python3
"""Draw the pixel-art images used by the portfolio: project thumbnails, avatar, favicon.

Run from anywhere:  python3 scripts/make_pixel_art.py   (needs Pillow)
Images are saved at native size; CSS upscales them with `image-rendering: pixelated`.
"""
import math
import random
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "assets" / "images"
W, H = 160, 90

# PICO-8 palette plus its extended colours, keyed by one letter so sprites stay readable.
PAL = {
    "k": "#000000", "n": "#1D2B53", "p": "#7E2553", "g": "#008751",
    "b": "#AB5236", "d": "#5F574F", "l": "#C2C3C7", "w": "#FFF1E8",
    "r": "#FF004D", "o": "#FFA300", "y": "#FFEC27", "G": "#00E436",
    "B": "#29ADFF", "v": "#83769C", "P": "#FF77A8", "c": "#FFCCAA",
    "K": "#291814", "N": "#111D35", "q": "#422136", "t": "#125359",
    "x": "#742F29", "e": "#49333B", "m": "#A28879", "Y": "#F3EF7D",
    "R": "#BE1250", "O": "#FF6C24", "L": "#A8E72E", "T": "#00B543",
    "D": "#065AB5", "V": "#754665", "S": "#FF6E59", "C": "#FF9D81",
}

# 3x5 pixel font, uppercase only.
FONT = {
    "A": (".#.", "#.#", "###", "#.#", "#.#"), "B": ("##.", "#.#", "##.", "#.#", "##."),
    "C": (".##", "#..", "#..", "#..", ".##"), "D": ("##.", "#.#", "#.#", "#.#", "##."),
    "E": ("###", "#..", "##.", "#..", "###"), "F": ("###", "#..", "##.", "#..", "#.."),
    "G": (".##", "#..", "#.#", "#.#", ".##"), "H": ("#.#", "#.#", "###", "#.#", "#.#"),
    "I": ("###", ".#.", ".#.", ".#.", "###"), "J": ("..#", "..#", "..#", "#.#", ".#."),
    "K": ("#.#", "#.#", "##.", "#.#", "#.#"), "L": ("#..", "#..", "#..", "#..", "###"),
    "M": ("#.#", "###", "###", "#.#", "#.#"), "N": ("##.", "#.#", "#.#", "#.#", "#.#"),
    "O": (".#.", "#.#", "#.#", "#.#", ".#."), "P": ("##.", "#.#", "##.", "#..", "#.."),
    "Q": (".#.", "#.#", "#.#", "##.", ".##"), "R": ("##.", "#.#", "##.", "#.#", "#.#"),
    "S": (".##", "#..", ".#.", "..#", "##."), "T": ("###", ".#.", ".#.", ".#.", ".#."),
    "U": ("#.#", "#.#", "#.#", "#.#", "###"), "V": ("#.#", "#.#", "#.#", "#.#", ".#."),
    "W": ("#.#", "#.#", "###", "###", "#.#"), "X": ("#.#", "#.#", ".#.", "#.#", "#.#"),
    "Y": ("#.#", "#.#", ".#.", ".#.", ".#."), "Z": ("###", "..#", ".#.", "#..", "###"),
    "0": ("###", "#.#", "#.#", "#.#", "###"), "1": (".#.", "##.", ".#.", ".#.", "###"),
    "2": ("##.", "..#", ".#.", "#..", "###"), "3": ("##.", "..#", ".#.", "..#", "##."),
    "4": ("#.#", "#.#", "###", "..#", "..#"), "5": ("###", "#..", "##.", "..#", "##."),
    "6": (".##", "#..", "###", "#.#", "###"), "7": ("###", "..#", ".#.", ".#.", ".#."),
    "8": ("###", "#.#", "###", "#.#", "###"), "9": ("###", "#.#", "###", "..#", "##."),
    " ": ("...",) * 5, ".": ("...", "...", "...", "...", ".#."),
    ":": ("...", ".#.", "...", ".#.", "..."), "-": ("...", "...", "###", "...", "..."),
    "+": ("...", ".#.", "###", ".#.", "..."), "=": ("...", "###", "...", "###", "..."),
    "!": (".#.", ".#.", ".#.", "...", ".#."), "$": (".##", "##.", ".#.", ".##", "##."),
    "_": ("...", "...", "...", "...", "###"), ">": ("#..", ".#.", "..#", ".#.", "#.."),
    "<": ("..#", ".#.", "#..", ".#.", "..#"), "{": (".##", ".#.", "##.", ".#.", ".##"),
    "}": ("##.", ".#.", ".##", ".#.", "##."), "/": ("..#", "..#", ".#.", "#..", "#.."),
    "'": (".#.", ".#.", "...", "...", "..."), "%": ("#.#", "..#", ".#.", "#..", "#.#"),
}


def rgb(color):
    color = PAL.get(color, color)
    return tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))


class Canvas:
    def __init__(self, w=W, h=H, bg="k", mode="RGB"):
        fill = rgb(bg) + ((255,) if mode == "RGBA" else ()) if bg else (0, 0, 0, 0)
        self.img = Image.new(mode, (w, h), fill)
        self.draw = ImageDraw.Draw(self.img)

    def px(self, x, y, c):
        if 0 <= x < self.img.width and 0 <= y < self.img.height:
            self.img.putpixel((x, y), rgb(c) + ((255,) if self.img.mode == "RGBA" else ()))

    def rect(self, x, y, w, h, c):
        self.draw.rectangle([x, y, x + w - 1, y + h - 1], fill=rgb(c))

    def box(self, x, y, w, h, c):
        self.draw.rectangle([x, y, x + w - 1, y + h - 1], outline=rgb(c))

    def framed(self, x, y, w, h, fill, outline):
        self.rect(x, y, w, h, outline)
        self.rect(x + 1, y + 1, w - 2, h - 2, fill)

    def line(self, x0, y0, x1, y1, c, width=1):
        self.draw.line([x0, y0, x1, y1], fill=rgb(c), width=width)

    def dashed(self, x0, y0, x1, y1, c, on=2, off=2):
        steps = max(abs(x1 - x0), abs(y1 - y0))
        for i in range(steps + 1):
            if i % (on + off) < on:
                t = i / steps if steps else 0
                self.px(round(x0 + (x1 - x0) * t), round(y0 + (y1 - y0) * t), c)

    def disc(self, cx, cy, r, c):
        self.draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=rgb(c))

    def ring(self, cx, cy, r, c):
        self.draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=rgb(c))

    def oval(self, x0, y0, x1, y1, c, fill=None):
        self.draw.ellipse([x0, y0, x1, y1], outline=rgb(c), fill=rgb(fill) if fill else None)

    def ball(self, cx, cy, r, c, outline="n", shine="w"):
        self.disc(cx, cy, r + 1, outline)
        self.disc(cx, cy, r, c)
        self.px(cx - r // 2, cy - r // 2, shine)

    def dither(self, x, y, w, h, c1, c2):
        for j in range(h):
            for i in range(w):
                self.px(x + i, y + j, c1 if (i + j) % 2 else c2)

    def vgrad(self, x, y, w, h, colors):
        """Vertical bands of colour with a dithered row at every seam."""
        band = h / len(colors)
        for j in range(h):
            k = min(int(j / band), len(colors) - 1)
            c = colors[k]
            seam = k + 1 < len(colors) and int((j + 1) / band) > k
            for i in range(w):
                self.px(x + i, y + j, colors[k + 1] if seam and (i + j) % 2 else c)

    def text(self, x, y, s, c):
        for ch in s.upper():
            for j, row in enumerate(FONT.get(ch, FONT[" "])):
                for i, bit in enumerate(row):
                    if bit == "#":
                        self.px(x + i, y + j, c)
            x += 4

    def sprite(self, x, y, rows, colors=None):
        for j, row in enumerate(rows):
            for i, ch in enumerate(row):
                if ch != ".":
                    self.px(x + i, y + j, (colors or {}).get(ch, ch))

    def save(self, path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self.img.save(path, optimize=True)
        print(f"wrote {path.relative_to(ROOT)}")


def text_width(s):
    return len(s) * 4 - 1


def sparkle(cv, x, y, c="y"):
    cv.px(x, y, "w")
    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
        cv.px(x + dx, y + dy, c)


def check(cv, x, y, c="T"):
    cv.sprite(x, y, ("....#", "...##", "#.##.", "###..", ".#..."), {"#": c})


def wood(cv, y, h, top="b", front="x", grain="K", seed=1):
    rnd = random.Random(seed)
    cv.rect(0, y - 1, W, 1, grain)
    cv.rect(0, y, W, 3, top)
    cv.rect(0, y, W, 1, "C")
    cv.rect(0, y + 3, W, h - 3, front)
    for _ in range(14):
        gx, gy = rnd.randrange(W), rnd.randrange(y + 5, y + h)
        cv.rect(gx, gy, rnd.randrange(4, 12), 1, grain)


# --------------------------------------------------------------------------- Deka


def draw_deka():
    cv = Canvas()
    cv.vgrad(0, 0, W, 70, ["#D8F6FF", "#C2EEFF", "#A9E4FF"])
    wood(cv, 70, 20, seed=3)

    # Chalkboard with Natural Science notes.
    cv.framed(4, 6, 56, 38, "b", "K")
    cv.rect(7, 9, 50, 32, "t")
    rnd = random.Random(7)
    for _ in range(40):
        cv.px(rnd.randrange(7, 57), rnd.randrange(9, 41), "g")
    cv.text(10, 12, "KHTN 8", "w")
    cv.text(10, 21, "H2O+CO2", "Y")
    cv.text(10, 30, "F=M.A", "w")
    cv.oval(39, 23, 53, 29, "B")
    cv.oval(43, 19, 49, 33, "P")
    cv.disc(46, 26, 1, "r")
    cv.px(39, 26, "y")
    cv.px(46, 19, "y")
    cv.rect(5, 43, 54, 2, "m")
    cv.rect(12, 42, 5, 1, "w")
    cv.rect(20, 42, 3, 1, "y")

    # Clipboard with the generated exam: header, matrix, answers, score.
    cv.rect(68, 12, 42, 59, "d")
    cv.framed(66, 10, 42, 60, "m", "K")
    cv.rect(69, 15, 36, 52, "w")
    cv.rect(69, 66, 36, 1, "l")
    cv.framed(79, 7, 16, 6, "l", "d")
    cv.rect(83, 6, 8, 2, "d")
    cv.text(71, 18, "EXAM", "n")
    cv.ring(98, 21, 5, "r")
    cv.text(95, 19, "10", "r")
    for col in range(5):
        cv.rect(71 + col * 6, 28, 1, 13, "v")
    for row in range(4):
        cv.rect(71, 28 + row * 4, 25, 1, "v")
    for col, row, c in ((0, 0, "G"), (1, 0, "G"), (2, 0, "y"), (0, 1, "G"), (1, 1, "y"),
                        (3, 1, "o"), (2, 2, "y"), (3, 2, "o")):
        cv.rect(72 + col * 6, 29 + row * 4, 5, 3, c)
    for i, y in enumerate((45, 51, 57)):
        cv.ring(72, y + 1, 1, "n")
        cv.rect(76, y, 18, 1, "l")
        cv.rect(76, y + 2, 11, 1, "l")
        check(cv, 97, y - 1)
    cv.ring(72, 64, 1, "n")
    cv.rect(76, 63, 14, 1, "l")

    # Pencil resting on the desk.
    cv.rect(62, 73, 2, 3, "d")
    cv.rect(64, 72, 3, 5, "c")
    cv.rect(67, 72, 24, 5, "y")
    cv.rect(67, 72, 24, 1, "Y")
    cv.rect(67, 76, 24, 1, "o")
    cv.rect(91, 72, 3, 5, "l")
    cv.rect(94, 72, 4, 5, "P")

    # Robot assistant.
    cv.line(124, 21, 124, 26, "d")
    cv.ball(124, 20, 1, "r")
    cv.framed(113, 26, 23, 17, "w", "n")
    cv.rect(116, 29, 17, 10, "N")
    cv.rect(119, 31, 3, 3, "B")
    cv.rect(127, 31, 3, 3, "B")
    cv.rect(120, 36, 9, 1, "B")
    cv.px(119, 35, "B")
    cv.px(129, 35, "B")
    cv.px(117, 37, "P")
    cv.px(131, 37, "P")
    cv.rect(111, 31, 2, 6, "d")
    cv.rect(136, 31, 2, 6, "d")
    cv.rect(121, 43, 7, 2, "d")
    cv.framed(112, 45, 25, 22, "l", "n")
    cv.framed(117, 49, 15, 9, "w", "n")
    cv.px(120, 53, "r"), cv.px(124, 53, "y"), cv.px(128, 53, "G")
    cv.rect(115, 60, 19, 1, "d")
    cv.rect(115, 67, 7, 3, "n")
    cv.rect(127, 67, 7, 3, "n")
    cv.framed(137, 48, 9, 4, "l", "n")

    # Exported .docx pile with a download arrow.
    for i, y in enumerate((61, 57, 53)):
        cv.framed(144 - i, y, 14, 9, "w", "n")
    cv.rect(144, 46, 12, 9, "D")
    cv.text(146, 48, "W", "w")
    cv.rect(149, 37, 2, 5, "G")
    cv.sprite(147, 41, ("######", ".####.", "..##.."), {"#": "G"})

    for x, y in ((107, 24), (141, 22), (139, 34), (8, 52)):
        sparkle(cv, x, y)
    # Book stack on the left of the desk.
    for i, (c, w) in enumerate((("r", 30), ("B", 26), ("G", 28))):
        cv.framed(6 + i, 63 - i * 5, w, 5, c, "n")
        cv.rect(8 + i, 64 - i * 5, w - 6, 1, "w")
    return cv


# --------------------------------------------------------------------------- UEBA


def draw_ueba():
    cv = Canvas(bg="N")
    for x in range(0, W, 8):
        cv.rect(x, 0, 1, 74, "n")
    for y in range(0, 74, 8):
        cv.rect(0, y, W, 1, "n")
    cv.rect(0, 74, W, 16, "e")
    cv.rect(0, 74, W, 1, "V")

    # Monitor with the risk-score timeline and an anomaly spike.
    cv.framed(6, 6, 98, 58, "d", "k")
    cv.rect(9, 9, 92, 50, "k")
    for x in range(9, 101, 6):
        for y in range(9, 59, 2):
            cv.px(x, y, "N")
    cv.rect(50, 64, 12, 7, "d")
    cv.rect(42, 71, 28, 3, "d")
    cv.text(12, 12, "RISK", "l")
    cv.framed(77, 11, 23, 9, "r", "R")
    cv.text(79, 13, "ALERT", "w")
    cv.dashed(10, 32, 99, 32, "o", 3, 2)

    rnd = random.Random(11)
    pts = []
    for x in range(10, 100, 3):
        y = 50 + rnd.randint(-4, 3)
        y = {64: 44, 67: 34, 70: 17, 73: 36, 76: 46}.get(x, y)
        pts.append((x, y))
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        for x in range(x0, x1 + 1):
            yy = round(y0 + (y1 - y0) * (x - x0) / (x1 - x0))
            for y in range(yy + 1, 57):
                if (x + y) % 2 == 0:
                    cv.px(x, y, "D")
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        spike = y0 < 44 or y1 < 44
        cv.line(x0, y0, x1, y1, "r" if spike else "B")
    cv.ring(70, 17, 4, "y")
    cv.ring(70, 17, 5, "r")

    # LLM explanation bubble.
    cv.framed(12, 20, 34, 10, "w", "l")
    cv.rect(15, 23, 20, 1, "d")
    cv.rect(15, 26, 26, 1, "d")
    cv.sprite(46, 24, ("#..", "##.", "###"), {"#": "w"})
    cv.framed(50, 22, 7, 7, "B", "w")
    cv.px(52, 24, "k"), cv.px(54, 24, "k")
    cv.rect(52, 26, 3, 1, "k")

    # Shield with an eye: behaviour monitoring.
    for j in range(40):
        half = 15 if j < 20 else round(15 - (j - 20) * 0.78)
        cv.rect(131 - half - 1, 8 + j, 2 * half + 3, 1, "w")
    for j in range(1, 39):
        half = 13 if j < 20 else round(13 - (j - 20) * 0.75)
        cv.rect(131 - half, 8 + j, 2 * half + 1, 1, "D" if j % 6 else "n")
    cv.oval(120, 21, 142, 33, "w", fill="w")
    cv.disc(131, 27, 4, "B")
    cv.disc(131, 27, 2, "k")
    cv.px(129, 25, "w")

    # Endpoint laptops streaming logs to the shield.
    for i, x in enumerate((110, 125, 140)):
        cv.dashed(x + 6, 61, 131 - (1 - i) * 4, 49, "v", 1, 1)
        cv.framed(x, 62, 13, 9, "n", "l")
        cv.px(x + 6, 66, "r" if i == 2 else "G")
        cv.rect(x - 2, 71, 17, 2, "l")
    return cv


# --------------------------------------------------------------------------- VLA


def draw_vla():
    cv = Canvas()
    cv.vgrad(0, 0, W, 64, ["#F4F7FB", "#E3E8EF", "#D3DAE3"])
    cv.rect(0, 63, W, 1, "d")
    cv.rect(0, 64, W, 3, "w")
    cv.rect(0, 67, W, 23, "l")
    cv.rect(0, 67, W, 1, "d")
    for x in (10, 150):
        cv.rect(x, 68, 4, 22, "d")

    # Wall screen: open-loop plot, ground truth vs prediction with inference points.
    cv.framed(94, 4, 60, 34, "N", "k")
    cv.text(97, 7, "OPEN-LOOP", "l")
    cv.rect(97, 14, 1, 21, "v")
    cv.rect(97, 34, 54, 1, "v")
    for x in range(98, 151):
        t = (x - 98) / 52
        gt = 24 - round(8 * math.sin(t * 5.2))
        pred = gt + round(1.5 * math.sin(t * 17))
        cv.px(x, gt, "o")
        cv.px(x, pred + 1, "G")
        if (x - 98) % 9 == 0:
            cv.px(x, gt - 1, "r")

    # Instruction bubble: the language part of a VLA policy.
    cv.framed(4, 4, 52, 11, "w", "n")
    cv.text(7, 7, "PICK UP CUP", "n")
    cv.sprite(30, 15, ("###", ".##", "..#"), {"#": "n"})
    cv.px(31, 14, "w"), cv.px(32, 14, "w")

    # UR-style arm: grey links, blue joint caps, gripper over the cup.
    cv.framed(16, 58, 30, 6, "d", "k")
    cv.framed(24, 47, 14, 11, "l", "d")
    cv.rect(23, 45, 16, 3, "B")
    cv.line(31, 42, 58, 18, "d", 9)
    cv.line(31, 42, 58, 18, "l", 6)
    cv.line(58, 18, 84, 34, "d", 8)
    cv.line(58, 18, 84, 34, "l", 5)
    cv.line(84, 34, 84, 46, "d", 7)
    cv.line(84, 34, 84, 46, "l", 4)
    for x, y, r in ((31, 42, 6), (58, 18, 6), (84, 34, 4)):
        cv.disc(x, y, r + 1, "n")
        cv.disc(x, y, r, "D")
        cv.disc(x, y, r - 2, "B")
        cv.px(x - 1, y - 1, "w")
    cv.rect(77, 46, 15, 3, "k")
    cv.rect(77, 49, 2, 7, "k")
    cv.rect(90, 49, 2, 7, "k")
    cv.dashed(66, 24, 70, 40, "B", 1, 2)

    # Cup and carrot on the table, camera on a tripod.
    cv.framed(80, 53, 10, 11, "r", "R")
    cv.rect(81, 54, 8, 1, "P")
    cv.rect(82, 56, 1, 6, "P")
    cv.oval(89, 55, 93, 60, "R")
    cv.sprite(100, 56, (
        "..........GG.",
        ".....oooo.TG.",
        "oooOooooooGGT",
        ".oooooOooo.T.",
        "...oooo......",
    ))
    cv.line(144, 48, 137, 63, "k")
    cv.line(144, 48, 151, 63, "k")
    cv.line(144, 48, 144, 63, "k")
    cv.framed(136, 39, 17, 10, "d", "k")
    cv.disc(141, 44, 3, "k")
    cv.disc(141, 44, 2, "D")
    cv.px(140, 43, "B")
    cv.px(150, 41, "r")
    for x, y in ((66, 6), (72, 12), (115, 47)):
        sparkle(cv, x, y, "B")
    return cv


# --------------------------------------------------------------------------- GAN segmentation

# LoveDA class colours used by the mask (background, building, road, water, barren, forest, farm).
MASK = {0: "w", 1: "r", 2: "y", 3: "D", 4: "v", 5: "G", 6: "c"}
PHOTO = {
    1: ("#C9C1B8", "#8C8279"), 2: ("#8F8A84", "#A9A39B"), 3: ("#2C5F8A", "#3B76A6"),
    4: ("#B79878", "#A08060"), 5: ("#2E5E3A", "#3E7A45"),
}


def land_cover(w, h):
    grid = [[6] * w for _ in range(h)]

    def paint_disc(cx, cy, r, cls):
        for y in range(max(0, cy - r), min(h, cy + r + 1)):
            for x in range(max(0, cx - r), min(w, cx + r + 1)):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    grid[y][x] = cls

    for cx, cy, r in ((14, 10, 9), (24, 18, 7), (104, 52, 8), (146, 44, 9), (150, 12, 6)):
        paint_disc(cx, cy, r, 5)
    for cx, cy, r in ((36, 54, 6), (92, 12, 5), (128, 58, 4)):
        paint_disc(cx, cy, r, 4)
    for x in range(w):
        mid = 30 + round(9 * math.sin(x / 15))
        for y in range(mid - 3, mid + 3):
            if 0 <= y < h:
                grid[y][x] = 3
    for x in range(w):
        for y in (46, 47):
            grid[y][x] = 2
    for x in (56, 57, 120, 121):
        for y in range(h):
            grid[y][x] = 2
    for bx, by in ((60, 49), (66, 49), (72, 49), (60, 54), (72, 54), (66, 59), (60, 59),
                   (44, 49), (50, 49), (44, 40), (124, 49), (130, 49), (136, 49), (124, 38),
                   (130, 38), (124, 54), (110, 49), (104, 40)):
        for y in range(by, by + 4):
            for x in range(bx, bx + 5):
                if grid[y][x] != 2:
                    grid[y][x] = 1
    return grid


def draw_gan_seg():
    cv = Canvas(bg="N")
    rnd = random.Random(5)
    for _ in range(26):
        cv.px(rnd.randrange(W), rnd.randrange(24), "w" if rnd.random() < 0.6 else "B")

    top, h = 26, H - 26
    grid = land_cover(W, h)
    for y in range(h):
        for x in range(W):
            cls = grid[y][x]
            if x >= 80:
                c = MASK[cls]
            elif cls == 6:
                parcel = (x // 9 + (y // 7) * 3) % 3
                c = ("#9AAE57", "#B8B36A", "#7F9A4A")[parcel]
                if y % 2 == 0 and parcel != 2:
                    c = "#8DA14F" if parcel == 0 else "#AAA35F"
            elif cls == 1:
                c = PHOTO[1][1] if (x % 5 == 4 or y % 4 == 3) else PHOTO[1][0]
                if (x // 5 + y // 4) % 3 == 0 and x % 5 != 4 and y % 4 != 3:
                    c = "#A85C4A"
            else:
                a, b = PHOTO[cls]
                c = b if rnd.random() < 0.3 else a
            cv.px(x, top + y, c)
    cv.rect(0, top - 1, W, 1, "k")

    # Before/after slider between the satellite image and the predicted mask.
    cv.rect(79, top, 1, h, "k")
    cv.rect(80, top, 1, h, "w")
    cv.rect(81, top, 1, h, "k")
    cv.framed(74, 52, 13, 9, "w", "k")
    cv.sprite(76, 54, (".#...#.", "##...##", ".#...#."), {"#": "k"})
    for x, y, label in ((3, top + 3, "IMAGE"), (W - 3 - text_width("MASK") - 4, top + 3, "MASK")):
        cv.rect(x, y, text_width(label) + 4, 9, "k")
        cv.text(x + 2, y + 2, label, "w")

    # Satellite beaming down.
    cv.dashed(80, 17, 52, 25, "Y", 2, 2)
    cv.dashed(80, 17, 108, 25, "Y", 2, 2)
    cv.framed(60, 8, 15, 7, "D", "k")
    cv.framed(85, 8, 15, 7, "D", "k")
    for x in (64, 68, 72, 89, 93, 97):
        cv.rect(x, 9, 1, 5, "B")
    cv.rect(75, 11, 10, 1, "l")
    cv.framed(75, 6, 10, 11, "o", "k")
    cv.rect(76, 7, 8, 1, "Y")
    cv.rect(78, 17, 4, 2, "l")
    cv.ring(80, 3, 2, "l")
    return cv


# --------------------------------------------------------------------------- Research system


def draw_research():
    cv = Canvas(bg="#E9E4F4")
    for y in range(2, H, 6):
        for x in range(2, W, 6):
            cv.px(x, y, "#CFC6E3")

    nodes = {
        "hub": (88, 44, 6, "p"), "a": (66, 20, 4, "B"), "b": (108, 16, 4, "G"),
        "c": (116, 46, 4, "o"), "d": (102, 72, 4, "r"), "e": (72, 70, 4, "y"),
        "f": (62, 44, 3, "v"), "g": (128, 26, 3, "P"), "h": (86, 16, 3, "T"),
    }
    edges = [("hub", k) for k in "abcdef"] + [("a", "h"), ("h", "b"), ("b", "g"), ("g", "c"),
                                              ("c", "d"), ("e", "f"), ("f", "a")]
    for u, v in edges:
        cv.line(nodes[u][0], nodes[u][1], nodes[v][0], nodes[v][1], "n")
    for x, y, r, c in nodes.values():
        cv.ball(x, y, r, c)

    # Source cards feeding the graph.
    for i, (label, icon) in enumerate((("REPO", "code"), ("RSS", "rss"), ("PAPER", "pdf"))):
        y = 8 + i * 26
        cv.rect(6, y + 2, 40, 20, "#CFC6E3")
        cv.framed(4, y, 40, 20, "w", "n")
        if icon == "code":
            cv.rect(7, y + 3, 13, 9, "n")
            cv.text(9, y + 5, "{}", "G")
        elif icon == "rss":
            cv.rect(7, y + 3, 13, 9, "o")
            cv.sprite(10, y + 4, ("##...", "..#..", "#..#.", ".#..#", "#.#.#"), {"#": "w"})
        else:
            cv.rect(7, y + 3, 13, 9, "r")
            cv.text(8, y + 5, "PDF", "w")
        cv.text(22, y + 5, label, "n")
        cv.rect(7, y + 14, 32, 1, "l")
        cv.rect(7, y + 16, 20, 1, "l")
        cv.dashed(45, y + 10, nodes["f"][0] - 4, nodes["f"][1] + (i - 1) * 3, "v", 2, 2)

    # Magnifier over the graph.
    cv.line(112, 64, 121, 73, "n", 5)
    cv.line(112, 64, 120, 72, "b", 3)
    cv.ring(104, 56, 9, "n")
    cv.ring(104, 56, 8, "n")
    cv.px(99, 51, "w"), cv.px(100, 50, "w"), cv.px(98, 52, "w")

    # Database + dataset export.
    cv.oval(132, 52, 154, 58, "n", fill="B")
    cv.rect(132, 55, 23, 22, "n")
    cv.rect(133, 55, 21, 22, "D")
    cv.oval(132, 73, 154, 79, "n", fill="D")
    cv.rect(133, 72, 21, 4, "D")
    for y in (61, 67):
        cv.rect(133, y, 21, 1, "B")
    cv.text(139, 64, "PG", "w")
    cv.oval(133, 52, 153, 57, "B", fill="B")
    cv.framed(134, 6, 20, 24, "w", "n")
    cv.rect(146, 6, 8, 6, "#E9E4F4")
    cv.line(146, 6, 153, 13, "n")
    cv.text(136, 15, "JSON", "n")
    cv.rect(137, 22, 14, 1, "l")
    cv.rect(137, 25, 10, 1, "l")
    cv.rect(143, 34, 2, 6, "G")
    cv.sprite(140, 40, ("########", ".######.", "..####..", "...##..."), {"#": "G"})
    return cv


# --------------------------------------------------------------------------- SSH Sentinel


def draw_ssh():
    cv = Canvas()
    cv.vgrad(0, 0, W, 72, ["#1B1030", "#2A1B3D", "#3B2556"])
    wood(cv, 72, 18, top="m", front="e", grain="q", seed=9)

    # Workstation monitor showing the GNOME top bar indicator and a popup.
    cv.framed(80, 4, 76, 56, "k", "d")
    cv.vgrad(83, 7, 70, 50, ["#065AB5", "#3A4FA0", "#7E2553"])
    cv.rect(83, 7, 70, 7, "k")
    cv.rect(85, 10, 3, 1, "w"), cv.rect(89, 10, 1, 1, "l"), cv.rect(91, 10, 1, 1, "l")
    cv.text(105, 8, "09:41", "w")
    cv.rect(128, 8, 23, 5, "T")
    cv.rect(129, 7, 21, 7, "T")
    cv.text(130, 8, "SSH 2", "w")
    cv.framed(108, 17, 44, 17, "k", "d")
    cv.ball(112, 22, 1, "G", "k", "w")
    cv.text(115, 20, "SSH IN", "w")
    cv.text(115, 27, "USER 2", "l")
    cv.framed(88, 38, 26, 16, "N", "l")
    cv.rect(88, 38, 26, 3, "l")
    cv.text(90, 43, "$", "G")
    cv.rect(94, 43, 12, 1, "l")
    cv.rect(94, 46, 8, 1, "l")
    cv.rect(90, 49, 3, 3, "G")
    cv.rect(113, 60, 12, 8, "d")
    cv.rect(104, 68, 30, 4, "d")

    # Laptop with the outgoing SSH session.
    cv.framed(8, 30, 48, 34, "N", "d")
    cv.rect(9, 31, 46, 4, "e")
    cv.px(11, 32, "r"), cv.px(13, 32, "y"), cv.px(15, 32, "G")
    cv.text(11, 38, "$ SSH WS", "G")
    cv.text(11, 46, "LINKED", "l")
    cv.text(11, 54, "$", "G")
    cv.rect(15, 54, 3, 5, "G")
    cv.framed(3, 64, 58, 6, "l", "d")
    cv.rect(26, 66, 12, 2, "d")

    # Encrypted tunnel: dashed link, key, packets.
    cv.dashed(57, 48, 87, 48, "Y", 2, 2)
    for x in (61, 70, 79):
        cv.rect(x, 47, 3, 3, "G")
    cv.ring(66, 30, 3, "y")
    cv.ring(66, 30, 2, "o")
    cv.rect(69, 30, 9, 2, "y")
    cv.rect(74, 32, 2, 3, "y")
    cv.rect(77, 32, 1, 2, "y")
    for x, y in ((60, 20), (76, 22), (72, 40)):
        sparkle(cv, x, y)
    # Mug on the desk.
    cv.framed(64, 63, 9, 9, "w", "n")
    cv.oval(72, 65, 75, 69, "n")
    cv.rect(65, 64, 7, 2, "x")
    cv.px(66, 60, "l"), cv.px(67, 59, "l"), cv.px(69, 60, "l"), cv.px(70, 58, "l")
    return cv


# --------------------------------------------------------------------------- Avatar & favicon

AVATAR = (
    "................................",
    "...............rr...............",
    "..............rrrr..............",
    "...............dd...............",
    "...............dd...............",
    "......oooooooooooooooooooo......",
    ".....o.nnnnnnnnnnnnnnnnnn.o.....",
    "....o.nwwwwwwwwwwwwwwwwwwn.o....",
    "....onwwwwwwwwwwwwwwwwwwwwno....",
    "...ooonwwnnnnnnnnnnnnnnwwnooo...",
    "..oOOonwnNNNNNNNNNNNNNNnwnoOOo..",
    "..oOOonwnNNNNNNNNNNNNNNnwnoOOo..",
    "..oOOonwnNNGGNNNNNNGGNNnwnoOOo..",
    "..oOOonwnNGGGGNNNNGGGGNnwnoOOo..",
    "..oOOonwnNNNNNNNNNNNNNNnwnoOOo..",
    "..oOOonwnNNNNNNNNNNNNNNnwnoOOo..",
    "..oOOonwnNNNNGGGGGGNNNNnwnoOOo..",
    "..oOOonwnNNNNNGGGGNNNNNnwnoOOo..",
    "...ooonwnNNNNNNNNNNNNNNnwnooo...",
    "......nwwnnnnnnnnnnnnnnwwn......",
    "......nwPPwwwwwwwwwwwwPPwn......",
    "......nwwwwwwwwwwwwwwwwwwn......",
    ".......nnnnnnnnnnnnnnnnnn.......",
    "............nddddddn............",
    ".......nnnnnnnnnnnnnnnnnn.......",
    "......nBBBBBBBBBBBBBBBBBBn......",
    ".....nBBBBBBBwwwwBBBBBBBBBn.....",
    ".....nBBBBBBwwrrwwBBBBBBBBn.....",
    ".....nBBBBBBBwwwwBBBBBBBBBn.....",
    ".....nBBBBBBBBBBBBBBBBBBBBn.....",
    ".....nBBBBBBBBBBBBBBBBBBBBn.....",
    ".....nnnnnnnnnnnnnnnnnnnnnn.....",
)

FAVICON = (
    ".......rr.......",
    ".......dd.......",
    "..nnnnnnnnnnnn..",
    ".nwwwwwwwwwwwwn.",
    ".nwnnnnnnnnnnwn.",
    "dnwnNGGNNGGNnwnd",
    "dnwnNGGNNGGNnwnd",
    ".nwnNNNNNNNNnwn.",
    ".nwnNNGGGGNNnwn.",
    ".nwnnnnnnnnnnwn.",
    ".nwwwwwwwwwwwwn.",
    "..nnnnnnnnnnnn..",
    "....nBBBBBBn....",
    "...nBBBwwBBBn...",
    "...nBBBBBBBBn...",
    "...nnnnnnnnnn...",
)


def draw_avatar():
    cv = Canvas(32, 32, bg=None, mode="RGBA")
    cv.sprite(0, 0, AVATAR)
    return cv


def write_favicon(path):
    rects = []
    for y, row in enumerate(FAVICON):
        x = 0
        while x < len(row):
            ch = row[x]
            run = 1
            while x + run < len(row) and row[x + run] == ch:
                run += 1
            if ch != ".":
                rects.append(f'<rect x="{x}" y="{y}" width="{run}" height="1" fill="{PAL[ch]}"/>')
            x += run
    svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">'
           + "".join(rects) + "</svg>\n")
    path.write_text(svg)
    print(f"wrote {path.relative_to(ROOT)}")


def main():
    scenes = {
        "deka": draw_deka, "ueba": draw_ueba, "vla": draw_vla,
        "gan-seg": draw_gan_seg, "research-system": draw_research, "ssh-sentinel": draw_ssh,
    }
    for name, draw in scenes.items():
        draw().save(IMAGES / "projects" / f"{name}.png")
    draw_avatar().save(IMAGES / "avatar.png")
    write_favicon(ROOT / "assets" / "favicon.svg")


if __name__ == "__main__":
    main()
