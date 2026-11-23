"""
Retouche du portrait (À propos) — non destructive : l'original reste dans
tools/source-photos/ (ignoré par git), les sorties vont dans public/media/about/.

    python3 -I tools/retouch-portrait.py tools/source-photos/noah-portrait.jpg

Traitement volontairement sobre (pas d'IA, pas de lissage de peau) :
  1. agrandissement x2 Lanczos (interpolation : n'invente aucun détail)
  2. courbe tonale douce (ombres légèrement relevées, contraste en S)
  3. étalonnage ocre maîtrisé : fond poussé vers l'ocre du site, peau préservée
  4. clarté (micro-contraste grand rayon) + accentuation fine
  5. vignettage léger, grain très fin pour un rendu argentique
Puis deux recadrages : carré (desktop, le geste des mains complet) et 4:5
(mobile, centré sur le visage), exportés en WebP à plusieurs largeurs.
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src = sys.argv[1]
out_dir = sys.argv[2] if len(sys.argv) > 2 else 'public/media/about'

im = Image.open(src).convert('RGB')
W, H = im.size
S = 2
im = im.resize((W * S, H * S), Image.LANCZOS)
a = np.asarray(im).astype(np.float32) / 255.0

# 1. courbe tonale : relève les ombres, contraste en S doux
def curve(x):
    x = np.clip(x, 0, 1)
    lift = x + 0.06 * (1 - x) ** 3 * x * 4          # ombres relevées
    s = lift + 0.07 * np.sin(np.pi * 2 * lift) * -0.5  # S doux
    return np.clip(s, 0, 1)
a = curve(a)

# 2. étalonnage : luminance, saturation par zone
lum = (0.2126 * a[..., 0] + 0.7152 * a[..., 1] + 0.0722 * a[..., 2])[..., None]
r, g, b = a[..., 0], a[..., 1], a[..., 2]
# masque "fond orangé" : rouge dominant, faible bleu, hors peau claire / pull blanc
warm = np.clip((r - b) * 2.2 - 0.25, 0, 1) * np.clip(1.4 - lum[..., 0] * 1.1, 0, 1)
warm = np.asarray(Image.fromarray((warm * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(12 * S))).astype(np.float32) / 255
warm = warm[..., None]
ochre = np.array([0.85, 0.53, 0.20], dtype=np.float32)  # proche de --ochre #d88b2c
graded = a * (1 - 0.18 * warm) + (lum * ochre * 1.55) * (0.18 * warm)
# saturation globale légèrement retenue pour éviter le rendu "filtre"
gl = (0.2126 * graded[..., 0] + 0.7152 * graded[..., 1] + 0.0722 * graded[..., 2])[..., None]
graded = gl + (graded - gl) * 0.94
# noirs neutres et légèrement profonds, blancs du pull un peu crème
graded = np.where(graded < 0.06, graded * 0.9, graded)
a = np.clip(graded, 0, 1)

img = Image.fromarray((a * 255 + 0.5).astype(np.uint8))

# 3. clarté puis accentuation fine
img = img.filter(ImageFilter.UnsharpMask(radius=22 * S, percent=9, threshold=0))
img = img.filter(ImageFilter.UnsharpMask(radius=0.9 * S, percent=55, threshold=3))

# 4. vignettage doux
a = np.asarray(img).astype(np.float32) / 255
h, w = a.shape[:2]
yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
cx, cy = w * 0.49, h * 0.42
d = np.sqrt(((xx - cx) / (w * 0.62)) ** 2 + ((yy - cy) / (h * 0.75)) ** 2)
vig = 1 - 0.22 * np.clip(d - 0.35, 0, 1) ** 1.6
a *= vig[..., None]

# 5. grain très fin (luminance seulement), seed fixe pour un rendu reproductible
rng = np.random.default_rng(7)
grain = rng.normal(0, 0.006, (h, w, 1)).astype(np.float32)
a = np.clip(a + grain, 0, 1)
img = Image.fromarray((a * 255 + 0.5).astype(np.uint8))


def export(box, name, widths):
    crop = img.crop(tuple(int(v * S) for v in box))
    cw = crop.size[0]
    for wd in widths:
        if wd > cw:
            continue
        crop.resize((wd, round(crop.size[1] * wd / cw)), Image.LANCZOS).save(
            f'{out_dir}/{name}-{wd}.webp', 'WEBP', quality=86, method=6)
    print(name, crop.size)

# carré desktop : visage à ~37 % de la hauteur, les deux mains entières
export((182, 0, 182 + 775, 775), 'noah-square', [800, 1200, 1550])
# 4:5 mobile : centré sur le visage, épaules et mains partiellement
export((255, 30, 255 + 596, 30 + 745), 'noah-portrait', [600, 900, 1192])
# version pleine résolution retouchée conservée hors du site
img.save('tools/source-photos/noah-portrait-retouche.jpg', quality=95)
print('full', img.size)
