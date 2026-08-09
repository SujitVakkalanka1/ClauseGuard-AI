"""
PDF Summary Report Generator Module using ReportLab.

Generates a clean 1-page PDF summary report containing:
- Document Title & Contract Name
- Weighted Risk Score & Donut Chart Visual
- Risk Severity Breakdown Table
- Footer with Algorand TestNet Transaction ID (if provided)
"""

import os
from typing import Dict, Any, Optional

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie

def generate_summary_pdf(
    contract_name: str,
    overall_score: float,
    breakdown: Dict[str, int],
    tx_id: Optional[str] = None
) -> str:
    """
    Generates a professional 1-page PDF summary report.

    Args:
        contract_name (str): Original filename of the contract.
        overall_score (float): Calculated weighted risk score.
        breakdown (dict): Dictionary with counts for "low", "medium", "high".
        tx_id (str, optional): Algorand TestNet transaction ID proof.

    Returns:
        str: Absolute filepath to the generated PDF document.
    """
    output_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "reports")
    os.makedirs(output_dir, exist_ok=True)

    base_name = os.path.splitext(os.path.basename(contract_name))[0]
    filename = f"{base_name}_SUMMARY_REPORT.pdf"
    pdf_path = os.path.abspath(os.path.join(output_dir, filename))

    doc = SimpleDocTemplate(
        pdf_path,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=40,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()

    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#0A192F'),
        alignment=1
    )
    sub_style = ParagraphStyle(
        'DocSub',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )
    section_style = ParagraphStyle(
        'SecHead',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=13,
        leading=16,
        textColor=colors.HexColor('#0A192F'),
        spaceAfter=6
    )
    normal_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#1E293B')
    )

    story = []

    # 1. Header & Title
    story.append(Paragraph("ClauseGuard AI — Executive Contract Risk Audit", title_style))
    story.append(Spacer(1, 4))
    story.append(Paragraph(f"Contract File: <b>{contract_name}</b>", sub_style))
    story.append(Spacer(1, 16))

    # 2. Risk Score & Donut Chart
    high_c = breakdown.get("high", 0)
    med_c = breakdown.get("medium", 0)
    low_c = breakdown.get("low", 0)

    # Donut Chart Drawing
    d = Drawing(400, 140)
    pc = Pie()
    pc.x = 140
    pc.y = 10
    pc.width = 120
    pc.height = 120
    pc.data = [max(high_c, 0.001), max(med_c, 0.001), max(low_c, 0.001)]
    pc.labels = [f"High: {high_c}", f"Medium: {med_c}", f"Low: {low_c}"]
    pc.slices.strokeWidth = 0.5
    pc.slices[0].fillColor = colors.HexColor('#EF4444')
    pc.slices[1].fillColor = colors.HexColor('#F59E0B')
    pc.slices[2].fillColor = colors.HexColor('#10B981')
    d.add(pc)

    story.append(Paragraph("Risk Assessment & Severity Breakdown", section_style))
    story.append(Paragraph(f"<b>Overall Weighted Risk Score:</b> <font color='#C5A059'><b>{overall_score:.2f} / 3.00</b></font>", normal_style))
    story.append(Spacer(1, 6))
    story.append(d)
    story.append(Spacer(1, 14))

    # 3. Breakdown Table
    table_data = [
        ["Severity Category", "Clause Count", "Weight", "Recommended Action"],
        ["High Risk", str(high_c), "3.0", "Urgent Amendment Required"],
        ["Medium Risk", str(med_c), "2.0", "Negotiation Recommended"],
        ["Low Risk", str(low_c), "1.0", "Standard Term (Acceptable)"]
    ]

    t = Table(table_data, colWidths=[120, 85, 65, 190])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#0A192F')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 9.5),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 7),
        ('TOPPADDING', (0, 0), (-1, 0), 7),
        ('ALIGN', (1, 0), (2, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#FEF2F2')),
        ('TEXTCOLOR', (0, 1), (-1, 1), colors.HexColor('#991B1B')),
        ('BACKGROUND', (0, 2), (-1, 2), colors.HexColor('#FFFBEB')),
        ('TEXTCOLOR', (0, 2), (-1, 2), colors.HexColor('#92400E')),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor('#ECFDF5')),
        ('TEXTCOLOR', (0, 3), (-1, 3), colors.HexColor('#065F46')),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
        ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
        ('FONTSIZE', (0, 1), (-1, -1), 9),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))

    # 4. Footer with Algorand Transaction Proof
    footer_style = ParagraphStyle(
        'DocFoot',
        parent=styles['Normal'],
        fontName='Helvetica-Oblique',
        fontSize=8.5,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    if tx_id:
        story.append(Paragraph(f"<b>Algorand TestNet Transaction ID:</b> {tx_id}", footer_style))
    else:
        story.append(Paragraph("<b>Audit Status:</b> Verified Local Report", footer_style))

    story.append(Spacer(1, 4))
    story.append(Paragraph("ClauseGuard-AI — Legal Contract Risk Engine & Algorand x402 Micropayments", footer_style))

    doc.build(story)
    return pdf_path
