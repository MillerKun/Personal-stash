# 🤖 AI Hand-off: Interactive Books Integration Guide

> **To the AI Agent managing the MkDocs Wiki ("GDC & 游戏开发中文知识库"):**
> 
> Hello! I am the AI agent who built the "Interactive Book Readers". The user has requested that you uniformly integrate and link our interactive book readers into the main Wiki navigation structure. 
> 
> Below is everything you need to know about what I built and how you should integrate it.

## 📁 Project Architecture & Location

I have created a standalone, highly customized interactive reading platform for PDF/Epub books. It features a custom JS-based lazy-loading image engine, deep Q&A integration, zoom controls, and responsive mobile design.

- **Location (on `main` branch):** `/interactive-books/`
- **Sub-projects:**
  1. `interactive-books/game-design-art-study/index.html` (Book: *The Art of Game Design*)
  2. `interactive-books/universal-book-reader/index.html` (Book: *Level Up! The Guide to Great Video Game Design*)

## ⚠️ Critical Technical Constraints

1. **Pure HTML/JS/CSS (Not Markdown):**
   These readers are **not** Markdown files. They are full-fledged HTML applications. **Do not** attempt to convert them to Markdown.
   
2. **MkDocs Build Pipeline Conflict:**
   Currently, the Wiki is deployed from the `docs/` folder to the `gh-pages` branch. Because our `interactive-books` folder lives in the repository root, it is **ignored** by MkDocs during the standard `mkdocs gh-deploy` build. (I temporarily force-pushed them to `gh-pages` so the user could see them, but your next MkDocs build will wipe them out).

## 🛠️ Your Action Items (Integration Plan)

To permanently integrate these books into the Wiki, please execute the following steps:

### Step 1: Move the source files into MkDocs static assets
Move the entire `interactive-books` directory into the MkDocs `docs/` folder so that MkDocs automatically copies it to the `site/` output during the build process without altering the HTML structure.
```bash
mv interactive-books game-dev-wiki/docs/
```
*(MkDocs natively supports copying raw HTML files and folders verbatim into the final build, which is perfect for our use case).*

### Step 2: Create a beautiful Navigation/Jump Page
Create a new Markdown file in the Wiki (e.g., `game-dev-wiki/docs/books.md`) to serve as the portal/gallery for the interactive books.
- Add it to the `mkdocs.yml` navigation menu (e.g., `nav: - 📚 经典著作: books.md`).
- In `books.md`, design a nice UI (using MkDocs cards, grids, or standard markdown) introducing the two books.
- The hyperlinks in `books.md` should point directly to the raw HTML files. Since they will now live inside `docs/`, the relative links will be:
  - `[阅读《游戏设计艺术》](interactive-books/game-design-art-study/index.html)`
  - `[阅读《通关！游戏设计之道》](interactive-books/universal-book-reader/index.html)`

### Step 3: Test and Deploy
Rebuild the MkDocs site (`mkdocs build` or `mkdocs gh-deploy`). The user will then have a seamless experience navigating from the main Wiki sidebar directly into the immersive book readers!

---
*Signed, your fellow AI Assistant.*
