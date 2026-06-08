#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Watermark Add Script

Strategy:
1. Create a separate watermark PDF page using insert_text (reliable)
2. Save to temp, re-open (ensures proper serialization)
3. Overlay onto each original page via show_pdf_page()
4. Inject ExtGState into the OUTER XObject's /Resources for real transparency

Root cause of previous failures:
- show_pdf_page() creates NESTED XObjects: outer (fzFrm0) -> inner (fullpage) -> content
- /GS0 gs must be in the OUTER XObject, not the inner one
- /ExtGState must be INSIDE /Resources dict, not at XObject top level
"""

import sys
import os
import json
import math
import re
import tempfile
import fitz


def add_watermark(pdf_path: str, output_path: str, options: dict) -> bool:
    """Add watermark to every page of a PDF with real transparency."""
    try:
        doc = fitz.open(pdf_path)

        text = options.get('text', 'WATERMARK')
        font_size = options.get('fontSize', 40)
        opacity = options.get('opacity', 0.15)
        rotation = options.get('rotation', 45)
        position = options.get('position', 'diagonal')
        color_hex = options.get('color', '#808080')
        spacing = options.get('spacing', 1.0)

        # Parse hex color
        r, g, b = 0.5, 0.5, 0.5
        try:
            if isinstance(color_hex, str) and color_hex.startswith('#'):
                r = int(color_hex[1:3], 16) / 255.0
                g = int(color_hex[3:5], 16) / 255.0
                b = int(color_hex[5:7], 16) / 255.0
        except:
            pass

        # Find Chinese font
        fontfile = None
        for fp in [
            'C:/Windows/Fonts/simhei.ttf',
            'C:/Windows/Fonts/simsun.ttc',
            'C:/Windows/Fonts/msyh.ttc',
        ]:
            if os.path.exists(fp):
                try:
                    fitz.Font(fontfile=fp)
                    fontfile = fp
                    break
                except:
                    pass

        # Measure text width
        font = fitz.Font(fontfile=fontfile) if fontfile else fitz.Font("china-s")
        text_length = font.text_length(text, fontsize=font_size)
        text_width = text_length + font_size * 0.3
        text_height = font_size * 1.3

        # Pre-compute rotation matrix
        rot_matrix = None
        if rotation != 0 and position == 'diagonal':
            angle_rad = math.radians(rotation)
            cos_a = math.cos(angle_rad)
            sin_a = math.sin(angle_rad)
            rot_matrix = fitz.Matrix(cos_a, sin_a, -sin_a, cos_a, 0, 0)

        for page in doc:
            pw, ph = page.rect.width, page.rect.height

            # Step 1: Create watermark overlay page
            wm_doc = fitz.open()
            wm_page = wm_doc.new_page(width=pw, height=ph)

            positions = _compute_positions(
                position, pw, ph, text_width, text_height, spacing
            )

            for (cx, cy) in positions:
                point = fitz.Point(cx - text_length / 2, cy)
                kwargs = {
                    'fontname': 'china-s',
                    'fontsize': font_size,
                    'color': (r, g, b),
                }
                if fontfile:
                    kwargs['fontfile'] = fontfile
                if rot_matrix:
                    kwargs['morph'] = (fitz.Point(cx, cy), rot_matrix)

                wm_page.insert_text(point, text, **kwargs)

            # Step 2: Save to temp file and re-open
            tmp_fd, tmp_path = tempfile.mkstemp(suffix='.pdf')
            os.close(tmp_fd)
            wm_doc.save(tmp_path)
            wm_doc.close()

            wm_doc2 = fitz.open(tmp_path)

            # Step 3: Overlay watermark page onto original
            page.show_pdf_page(page.rect, wm_doc2, 0, overlay=True)
            wm_doc2.close()

            # Clean up temp file
            try:
                os.unlink(tmp_path)
            except:
                pass

            # Step 4: Inject transparency into the OUTER XObject
            _inject_transparency(doc, page, opacity)

        doc.save(output_path, garbage=3)
        doc.close()
        return True

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False


def _compute_positions(
    position: str, pw: float, ph: float,
    text_width: float, text_height: float, spacing: float
) -> list:
    """Compute (cx, cy) center positions for watermark text."""
    positions = []

    if position == 'center':
        positions.append((pw / 2, ph / 2))

    elif position == 'diagonal':
        sx = text_width * 2.0 * spacing
        sy = text_height * 3.0 * spacing
        rows = int(ph / sy) + 4
        cols = int(pw / sx) + 4
        for row in range(-2, rows):
            offset = (sx / 2) if (row % 2 == 1) else 0
            for col in range(-2, cols):
                positions.append((col * sx + sx / 2 + offset, row * sy + sy / 2))

    elif position == 'tile':
        sx = text_width * 1.8 * spacing
        sy = text_height * 2.2 * spacing
        rows = int(ph / sy) + 3
        cols = int(pw / sx) + 3
        for row in range(-1, rows):
            offset = (sx / 2) if (row % 2 == 1) else 0
            for col in range(-1, cols):
                positions.append((col * sx + sx / 2 + offset, row * sy + sy / 2))

    elif position == 'bottom':
        positions.append((pw / 2, ph * 0.9))

    elif position == 'top':
        positions.append((pw / 2, ph * 0.1))

    return positions


def _inject_transparency(doc: fitz.Document, page, opacity: float):
    """
    Inject real PDF transparency into the watermark overlay XObject.

    Key insight: show_pdf_page() creates nested XObjects:
      outer (fzFrm0) -> inner (fullpage) -> actual content

    The /GS0 gs must be in the OUTER XObject (fzFrm0), and /ExtGState
    must be INSIDE its /Resources dict (not at XObject top level).
    """
    # Find the outer XObject (fzFrm0)
    xobjects = page.get_xobjects()
    outer_xref = None
    for xo in xobjects:
        if xo[1] == 'fzFrm0':
            outer_xref = xo[0]
            break

    if outer_xref is None:
        return

    # Create ExtGState
    gs_xref = doc.get_new_xref()
    doc.update_object(
        gs_xref,
        '<< /Type /ExtGState /ca {} /CA {} >>'.format(
            round(opacity, 2), round(opacity, 2)
        ),
    )

    # Add /ExtGState INSIDE the outer XObject's /Resources dict
    obj_str = doc.xref_object(outer_xref)
    obj_str = obj_str.replace(
        '/Resources <<\n    /XObject <<',
        '/Resources <<\n    /ExtGState << /GS0 {} 0 R >>\n    /XObject <<'.format(gs_xref)
    )
    # Remove any mistakenly placed top-level /ExtGState
    obj_str = re.sub(r'\n  /ExtGState <<.*?>>', '', obj_str)
    doc.update_object(outer_xref, obj_str)

    # Prepend /GS0 gs to the outer XObject's content stream
    stream = doc.xref_stream(outer_xref)
    stream_str = '/GS0 gs\n' + stream.decode('latin-1')
    doc.update_stream(outer_xref, stream_str.encode('latin-1'))


def main():
    if len(sys.argv) < 4:
        print(
            "Usage: python pdf-watermark-add.py <pdf_path> <output_path> <options_json>",
            file=sys.stderr,
        )
        sys.exit(1)

    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    options_json = sys.argv[3]

    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    try:
        options = json.loads(options_json)
    except:
        print("Error: Invalid options JSON", file=sys.stderr)
        sys.exit(1)

    if add_watermark(pdf_path, output_path, options):
        print(f"Success: {output_path}")
        sys.exit(0)
    else:
        sys.exit(1)


if __name__ == "__main__":
    main()
