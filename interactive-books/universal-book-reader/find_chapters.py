import pymupdf

pdf_path = "book.mobi"
doc = pymupdf.open(pdf_path)

print("Searching for ALL chapter page occurrences...")
level_pages = {i: [] for i in range(1, 18)}

for i in range(len(doc)):
    text = doc[i].get_text().replace(" ", "").replace("\n", "")
    for level in range(1, 18):
        pattern = f"第{level}关"
        if pattern in text:
            level_pages[level].append(i+1)

for level, pages in level_pages.items():
    print(f"Level {level} found at pages: {pages}")
