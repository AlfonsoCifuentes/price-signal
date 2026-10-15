#!/usr/bin/env python3
"""Export both decks to PDF with Microsoft PowerPoint (Windows + pywin32) and render a PNG preview of each slide.
    python export_decks_pdf.py [preview_dir]"""
from pathlib import Path
import sys
import win32com.client as win32

HERE = Path(__file__).resolve().parent
DECKS = ['PRICE_SIGNAL_Public_Case_EN', 'PRICE_SIGNAL_Caso_Publico_ES']
preview = Path(sys.argv[1]) if len(sys.argv) > 1 else None

app = win32.DispatchEx('PowerPoint.Application')
try:
    for name in DECKS:
        pres = app.Presentations.Open(str(HERE / f'{name}.pptx'), ReadOnly=True, Untitled=False, WithWindow=False)
        pres.SaveAs(str(HERE / f'{name}.pdf'), 32)  # ppSaveAsPDF
        if preview:
            out = preview / name
            out.mkdir(parents=True, exist_ok=True)
            for i, slide in enumerate(pres.Slides, start=1):
                slide.Export(str(out / f'{i:02d}.png'), 'PNG', 1280, 720)
        print(name, pres.Slides.Count, 'slides -> PDF')
        pres.Close()
finally:
    app.Quit()
