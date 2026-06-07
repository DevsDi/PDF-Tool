#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
PDF Watermark Add Script
Uses PyMuPDF Shape API with morph transformation for proper rotation.
"""

import sys
import os
import json
import math
import fitz


def blend_color_with_white(r: float, g: float, b: float, opacity: float) -> tuple:
    """Simulate opacity by blending with white background."""
    return (r * opacity + (1 - opacity), g * opacity + (1 - opacity), b * opacity + (1 - opacity))


def add_watermark(pdf_path: str, output_path: str, options: dict) -> bool:
    """
    Add watermark to PDF.
    """
    try:
        doc = fitz.open(pdf_path)

        text = options.get('text', 'WATERMARK')
        font_size = options.get('fontSize', 40)
        opacity = options.get('opacity', 0.3)
        rotation = options.get('rotation', 45)
        position = options.get('position', 'diagonal')
        color_hex = options.get('color', '#808080')

        # Parse color
        try:
            if isinstance(color_hex, str) and color_hex.startswith('#'):
                r = int(color_hex[1:3], 16) / 255.0
                g = int(color_hex[3:5], 16) / 255.0
                b = int(color_hex[5:7], 16) / 255.0
            else:
                r, g, b = 0.5, 0.5, 0.5
        except:
            r, g, b = 0.5, 0.5, 0.5

        effective_color = blend_color_with_white(r, g, b, opacity)

        # Chinese font
        fontname = "china-s"
        fontfile = None
        font_paths = [
            'C:/Windows/Fonts/simhei.ttf',
            'C:/Windows/Fonts/simsun.ttc',
            'C:/Windows/Fonts/msyh.ttc',
        ]
        for fp in font_paths:
            if os.path.exists(fp):
                try:
                    fitz.Font(fontfile=fp)
                    fontfile = fp
                    break
                except:
                    pass

        total_pages = len(doc)

        # Chinese chars are ~font_size wide each
        # Use generous estimate to ensure text fits
        text_width = font_size * len(text) * 1.2
        text_height = font_size * 1.5

        # Rotation matrix setup
        if rotation != 0:
            angle_rad = math.radians(rotation)
            cos_a, sin_a = math.cos(angle_rad), math.sin(angle_rad)
            rot_matrix = fitz.Matrix(cos_a, sin_a, -sin_a, cos_a, 0, 0)
        else:
            rot_matrix = None

        for page_num in range(total_pages):
            page = doc[page_num]
            pw, ph = page.rect.width, page.rect.height
            shape = page.new_shape()

            # Collect positions based on position mode
            positions = []

            if position == 'center':
                positions.append((pw / 2, ph / 2))

            elif position == 'diagonal':
                # Tiled diagonal with generous spacing
                spacing_x = text_width * 3
                spacing_y = text_height * 4
                rows = int(ph / spacing_y) + 3
                cols = int(pw / spacing_x) + 3
                for row in range(-1, rows + 1):
                    for col in range(-1, cols + 1):
                        cx = col * spacing_x + spacing_x / 2
                        cy = row * spacing_y + spacing_y / 2
                        positions.append((cx, cy))

            elif position == 'tile':
                # Non-rotated tile
                spacing_x = text_width * 2.5
                spacing_y = text_height * 2.5
                rows = int(ph / spacing_y) + 2
                cols = int(pw / spacing_x) + 2
                for row in range(rows):
                    for col in range(cols):
                        cx = col * spacing_x + spacing_x / 2
                        cy = row * spacing_y + spacing_y / 2
                        positions.append((cx, cy))
                rot_matrix = None  # No rotation for tile

            elif position == 'bottom':
                positions.append((pw / 2, ph * 0.9))

            elif position == 'top':
                positions.append((pw / 2, ph * 0.1))

            # Draw each watermark
            for (cx, cy) in positions:
                _draw_watermark(
                    shape, text, cx, cy,
                    text_width, text_height,
                    fontname, fontfile, font_size,
                    effective_color, rot_matrix
                )

            shape.commit()

        doc.save(output_path)
        doc.close()
        return True

    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        import traceback
        traceback.print_exc(file=sys.stderr)
        return False


def _draw_watermark(
    shape, text: str, cx: float, cy: float,
    text_width: float, text_height: float,
    fontname: str, fontfile, fontsize: float,
    color: tuple, rot_matrix
):
    """
    Draw one watermark text with optional rotation.
    """
    # Make rectangle generous to ensure text fits
    # Account for rotation - rotated text needs more space
    pad = fontsize * 0.8
    half_w = text_width / 2 + pad
    half_h = text_height / 2 + pad
    rect = fitz.Rect(cx - half_w, cy - half_h, cx + half_w, cy + half_h)

    kwargs = {
        'fontname': fontname,
        'fontsize': fontsize,
        'color': color,
        'align': 1,  # center
    }
    if fontfile:
        kwargs['fontfile'] = fontfile
    if rot_matrix:
        kwargs['morph'] = (fitz.Point(cx, cy), rot_matrix)

    # insert_textbox returns positive value on success, negative if text didn't fit
    result = shape.insert_textbox(rect, text, **kwargs)
    if result < 0:
        # Text didn't fit, try with larger rect
        rect = fitz.Rect(cx - half_w * 1.5, cy - half_h * 1.5, cx + half_w * 1.5, cy + half_h * 1.5)
        shape.insert_textbox(rect, text, **kwargs)


def main():
    if len(sys.argv) < 4:
        print("Usage: python pdf-watermark-add.py <pdf_path> <output_path> <options_json>", file=sys.stderr)
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