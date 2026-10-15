#!/usr/bin/env python3
"""Print the English CV and cover letter (HTML sources in this folder) to PDF with Chromium.

    python 05_PRESENTATIONS/documents/build_documents_en.py

Writes Alfonso-Cifuentes-CV-EN.pdf and Alfonso-Cifuentes-Cover-Letter-EN.pdf next to the sources.
The site copies them to public/downloads/ through 03_WEBSITE/tools/sync_site_data.py.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

HERE = Path(__file__).resolve().parent
JOBS = {'cv_en.html': 'Alfonso-Cifuentes-CV-EN.pdf', 'carta_en.html': 'Alfonso-Cifuentes-Cover-Letter-EN.pdf'}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for src, out in JOBS.items():
        page = browser.new_page()
        page.goto((HERE / src).as_uri(), wait_until='load')
        page.evaluate('document.fonts.ready')
        page.pdf(path=str(HERE / out), format='A4', print_background=True, prefer_css_page_size=True)
        page.close()
        print('wrote', out)
    browser.close()
