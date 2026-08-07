import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

def generate_edited_docx(
    filename: str, 
    summary: str, 
    overall_risk: str, 
    clauses: list, 
    payment_txid: str = None
) -> str:
    """
    Generates a polished, clean, execution-ready revised contract (.docx).
    Replaces high/medium risk clauses inline with safe reworded alternatives,
    presenting a clean revised contract without audit/meta headers.
    """
    output_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "edited")
    os.makedirs(output_dir, exist_ok=True)
    
    base_name = os.path.splitext(filename)[0]
    output_filename = f"{base_name}_REVISED_SAFE.docx"
    output_path = os.path.abspath(os.path.join(output_dir, output_filename))

    doc = docx.Document()

    # Set professional page margins (1 inch all around)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Document Header Title (Clean, Professional Legal Header)
    title_p = doc.add_paragraph()
    title_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    title_p.paragraph_format.space_before = Pt(12)
    title_p.paragraph_format.space_after = Pt(4)
    
    title_run = title_p.add_run("REVISED SERVICE AGREEMENT")
    title_run.font.name = "Georgia"
    title_run.font.size = Pt(22)
    title_run.font.bold = True
    title_run.font.color.rgb = RGBColor(15, 30, 55)  # Executive Deep Navy

    subtitle_p = doc.add_paragraph()
    subtitle_p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    subtitle_p.paragraph_format.space_after = Pt(24)
    
    sub_run = subtitle_p.add_run(f"(Clean Execution Copy — Revised Risk-Mitigated Terms)")
    sub_run.font.name = "Calibri"
    sub_run.font.size = Pt(11)
    sub_run.font.italic = True
    sub_run.font.color.rgb = RGBColor(100, 110, 120)

    # Render each clause cleanly as a contract section
    for idx, c in enumerate(clauses):
        c_name = getattr(c, "clause_name", getattr(c, "name", f"Section {idx+1}"))
        c_suggestion = getattr(c, "recommendation", getattr(c, "suggestion", ""))
        c_original = getattr(c, "original_text", getattr(c, "original", ""))

        # Use suggested reworded text if available; otherwise fallback to original
        replacement_text = c_suggestion.strip() if (c_suggestion and c_suggestion.strip()) else c_original.strip()

        # Section Heading
        sec_heading_text = f"{idx + 1}. {c_name.upper()}"
        head_p = doc.add_paragraph()
        head_p.paragraph_format.space_before = Pt(14)
        head_p.paragraph_format.space_after = Pt(6)
        head_p.paragraph_format.keep_with_next = True

        head_run = head_p.add_run(sec_heading_text)
        head_run.font.name = "Georgia"
        head_run.font.size = Pt(13)
        head_run.font.bold = True
        head_run.font.color.rgb = RGBColor(15, 30, 55)  # Executive Deep Navy

        # Section Paragraph (Reworded / Clean Contract Text)
        p_clause = doc.add_paragraph()
        p_clause.paragraph_format.space_after = Pt(12)
        p_clause.paragraph_format.line_spacing = 1.15

        r_text = p_clause.add_run(replacement_text)
        r_text.font.name = "Calibri"
        r_text.font.size = Pt(11)
        r_text.font.color.rgb = RGBColor(35, 35, 35)

    # Document Footer Note
    p_foot = doc.add_paragraph()
    p_foot.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foot.paragraph_format.space_before = Pt(36)
    r_foot = p_foot.add_run("--- End of Revised Agreement ---")
    r_foot.font.name = "Calibri"
    r_foot.font.size = Pt(9.5)
    r_foot.font.italic = True
    r_foot.font.color.rgb = RGBColor(140, 140, 140)

    doc.save(output_path)
    return output_path

