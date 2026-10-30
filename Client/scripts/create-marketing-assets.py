"""Regenerate derived marketing assets from FitSwap's existing artwork (Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parents[1]
images = root / 'src/assets/images'
output = images / 'optimized'
output.mkdir(exist_ok=True)
art = Image.open(images / 'fitswap-3d-membership-cutout.png').convert('RGBA')
for width in (360, 640, 1024):
    art.resize((width, round(width * art.height / art.width)), Image.Resampling.LANCZOS).save(output / f'membership-{width}.webp', quality=86, method=6)
for name, width in [('member-dashboard-gym', 960), ('dashboard-hero', 1280)]:
    img = Image.open(images / f'{name}.png').convert('RGB')
    img.resize((width, round(width * img.height / img.width)), Image.Resampling.LANCZOS).save(output / f'{name}.webp', quality=85, method=6)

# A deterministic share card, using the established brand artwork and typography.
card = Image.new('RGB', (1200, 630), '#0b0b0f')
draw = ImageDraw.Draw(card)
for x in range(0, 1200, 48):
    draw.line((x, 0, x, 630), fill='#14131d')
for y in range(0, 630, 48):
    draw.line((0, y, 1200, y), fill='#14131d')
draw.rounded_rectangle((56, 54, 234, 90), radius=18, fill='#d9ff4b')
font_path = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
regular = '/System/Library/Fonts/Supplemental/Arial.ttf'
def font(size, bold=True):
    return ImageFont.truetype(font_path if bold else regular, size)
draw.text((74, 63), 'FITNESS, FLEXIBLE', font=font(12), fill='#17131d')
draw.text((56, 130), 'FitSwap', font=font(70), fill='#faf7ff')
draw.text((56, 244), 'Memberships.', font=font(59), fill='#faf7ff')
draw.text((56, 314), 'Made to move.', font=font(59), fill='#bd9aff')
draw.text((60, 420), 'Buy. Sell. Transfer eligible gym passes.', font=font(24, False), fill='#b9b4c6')
draw.text((60, 548), 'fitswapp.netlify.app', font=font(20, False), fill='#b9b4c6')
art.thumbnail((480, 620), Image.Resampling.LANCZOS)
card.paste(art, (710, (630-art.height)//2), art)
card.save(root / 'public/social-card.png', optimize=True)
print('Marketing assets generated.')
