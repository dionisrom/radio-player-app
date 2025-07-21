from PIL import Image, ImageDraw
import io
import base64

# Create a simple 16x16 favicon
def create_favicon():
    # Create image
    img = Image.new('RGBA', (16, 16), (45, 55, 72, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw radio body
    draw.rectangle([2, 6, 14, 14], fill=(74, 85, 104, 255))
    
    # Draw speaker
    draw.ellipse([4, 8, 8, 12], fill=(26, 32, 44, 255))
    
    # Draw knobs
    draw.ellipse([10, 7, 12, 9], fill=(113, 128, 150, 255))
    draw.ellipse([12, 7, 14, 9], fill=(113, 128, 150, 255))
    draw.ellipse([10, 11, 12, 13], fill=(113, 128, 150, 255))
    draw.ellipse([12, 11, 14, 13], fill=(113, 128, 150, 255))
    
    # Draw antennas
    draw.line([(3, 6), (2, 2)], fill=(113, 128, 150, 255))
    draw.line([(13, 6), (14, 2)], fill=(113, 128, 150, 255))
    
    # Draw signal waves
    draw.arc([1, 3, 5, 7], 0, 90, fill=(72, 187, 120, 255))
    draw.arc([11, 3, 15, 7], 90, 180, fill=(72, 187, 120, 255))
    
    return img

def create_ico_data():
    """Create ICO file data with multiple sizes"""
    img16 = create_favicon()
    img32 = img16.resize((32, 32), Image.Resampling.LANCZOS)
    
    # Save to bytes
    ico_data = io.BytesIO()
    img16.save(ico_data, format='ICO', sizes=[(16, 16), (32, 32)])
    return ico_data.getvalue()

if __name__ == "__main__":
    try:
        ico_data = create_ico_data()
        with open('favicon.ico', 'wb') as f:
            f.write(ico_data)
        print("favicon.ico created successfully!")
        
        # Also create PNG versions
        img = create_favicon()
        img.save('favicon-16x16.png', format='PNG')
        img.resize((32, 32), Image.Resampling.LANCZOS).save('favicon-32x32.png', format='PNG')
        print("PNG versions created successfully!")
        
    except ImportError:
        print("PIL/Pillow not available. Creating a simple HTML-based solution...")
        # Fallback: create a data URL favicon
        print("Use the favicon-generator.html file to create favicon manually.")
