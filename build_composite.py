from PIL import Image, ImageFilter, ImageEnhance
import os
import sys

# 1. Route strictly to your public directory
base_dir = r"J:\Project-Bazaar\bazaar-republic\bazaar-republic-alpha"
public_dir = os.path.join(base_dir, "public")

# Exact filenames mapping
image_filenames = [
    "dashboard.png",                 # Index 0
    "academy_dao-architecture.png",  # Index 1 (CENTER)
    "module_01.png",                 # Index 2
    "module_02.png",                 # Index 3
    "module_04.png"                  # Index 4
]

image_paths = [os.path.join(public_dir, fname) for fname in image_filenames]

# 🛡️ SHIELD CHECK
for path in image_paths:
    if not os.path.exists(path):
        print(f"[MESH-ERROR]: Missing file: {path}")
        sys.exit(1)

images = [Image.open(path).convert("RGBA") for path in image_paths]

# 2. Transparent Canvas (1800x1200)
canvas_width, canvas_height = 5900, 2500
master_canvas = Image.new("RGBA", (canvas_width, canvas_height), (0, 0, 0, 0)) 

# 3. Absolute Shift Render Queue: (Index, Angle, Scale, Brightness, X-Shift, Y-Shift)
# X-Shift: Negative = Shift Left | Positive = Shift Right
# Y-Shift: Negative = Shift UP   | Positive = Shift DOWN
render_queue = [
    (0,  5, 1.0, 1.0, -2200, -250), # Layer 1 (Far Left): Pushed Left by 360px, UP by 360px
    (4, -5, 0.65, 1.0,  2300, -250), # Layer 2 (Far Right): Pushed Right by 360px, UP by 360px
    (2,  -5, 0.85, 1.0, -1000, 75),  # Layer 3 (Mid Left): Pushed Left by 30px, UP by 75px
    (3, 2, 0.65, 1.0,  1300, 275),  # Layer 4 (Mid Right): Pushed Right by 30px, UP by 75px
    (1,  0, 1.0, 1.0,  120,  30)   # Layer 5 (Center): No X-Shift (0), DOWN by 30px
]

pivot_point = (800, 1250)

try:
    resample_filter = Image.Resampling.LANCZOS
except AttributeError:
    resample_filter = Image.LANCZOS

# 4. Forging the Manually Adjusted Spread
for index, angle, scale, brightness, x_shift, y_shift in render_queue:
    base_img = images[index]
    
    # Scale
    new_size = (int(base_img.width * scale), int(base_img.height * scale))
    img = base_img.resize(new_size, resample_filter)
    
    # Dimming
    enhancer = ImageEnhance.Brightness(img)
    img = enhancer.enhance(brightness)
    
    # Drop Shadow
    padded_card = Image.new("RGBA", (img.width + 120, img.height + 120), (0,0,0,0))
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 255))
    padded_card.paste(shadow, (60, 60))
    shadow_blurred = padded_card.filter(ImageFilter.GaussianBlur(35))
    shadow_blurred.paste(img, (30, 30), img)
    
    # Rotate & Composite with explicit X and Y Shifts
    layer = Image.new("RGBA", (canvas_width, canvas_height), (0,0,0,0))
    
    # 🛡️ THE ADJUSTMENT MATRIX
    # Base centering is calculated, then your manual x_shift and y_shift are injected.
    paste_x = int((canvas_width / 2) - (shadow_blurred.width / 2)) + x_shift
    paste_y = 150 + y_shift  
    
    layer.paste(shadow_blurred, (paste_x, paste_y), shadow_blurred)
    
    layer_rotated = layer.rotate(angle, center=pivot_point, resample=Image.BICUBIC)
    master_canvas = Image.alpha_composite(master_canvas, layer_rotated)

# 5. Output
output_path = os.path.join(public_dir, "bazaar_hero_fan.png")
master_canvas.save(output_path, "PNG")
print(f"[MESH-LOG]: Absolute coordinate fan successfully forged: {output_path}")