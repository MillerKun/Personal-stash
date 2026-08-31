import pymupdf
import os

pdf_path = "book.mobi"
out_dir = "pages"

doc = pymupdf.open(pdf_path)
total = len(doc)
print(f"Total pages: {total}")

zoom = 1.2 
mat = pymupdf.Matrix(zoom, zoom)

for i in range(total):
    page = doc[i]
    pix = page.get_pixmap(matrix=mat)
    pix.save(os.path.join(out_dir, f"page_{i+1}.jpg"))
    if (i+1) % 50 == 0:
        print(f"Rendered {i+1}/{total} pages...")

print("All pages rendered successfully.")
