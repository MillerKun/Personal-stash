---
name: import-book
description: >-
  Use this skill to import a new ebook (PDF, EPUB, MOBI) into the Universal Book Reader platform. It instructs how to extract chapters, render pages to images, generate Q&A, and build the HTML reading interface.
---

# 📚 Importing a New Book into Universal Book Reader

Follow this runbook when the user asks you to import a new book into the universal book reader platform.

## Prerequisites
You must have the `pymupdf` python package installed to parse and render ebooks.

## Step 1: Locate and Prepare the Book
1. Find the target book file provided by the user.
2. Copy it into the project directory and rename it to `book.<ext>` (e.g. `book.pdf` or `book.mobi`).
3. Ensure the `pages/` directory exists.

## Step 2: Extract Chapter Page Numbers
Ebooks often have offsets between the logical chapters and physical page numbers due to covers and TOCs.
1. Copy the script [find_chapters.py](./scripts/find_chapters.py) to the project root and run it against the book.
2. Modify the script to search for the specific chapter formatting used in the book (e.g., "第1章", "Chapter 1").
3. Use the output to build an accurate array of physical page numbers for the `chapters` variable in the HTML.

## Step 3: Render Pages to HD Images
To avoid cross-origin issues and allow smooth scrolling:
1. Copy [render_pages.py](./scripts/render_pages.py) to the project root.
2. Ensure the script points to the correct book filename.
3. Run the script using the `run_command` tool asynchronously (it may take 10-30 seconds for large books).

## Step 4: Generate Book-Specific Q&A
Based on your knowledge of the uploaded book, generate 5-10 interactive Q&A questions (both objective and open-ended) to help the user learn the content. Format them as an array of JSON objects (see `qaDB` in the HTML builder).

## Step 5: Build the Interface
1. Copy [build_html.py](./scripts/build_html.py) to the project root.
2. Update the `chapters` array with the accurate physical pages from Step 2.
3. Update the `qaDB` array with the questions from Step 4.
4. Update `TOTAL_PAGES` to the total length of the document.
5. Run `python build_html.py` to generate the `index.html` interface.
