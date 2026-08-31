import pymupdf
import os

pdf_path = "book.pdf"
out_dir = "pages"

doc = pymupdf.open(pdf_path)
total = len(doc)
print(f"Total pages: {total}")

# We will render at a decent resolution (e.g. zoom = 1.5)
zoom = 1.5 
mat = pymupdf.Matrix(zoom, zoom)

for i in range(total):
    page = doc[i]
    pix = page.get_pixmap(matrix=mat)
    # Save as JPEG for smaller file size
    pix.save(os.path.join(out_dir, f"page_{i+1}.jpg"))
    if (i+1) % 50 == 0:
        print(f"Rendered {i+1}/{total} pages...")

print("All pages rendered successfully.")
