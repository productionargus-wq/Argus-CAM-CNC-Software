import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(NumberedCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super(NumberedCanvas, self).showPage()
        super(NumberedCanvas, self).save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))
        
        # Header (Pages 2+)
        if self._pageNumber > 1:
            self.drawString(36, letter[1] - 28, "ARGUS MASTER CAM CNC SOFTWARE")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(185, letter[1] - 28, "— Client Verification & Testing Guide (v2.4.0)")
            self.drawRightString(letter[0] - 36, letter[1] - 28, "ARGUS TECHNOLOGIES")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.6)
            self.line(36, letter[1] - 32, letter[0] - 36, letter[1] - 32)
            
        # Footer (All Pages)
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(36, 22, "CONFIDENTIAL & PROPRIETARY — FOR AUTHORIZED CLIENT TESTING & EVALUATION ONLY")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 36, 22, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.6)
        self.line(36, 30, letter[0] - 36, 30)
        
        self.restoreState()

def build_pdf(filename="Argus_Master_CAM_Client_Testing_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=40,
        bottomMargin=38
    )

    styles = getSampleStyleSheet()
    
    # Industrial CAD Palette
    c_primary = colors.HexColor("#0f172a")     # Slate 900
    c_accent_blue = colors.HexColor("#0284c7") # Sky 600
    c_accent_dark = colors.HexColor("#1e293b") # Slate 800
    c_emerald = colors.HexColor("#059669")     # Emerald 600
    c_amber = colors.HexColor("#d97706")       # Amber 600
    c_muted = colors.HexColor("#475569")       # Slate 600
    c_bg_card = colors.HexColor("#f8fafc")     # Slate 50
    c_bg_subtle = colors.HexColor("#f1f5f9")   # Slate 100
    c_border = colors.HexColor("#cbd5e1")      # Slate 300
    
    # Typography Styles
    title_style = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=21,
        leading=25,
        textColor=c_primary,
        spaceAfter=4
    )
    
    subtitle_style = ParagraphStyle(
        'CoverSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_accent_blue,
        spaceAfter=10
    )

    h1_style = ParagraphStyle(
        'SectionHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=c_primary,
        spaceBefore=7,
        spaceAfter=4,
        keepWithNext=True
    )

    h2_style = ParagraphStyle(
        'SectionHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_accent_blue,
        spaceBefore=6,
        spaceAfter=3,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_primary,
        spaceAfter=4
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=12,
        textColor=c_primary,
        spaceAfter=4
    )

    callout_style = ParagraphStyle(
        'CalloutText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=12,
        textColor=c_accent_dark
    )

    code_style = ParagraphStyle(
        'CodeStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8,
        leading=11,
        textColor=colors.HexColor("#0369a1")
    )

    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.white
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_primary
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=11,
        textColor=c_primary
    )

    story = []

    # =========================================================================
    # PAGE 1: COVER, METADATA, PURPOSE, LAUNCH INSTRUCTIONS
    # =========================================================================
    badge_table = Table(
        [[
            Paragraph("<b>ARGUS TECHNOLOGIES</b> &bull; INDUSTRIAL CNC CAD/CAM DIVISION", ParagraphStyle('B1', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#0284c7"))),
            Paragraph("TEST SPECIFICATION: <b>ARGUS-CAM-QA-2026-V1</b>", ParagraphStyle('B2', fontName='Helvetica-Bold', fontSize=8, textColor=colors.HexColor("#64748b"), alignment=2))
        ]],
        colWidths=[340, 200]
    )
    badge_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ('TOPPADDING', (0,0), (-1,-1), 0),
        ('LEFTPADDING', (0,0), (-1,-1), 0),
        ('RIGHTPADDING', (0,0), (-1,-1), 0),
    ]))
    story.append(badge_table)
    story.append(Spacer(1, 4))
    story.append(HRFlowable(width="100%", thickness=1.5, color=c_accent_blue, spaceBefore=0, spaceAfter=8))

    story.append(Paragraph("Argus Master CAM CNC Software", title_style))
    story.append(Paragraph("Client Functional Verification & Interactive Step-by-Step Testing Guide", subtitle_style))
    
    meta_data = [
        [
            Paragraph("<b>Software Release:</b> v2.4.0 Production Build", table_cell_style),
            Paragraph("<b>Application Target:</b> DMG MORI DMU 50 (5-Axis) / VMC 3-Axis", table_cell_style),
        ],
        [
            Paragraph("<b>Execution Mode:</b> 100% Dynamic Math (Zero Mock Flow)", table_cell_style),
            Paragraph("<b>Primary Default Theme:</b> Mastercam Light CAD Palette", table_cell_style),
        ],
        [
            Paragraph("<b>Tested Environment:</b> Windows 10/11 x64 Desktop", table_cell_style),
            Paragraph("<b>Core Stack:</b> React 19, Three.js WebGL, Rust Native (Tauri v2)", table_cell_style),
        ]
    ]
    meta_table = Table(meta_data, colWidths=[270, 270])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("1. Executive Testing Scope & Dynamic Architecture", h1_style))
    story.append(Paragraph(
        "This verification document guides client evaluation engineers and CAM programmers through the operational capabilities "
        "of <b>Argus Master CAM</b>. Every capability demonstrated herein operates on <b>real geometric mathematics, live 3D kinematic "
        "trajectories, and physical cutting force algorithms</b>. No mock paths or pre-recorded flows are utilized.",
        body_style
    ))

    exec_callout = [
        [
            Paragraph("<b>GUARANTEED DYNAMIC CAPABILITIES READY FOR YOUR EVALUATION:</b><br/>"
                      "&bull; <b>Mathematical Toolpath Generation:</b> Dynamic Pocketing, Facing, Waterline, Swarf 5-Axis, Rest Milling, and Pencil Tracing compute real cutter contact points from stepover % and stepdown depths.<br/>"
                      "&bull; <b>Interactive 3D Backplot:</b> Three.js kinematic cutter assembly navigates real 3D trajectories with live X/Y/Z coordinate telemetry and solid material removal.<br/>"
                      "&bull; <b>Multi-Dialect G-Code Post-Processor:</b> Generates and exports syntactically compliant CNC programs for Siemens 840D, Heidenhain TNC 640, Fanuc 31i, and Haas NGC.<br/>"
                      "&bull; <b>Machining Physics Engine:</b> Calculates Kienzle cutting force (Fc), spindle power (kW), torque (Nm), and cantilever deflection (&mu;m) using ISO material standards.", callout_style)
        ]
    ]
    callout_tbl = Table(exec_callout, colWidths=[540])
    callout_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f0fdf4")),
        ('BOX', (0,0), (-1,-1), 1, c_emerald),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(callout_tbl)
    story.append(Spacer(1, 8))

    story.append(Paragraph("2. How to Launch the Software on Your Test Station", h1_style))
    story.append(Paragraph(
        "Open PowerShell or Command Prompt in the application folder and choose your preferred execution method:",
        body_style
    ))
    
    cmd_data = [
        [
            Paragraph("<b>Native Desktop Window (Recommended):</b><br/><code>npm run tauri dev</code><br/><i>Launches the hardware-accelerated Windows native desktop binary.</i>", code_style),
            Paragraph("<b>Browser Mode (Alternative):</b><br/><code>npm run dev</code><br/><i>Spins up the Vite engine at http://localhost:5173 for quick web inspection.</i>", code_style)
        ]
    ]
    cmd_table = Table(cmd_data, colWidths=[270, 270])
    cmd_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_subtle),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
    ]))
    story.append(cmd_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("3. Overview of Test Scenarios in this Guide", h1_style))
    story.append(Paragraph(
        "This guide is divided into five targeted functional test modules with step-by-step instructions and expected outputs:",
        body_style
    ))
    
    overview_data = [
        [Paragraph("<b>Scenario 1:</b> 3D Toolpath Backplot & Kinematic Verification", table_cell_style), Paragraph("Interactive tool tracing, feed/rapid color tracking & solid verify", table_cell_style)],
        [Paragraph("<b>Scenario 2:</b> Dynamic CAM Operations Wizard", table_cell_style), Paragraph("Real-time toolpath recalculation via stepover % and stepdown changes", table_cell_style)],
        [Paragraph("<b>Scenario 3:</b> 5-Axis G-Code Post & File Download", table_cell_style), Paragraph("DMU 50 stroke audit & local download of .nc / .mpf / .h programs", table_cell_style)],
        [Paragraph("<b>Scenario 4:</b> Feeds, Speeds & Kienzle Physics", table_cell_style), Paragraph("Cutting force, spindle load kW, torque & tool deflection live math", table_cell_style)],
        [Paragraph("<b>Scenario 5:</b> 3D Collision Audit & CPlanes Studio", table_cell_style), Paragraph("Holder interference check, 5-axis angled planes & light/dark toggle", table_cell_style)]
    ]
    overview_table = Table(overview_data, colWidths=[230, 310])
    overview_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
    ]))
    story.append(overview_table)

    # =========================================================================
    # PAGE 2: TEST SCENARIO 1 & 2
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("TEST SCENARIO 1: In-Viewport 3D Backplot & Kinematic Verification", h1_style))
    story.append(Paragraph("<b>Target Capability:</b> Validate that toolpaths are true 3D spline trajectories and that the kinematic cutter assembly moves accurately with live telemetry.", body_style))
    
    t1_steps = [
        [Paragraph("#", table_header_style), Paragraph("Action to Perform", table_header_style), Paragraph("Expected System Response & Validation Criteria", table_header_style)],
        [
            Paragraph("1.1", table_cell_bold),
            Paragraph("Inspect the left <b>Operations Manager</b> sidebar.", table_cell_style),
            Paragraph("A structured tree displays the active CAM operations: <i>Face Milling (Top Z:0)</i>, <i>2D Dynamic Adaptive Pocket</i>, <i>3D Waterline Finishing</i>, and <i>5-Axis Swarf</i>. Each card displays tool number, badge, and visibility state.", table_cell_style)
        ],
        [
            Paragraph("1.2", table_cell_bold),
            Paragraph("In the top Ribbon bar, open the <b>Toolpaths</b> tab and click <b>Backplot</b> (cyan icon) — OR click the <b>Play icon</b> on Operation #2 in the sidebar.", table_cell_style),
            Paragraph("The 3D Viewport switches into Backplot mode. A 3D cutter assembly (fluted endmill + cylindrical shank + ISO-standard tapered toolholder) snaps to the trajectory start point.", table_cell_style)
        ],
        [
            Paragraph("1.3", table_cell_bold),
            Paragraph("Click the <b>Play (▶)</b> button on the floating HUD control bar at the bottom of the viewport.", table_cell_style),
            Paragraph("The cutter assembly navigates along the toolpath in continuous motion. Cutting feed passes (G01/G02/G03) render in emerald/blue; rapid positioning moves (G00) render in dashed amber lines.", table_cell_style)
        ],
        [
            Paragraph("1.4", table_cell_bold),
            Paragraph("Drag the <b>Timeline Scrubber Slider</b> back and forth manually.", table_cell_style),
            Paragraph("The tool assembly tracks immediately to the exact percentage position. The HUD telemetry panel displays real-time <b>X, Y, Z coordinates (mm)</b> and cutting feed status.", table_cell_style)
        ],
        [
            Paragraph("1.5", table_cell_bold),
            Paragraph("Switch the mode toggle on the scrubber from <b>Backplot</b> to <b>Verify Solid</b>.", table_cell_style),
            Paragraph("Solid workpiece material removal activates, dynamically carving the raw stock billet to reveal machined pocket cavities and contours.", table_cell_style)
        ]
    ]
    t1_table = Table(t1_steps, colWidths=[25, 235, 280])
    t1_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t1_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("TEST SCENARIO 2: Dynamic CAM Toolpath Generation & Editing", h1_style))
    story.append(Paragraph("<b>Target Capability:</b> Prove that toolpaths recalculate mathematically on-the-fly when user machining parameters change.", body_style))
    
    t2_steps = [
        [Paragraph("#", table_header_style), Paragraph("Action to Perform", table_header_style), Paragraph("Expected System Response & Validation Criteria", table_header_style)],
        [
            Paragraph("2.1", table_cell_bold),
            Paragraph("Click the green <b>Operations Wizard</b> button in the Toolpaths ribbon.", table_cell_style),
            Paragraph("The Mastercam CAM Operations Manager Wizard modal opens displaying strategy options (Facing, Pocket, Waterline, Swarf, Adaptive, Rest, Pencil).", table_cell_style)
        ],
        [
            Paragraph("2.2", table_cell_bold),
            Paragraph("In the <b>Create Operation</b> tab, select <b>Dynamic Pocket</b>.", table_cell_style),
            Paragraph("Form fields populate with parameter inputs: Assigned Tool, Stepover %, Stepdown, Total Depth, Stock to Leave (XY & Z), and Rapid Clearance Height.", table_cell_style)
        ],
        [
            Paragraph("2.3", table_cell_bold),
            Paragraph("Modify the cutting geometry:<br/>• Change <b>Stepdown</b> from <code>4.0 mm</code> to <code>1.5 mm</code><br/>• Change <b>Stepover %</b> from <code>50%</code> to <code>25%</code>", table_cell_style),
            Paragraph("Input fields update instantly with real-time numeric validation.", table_cell_style)
        ],
        [
            Paragraph("2.4", table_cell_bold),
            Paragraph("Click <b>Generate & Add Operation</b>.", table_cell_style),
            Paragraph("The modal closes. <b>Inspect the 3D Viewport:</b> The toolpath instantly regenerates with noticeably denser, finer z-level depth passes matching the exact 1.5mm stepdown and 25% stepover.", table_cell_style)
        ],
        [
            Paragraph("2.5", table_cell_bold),
            Paragraph("Click the <b>Eye icon</b> on any operation in the left sidebar.", table_cell_style),
            Paragraph("The selected toolpath pass toggles between visible and hidden immediately in the 3D scene.", table_cell_style)
        ]
    ]
    t2_table = Table(t2_steps, colWidths=[25, 235, 280])
    t2_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t2_table)

    # =========================================================================
    # PAGE 3: TEST SCENARIO 3 & 4
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("TEST SCENARIO 3: 5-Axis G-Code Post-Processor & Real File Download", h1_style))
    story.append(Paragraph("<b>Target Capability:</b> Verify real multi-controller NC program generation, kinematic stroke auditing, and local file export.", body_style))

    t3_steps = [
        [Paragraph("#", table_header_style), Paragraph("Action to Perform", table_header_style), Paragraph("Expected System Response & Validation Criteria", table_header_style)],
        [
            Paragraph("3.1", table_cell_bold),
            Paragraph("In the Ribbon (Toolpaths tab), click the highlighted <b>G1 Post</b> button (or <b>Post & Export</b> in Machine tab).", table_cell_style),
            Paragraph("The <b>NC2Check 5-Axis Post-Processor & Kinematic Audit</b> studio modal opens.", table_cell_style)
        ],
        [
            Paragraph("3.2", table_cell_bold),
            Paragraph("Select different <b>CNC Controller Dialects</b> from the dropdown:<br/>• <b>Siemens 840D sl / Sinumerik ONE</b> (`.mpf`)<br/>• <b>Heidenhain TNC 640 (PLANE SPATIAL)</b> (`.h`)<br/>• <b>Fanuc 31i-B5</b> (`.nc`)<br/>• <b>Haas NextGen (NGC)</b> (`.nc`)", table_cell_style),
            Paragraph("The post engine dynamically reconfigures program headers, block numbering, tool change syntax (`M06`), plane spatial rotations, and canned cycle parameters.", table_cell_style)
        ],
        [
            Paragraph("3.3", table_cell_bold),
            Paragraph("Click <b>Run Pre-Flight Audit & Generate G-Code</b>.", table_cell_style),
            Paragraph("The audit engine tests toolpaths against DMG MORI DMU 50 physical travel limits (X: &plusmn;250mm, Y: &plusmn;200mm, Z: -100/+350mm, B: -5&deg;/110&deg;). Success card displays: <b>Line Count, Total Cutting Distance (m), and Estimated Machining Time (min)</b>.", table_cell_style)
        ],
        [
            Paragraph("3.4", table_cell_bold),
            Paragraph("Click <b>Download File</b>.", table_cell_style),
            Paragraph("A real CNC program file (e.g. <code>DMU50_ZeroClamp_Job.nc</code>) is downloaded to your workstation. Open it in any text editor — it contains complete, syntactically valid G-code ready for machine transfer.", table_cell_style)
        ]
    ]
    t3_table = Table(t3_steps, colWidths=[25, 235, 280])
    t3_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t3_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("TEST SCENARIO 4: Feeds, Speeds & Kienzle Cutting Physics Studio", h1_style))
    story.append(Paragraph("<b>Target Capability:</b> Validate that scientific cutting forces, spindle power, torque, and tool deflection are computed live.", body_style))

    t4_steps = [
        [Paragraph("#", table_header_style), Paragraph("Action to Perform", table_header_style), Paragraph("Expected System Response & Validation Criteria", table_header_style)],
        [
            Paragraph("4.1", table_cell_bold),
            Paragraph("In the Ribbon (Machine or Toolpaths tab), click the cyan <b>Feeds & Speeds</b> button.", table_cell_style),
            Paragraph("The Feeds, Speeds & Machining Physics Calculator opens.", table_cell_style)
        ],
        [
            Paragraph("4.2", table_cell_bold),
            Paragraph("Change the <b>Workpiece Material</b> dropdown from <i>Aluminum 6061-T6</i> to <i>Titanium Ti-6Al-4V</i> or <i>Inconel 718</i>.", table_cell_style),
            Paragraph("Physical telemetry cards update live: <b>Kienzle Specific Force (kc1.1)</b>, <b>Spindle Power (kW)</b>, and <b>Torque (Nm)</b> increase in direct accordance with material hardness.", table_cell_style)
        ],
        [
            Paragraph("4.3", table_cell_bold),
            Paragraph("Modify <b>Tool Stickout Length</b> (e.g. increase from 45mm to 70mm).", table_cell_style),
            Paragraph("The <b>Tool Cantilever Deflection (&mu;m)</b> recalculates using cubic cantilever beam deflection equations (y = F*L^3 / 3*E*I). Automatic high-deflection alerts trigger if deflection exceeds tolerance.", table_cell_style)
        ],
        [
            Paragraph("4.4", table_cell_bold),
            Paragraph("Click <b>Apply to Active Tool</b> or <b>Apply to Operation</b>.", table_cell_style),
            Paragraph("The calculated spindle RPM, feed rate, and depths are pushed directly into the tool library and active operation parameters.", table_cell_style)
        ]
    ]
    t4_table = Table(t4_steps, colWidths=[25, 235, 280])
    t4_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t4_table)

    # =========================================================================
    # PAGE 4: TEST SCENARIO 5 & VERIFICATION SIGN-OFF SHEET
    # =========================================================================
    story.append(PageBreak())

    story.append(Paragraph("TEST SCENARIO 5: 3D Collision Audit, CPlanes & Theme Engine", h1_style))
    story.append(Paragraph("<b>Target Capability:</b> Test kinematic holder interference verification, dynamic 5-axis coordinate planes, and 1-click theme switching.", body_style))

    t5_steps = [
        [Paragraph("#", table_header_style), Paragraph("Action to Perform", table_header_style), Paragraph("Expected System Response & Validation Criteria", table_header_style)],
        [
            Paragraph("5.1", table_cell_bold),
            Paragraph("In the Ribbon (Toolpaths tab), click <b>Collision Check</b> (under Safety).", table_cell_style),
            Paragraph("The 3D Gouge & Kinematic Interference engine audits cutter flutes, shank, and holder against the workpiece mesh. Collision points are highlighted with a 1-click <b>Auto-Fix Clearances</b> button.", table_cell_style)
        ],
        [
            Paragraph("5.2", table_cell_bold),
            Paragraph("In the Ribbon (Home or Machine tab), click <b>CPlane Studio</b>.", table_cell_style),
            Paragraph("The CPlanes & Dynamic WCS Origin Studio opens.", table_cell_style)
        ],
        [
            Paragraph("5.3", table_cell_bold),
            Paragraph("Under <b>Angled Plane</b>, enter Tilt B = <code>30&deg;</code>, Rotation C = <code>45&deg;</code>, and click <b>Create & Activate Plane</b>.", table_cell_style),
            Paragraph("<b>Inspect the 3D Viewport:</b> A dynamic construction plane grid with an RGB orientation triad renders tilted at the exact 30&deg;/45&deg; compound angle.", table_cell_style)
        ],
        [
            Paragraph("5.4", table_cell_bold),
            Paragraph("Click the <b>Sun / Moon icon</b> in the top TitleBar (quick access area).", table_cell_style),
            Paragraph("The entire interface flips instantly between <b>Mastercam Light CAD</b> and <b>Industrial Dark CAD</b> with zero latency or state loss.", table_cell_style)
        ]
    ]
    t5_table = Table(t5_steps, colWidths=[25, 235, 280])
    t5_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t5_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("4. Client Test Verification Checklist & Sign-Off Sheet", h1_style))
    story.append(Paragraph("Please record evaluation results during your testing session and return this page to Argus Technologies:", body_style))

    signoff_data = [
        [Paragraph("Feature / Module Under Test", table_header_style), Paragraph("Evaluation Criteria", table_header_style), Paragraph("Status", table_header_style), Paragraph("Client Notes / Comments", table_header_style)],
        [Paragraph("<b>1. In-Viewport 3D Backplot</b>", table_cell_style), Paragraph("Smooth tool animation with coordinate telemetry & scrubber control", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)],
        [Paragraph("<b>2. Volumetric Solid Verify</b>", table_cell_style), Paragraph("Workpiece stock cavity removes accurately along toolpath pass", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)],
        [Paragraph("<b>3. Dynamic Toolpath Recalc</b>", table_cell_style), Paragraph("Changing stepdown/stepover regenerates 3D passes dynamically", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)],
        [Paragraph("<b>4. Multi-Dialect NC Post</b>", table_cell_style), Paragraph("Siemens / Fanuc / Heidenhain G-code generated and downloaded", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)],
        [Paragraph("<b>5. Feeds & Speeds Physics</b>", table_cell_style), Paragraph("Kienzle Fc, power kW, torque, and deflection calculate live", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)],
        [Paragraph("<b>6. 5-Axis CPlanes & Theme</b>", table_cell_style), Paragraph("Tilted 3D grid renders; 1-click Light/Dark toggle transitions cleanly", table_cell_style), Paragraph("[  ] PASS<br/>[  ] FAIL", table_cell_style), Paragraph("", table_cell_style)]
    ]
    signoff_table = Table(signoff_data, colWidths=[130, 195, 65, 150])
    signoff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_accent_dark),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(signoff_table)
    story.append(Spacer(1, 8))

    sig_data = [
        [Paragraph("<b>Client Evaluator Name:</b> ___________________________", table_cell_style), Paragraph("<b>Job Title / Role:</b> ___________________________", table_cell_style)],
        [Paragraph("<b>Company / Organization:</b> ___________________________", table_cell_style), Paragraph("<b>Evaluation Date:</b> ___________________________", table_cell_style)],
        [Paragraph("<b>Overall Evaluation:</b> [  ] ACCEPTED   [  ] CONDITIONAL   [  ] REVISE", table_cell_style), Paragraph("<b>Signature:</b> ___________________________", table_cell_style)]
    ]
    sig_table = Table(sig_data, colWidths=[270, 270])
    sig_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
        ('BOX', (0,0), (-1,-1), 1, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>Technical Inquiries & Feedback Submission:</b> Contact the engineering team at <b>engineering@argus-technologies.internal</b>. "
        "All CNC post-processors and kinematic digital twin models can be tailored to your shop's specific CNC machine configurations.",
        ParagraphStyle('FootNote', parent=styles['Normal'], fontName='Helvetica', fontSize=7.5, leading=10, textColor=c_muted)
    ))

    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built: {filename}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "Argus_Master_CAM_Client_Testing_Guide.pdf"
    build_pdf(out_name)
