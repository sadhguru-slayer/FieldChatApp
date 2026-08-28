import os
import sys
import subprocess

try:
    from PIL import Image, ImageFilter, ImageDraw
except ImportError:
    print("Pillow is not installed. Installing Pillow...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "Pillow"])
    from PIL import Image, ImageFilter, ImageDraw

def process_frame(img, threshold=242, blur_radius=1.0):
    """
    Removes the white background from a single RGBA image using flood-fill and edge feathering.
    """
    width, height = img.size
    
    # Create a grayscale representation to detect white/near-white pixels
    gray = img.convert("L")
    
    # Binary mask: 255 for pixels >= threshold (background candidates), 0 for others
    binary_mask = gray.point(lambda p: 255 if p >= threshold else 0)
    
    # Flood-fill from corners to isolate the connected outer background
    flood_mask = Image.new("L", (width, height), 0)
    flood_mask.paste(binary_mask)
    
    # Fill from the four corners with value 127
    ImageDraw.floodfill(flood_mask, (0, 0), 127)
    ImageDraw.floodfill(flood_mask, (width - 1, 0), 127)
    ImageDraw.floodfill(flood_mask, (0, height - 1), 127)
    ImageDraw.floodfill(flood_mask, (width - 1, height - 1), 127)
    
    # Create alpha channel: background (127) is transparent (0), others are opaque (255)
    alpha_mask = flood_mask.point(lambda p: 0 if p == 127 else 255)
    
    # Apply soft feathering to the alpha mask if blur_radius is set
    if blur_radius > 0:
        alpha_mask = alpha_mask.filter(ImageFilter.GaussianBlur(blur_radius))
    
    # Merge original color channels with our custom smooth alpha mask
    r, g, b, _ = img.split()
    return Image.merge("RGBA", (r, g, b, alpha_mask))

def main():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    png_path = os.path.join(base_dir, "Logo.png")
    ico_path = os.path.join(base_dir, "Logo.ico")
    
    print("Starting background removal and logo quality enhancement...")

    # --- 1. Process PNG ---
    if os.path.exists(png_path):
        print(f"Processing PNG: {png_path}")
        img = Image.open(png_path).convert("RGBA")
        processed_png = process_frame(img, threshold=242, blur_radius=1.0)
        # Overwrite the original Logo.png with enhanced transparent version
        processed_png.save(png_path, "PNG", quality=100)
        print("PNG processed and saved successfully.")
    else:
        print(f"Error: PNG not found at {png_path}")
        return

    # --- 2. Process / Generate ICO from the clean transparent PNG ---
    # Generating the ICO from the clean high-resolution PNG is the highest quality approach
    # as it ensures smaller resolutions are anti-aliased perfectly from the source.
    print(f"Generating ICO: {ico_path}")
    icon_sizes = [(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)]
    
    # Read the newly processed high-res PNG and save it as a multi-resolution ICO
    transparent_img = Image.open(png_path)
    transparent_img.save(
        ico_path,
        format="ICO",
        sizes=icon_sizes
    )
    print("ICO generated with standard sizes successfully.")

if __name__ == "__main__":
    main()
