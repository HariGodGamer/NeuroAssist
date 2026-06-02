"""PDF report generation using ReportLab for clinical-grade scan reports."""
import os
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle,
    HRFlowable, Image
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas


# ─── Color palette ───────────────────────────────────────────────────────────
C_GREEN  = colors.HexColor("#67E499")
C_PURPLE = colors.HexColor("#8F63F4")
C_DARK   = colors.HexColor("#1a1a2e")
C_LIGHT  = colors.HexColor("#f0f4f0")
C_MUT    = colors.HexColor("#6b7280")
C_RED    = colors.HexColor("#ef4444")
C_AMB    = colors.HexColor("#f59e0b")


def _urgency_color(urgency: str):
    return {"urgent": C_RED, "priority": C_AMB, "routine": C_GREEN}.get(urgency or "routine", C_GREEN)


def _pred_color(pred: str):
    return {"AD": C_RED, "MCI": C_AMB, "CN": C_GREEN}.get(pred or "CN", C_MUT)


def generate_pdf_report(scan: dict, patient: dict, output_path: str) -> str:
    """Generate a professional clinical PDF report for a NeuroAssist scan."""
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=2 * cm, leftMargin=2 * cm,
        topMargin=2.5 * cm, bottomMargin=2 * cm,
        title=f"NeuroAssist Clinical Report – {scan.get('scan_id_string', 'N/A')}",
        author="NeuroAssist AI Platform",
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    title_style = ParagraphStyle(
        "Title", parent=styles["Title"],
        fontSize=22, textColor=C_DARK, spaceAfter=4, alignment=TA_LEFT
    )
    sub_style = ParagraphStyle(
        "Sub", parent=styles["Normal"],
        fontSize=10, textColor=C_MUT, spaceAfter=2
    )
    story.append(Paragraph("NeuroAssist", title_style))
    story.append(Paragraph("AI-Powered Neurological Screening &amp; MRI Intelligence Report", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=C_PURPLE, spaceAfter=12))

    # ── Scan meta row ────────────────────────────────────────────────────────
    generated_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    scan_date_str = ""
    raw_date = scan.get("upload_date") or scan.get("scan_date")
    if raw_date:
        try:
            if isinstance(raw_date, str):
                scan_date_str = raw_date[:10]
            else:
                scan_date_str = raw_date.strftime("%Y-%m-%d")
        except Exception:
            scan_date_str = str(raw_date)[:10]

    meta_data = [
        ["Scan ID", scan.get("scan_id_string", "N/A"),
         "Report Generated", generated_at],
        ["Scan Date", scan_date_str,
         "Model Used", (scan.get("model_used") or "multiclass").upper()],
        ["Original File", scan.get("original_filename", "N/A"),
         "Processing Time", f"{scan.get('processing_time', 'N/A')} s"],
    ]
    meta_table = Table(meta_data, colWidths=[3.5 * cm, 7 * cm, 4 * cm, 5.5 * cm])
    meta_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("TEXTCOLOR", (0, 0), (0, -1), C_MUT),
        ("TEXTCOLOR", (2, 0), (2, -1), C_MUT),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("FONTNAME", (3, 0), (3, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 14))

    # ── Section helper ────────────────────────────────────────────────────────
    sec_style = ParagraphStyle(
        "Section", parent=styles["Heading2"],
        fontSize=12, textColor=C_PURPLE, spaceBefore=14, spaceAfter=6,
        borderPad=2
    )

    def section(text):
        story.append(Paragraph(text, sec_style))

    # ── Patient details ──────────────────────────────────────────────────────
    section("Patient Information")
    dob = patient.get("date_of_birth", "N/A")
    age_str = ""
    try:
        birth = datetime.strptime(dob, "%Y-%m-%d")
        age_str = f"  ({(datetime.utcnow() - birth).days // 365} yrs)"
    except Exception:
        pass

    p_data = [
        ["Patient Name", patient.get("full_name", "N/A"),
         "Patient Code", patient.get("patient_code", "N/A")],
        ["Date of Birth", dob + age_str,
         "Gender", patient.get("gender", "N/A")],
        ["Contact", patient.get("contact", "N/A"),
         "Medical History", (patient.get("medical_history") or "None recorded")[:60]],
    ]
    p_table = Table(p_data, colWidths=[3.5 * cm, 7 * cm, 3.5 * cm, 6 * cm])
    p_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), C_MUT),
        ("TEXTCOLOR", (2, 0), (2, -1), C_MUT),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(p_table)
    story.append(Spacer(1, 8))

    # ── AI Diagnosis ─────────────────────────────────────────────────────────
    section("AI Prediction & Diagnosis")
    pred = scan.get("prediction") or "N/A"
    risk = scan.get("risk_score") or 0
    urgency = scan.get("urgency") or "routine"
    urg_clr = _urgency_color(urgency)
    pred_clr = _pred_color(pred)

    pred_data = [
        ["AI Prediction", pred, "Risk Score", f"{risk:.1f} / 100"],
        ["Urgency Level", urgency.upper(), "Doctor Diagnosis", scan.get("doctor_diagnosis") or "Pending Review"],
        ["Status", (scan.get("status") or "N/A").upper(), "", ""],
    ]
    pred_table = Table(pred_data, colWidths=[4 * cm, 6 * cm, 4 * cm, 6 * cm])
    pred_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("TEXTCOLOR", (0, 0), (0, -1), C_MUT),
        ("TEXTCOLOR", (2, 0), (2, -1), C_MUT),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica-Bold"),
        ("TEXTCOLOR", (1, 0), (1, 0), pred_clr),
        ("TEXTCOLOR", (1, 1), (1, 1), urg_clr),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(pred_table)
    story.append(Spacer(1, 8))

    # ── Confidence Scores ────────────────────────────────────────────────────
    section("Confidence Scores")
    cn  = (scan.get("conf_cn")  or 0) * 100
    mci = (scan.get("conf_mci") or 0) * 100
    ad  = (scan.get("conf_ad")  or 0) * 100

    conf_data = [
        ["Classification", "Confidence (%)", "Clinical Interpretation"],
        ["CN (Cognitively Normal)", f"{cn:.1f}%", "No significant cognitive impairment detected"],
        ["MCI (Mild Cognitive Impairment)", f"{mci:.1f}%", "Early-stage memory or cognitive changes"],
        ["AD (Alzheimer's Disease)", f"{ad:.1f}%", "Significant neurodegeneration detected"],
    ]
    conf_table = Table(conf_data, colWidths=[6 * cm, 4 * cm, 9.5 * cm])
    conf_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), C_PURPLE),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_LIGHT, colors.white]),
        ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
        ("PADDING", (0, 0), (-1, -1), 6),
        ("ALIGN", (1, 1), (1, -1), "CENTER"),
    ]))
    story.append(conf_table)
    story.append(Spacer(1, 8))

    # ── Biomarkers ────────────────────────────────────────────────────────────
    bm = {
        "hippocampal_atrophy": scan.get("biomarker_hippocampal"),
        "amyloid_plaque_load": scan.get("biomarker_amyloid"),
        "ventricle_enlargement": scan.get("biomarker_ventricle"),
    }
    if any(v is not None for v in bm.values()):
        section("Neuroimaging Biomarkers")
        bm_data = [
            ["Biomarker", "Score (0–1)", "Clinical Significance"],
            ["Hippocampal Atrophy", f"{bm['hippocampal_atrophy']:.3f}" if bm['hippocampal_atrophy'] else "N/A",
             "Primary indicator of Alzheimer's progression"],
            ["Amyloid Plaque Load", f"{bm['amyloid_plaque_load']:.3f}" if bm['amyloid_plaque_load'] else "N/A",
             "Surrogate marker for amyloid deposition"],
            ["Ventricle Enlargement", f"{bm['ventricle_enlargement']:.3f}" if bm['ventricle_enlargement'] else "N/A",
             "Associated with brain volume loss"],
        ]
        bm_table = Table(bm_data, colWidths=[6 * cm, 3.5 * cm, 10 * cm])
        bm_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), C_GREEN),
            ("TEXTCOLOR", (0, 0), (-1, 0), C_DARK),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_LIGHT, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ]))
        story.append(bm_table)
        story.append(Spacer(1, 8))

    # ── Grad-CAM images ──────────────────────────────────────────────────────
    gradcam_paths = {
        "axial": scan.get("gradcam_axial"),
        "coronal": scan.get("gradcam_coronal"),
        "sagittal": scan.get("gradcam_sagittal"),
    }
    valid_paths = {k: v for k, v in gradcam_paths.items() if v and os.path.isfile(v)}
    if valid_paths:
        section("Explainability — Grad-CAM Attention Maps")
        img_row = []
        for view_name, img_path in valid_paths.items():
            try:
                img = Image(img_path, width=5 * cm, height=5 * cm)
                img_row.append(img)
            except Exception:
                pass
        if img_row:
            img_table = Table([img_row])
            img_table.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
            ]))
            story.append(img_table)
            cap_style = ParagraphStyle("Cap", fontSize=8, textColor=C_MUT, alignment=TA_CENTER, spaceAfter=4)
            labels = " · ".join(k.title() for k in valid_paths.keys())
            story.append(Paragraph(f"Grad-CAM Attention Overlay: {labels}", cap_style))
        story.append(Spacer(1, 6))

    # ── Brain Region Attention ────────────────────────────────────────────────
    brain_regions = scan.get("brain_regions") or {}
    if brain_regions:
        section("Regional Attention Analysis")
        reg_header = [["Brain Region", "Attention Score", "Interpretation"]]
        reg_rows = []
        for region, score in sorted(brain_regions.items(), key=lambda x: x[1], reverse=True):
            level = "High" if score > 0.65 else "Moderate" if score > 0.35 else "Low"
            reg_rows.append([region.replace("_", " ").title(), f"{score:.3f}", level])
        reg_data = reg_header + reg_rows
        reg_table = Table(reg_data, colWidths=[6.5 * cm, 4 * cm, 9 * cm])
        reg_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), C_DARK),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [C_LIGHT, colors.white]),
            ("GRID", (0, 0), (-1, -1), 0.3, colors.HexColor("#e5e7eb")),
            ("PADDING", (0, 0), (-1, -1), 6),
            ("ALIGN", (1, 1), (1, -1), "CENTER"),
        ]))
        story.append(reg_table)
        story.append(Spacer(1, 8))

    # ── Doctor Notes ─────────────────────────────────────────────────────────
    notes = scan.get("doctor_notes") or ""
    section("Clinician Notes")
    note_style = ParagraphStyle("Note", fontSize=9.5, textColor=C_DARK, spaceAfter=4, leading=14)
    story.append(Paragraph(notes if notes else "No clinician notes recorded.", note_style))
    story.append(Spacer(1, 8))

    # ── Disclaimer ────────────────────────────────────────────────────────────
    story.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor("#e5e7eb"), spaceBefore=12))
    disc_style = ParagraphStyle("Disc", fontSize=7.5, textColor=C_MUT, leading=11, spaceAfter=2)
    story.append(Paragraph(
        "<b>Disclaimer:</b> This report is generated by the NeuroAssist AI platform and is intended to assist "
        "clinicians in their diagnostic workflow. It is NOT a substitute for professional medical judgment. "
        "All findings must be verified by a qualified neurologist or radiologist. NeuroAssist AI does not "
        "provide standalone diagnosis.",
        disc_style
    ))
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        f"Generated by NeuroAssist v3.0  ·  {generated_at}  ·  For clinical use only",
        ParagraphStyle("Footer", fontSize=7, textColor=C_MUT, alignment=TA_CENTER)
    ))

    doc.build(story)
    return output_path
