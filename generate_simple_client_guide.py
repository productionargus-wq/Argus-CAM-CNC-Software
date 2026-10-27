import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, HRFlowable
)
from reportlab.pdfgen import canvas

class TwoPageCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super(TwoPageCanvas, self).__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_decorations(num_pages)
            super(TwoPageCanvas, self).showPage()
        super(TwoPageCanvas, self).save()

    def draw_decorations(self, page_count):
        self.saveState()
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor("#0284c7"))
        
        # Header on Page 2
        if self._pageNumber > 1:
            self.drawString(36, letter[1] - 25, "ARGUS MASTER CAM CNC SOFTWARE")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(185, letter[1] - 25, "- Simple Client Testing Guide (Online Demo)")
            self.drawRightString(letter[0] - 36, letter[1] - 25, "LIVE: arguscamcncsoftware.vercel.app")
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.5)
            self.line(36, letter[1] - 28, letter[0] - 36, letter[1] - 28)
            
        # Footer on all pages
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(36, 18, "Argus Master CAM &bull; Online Browser Test Guide &bull; No Installation Required")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(letter[0] - 36, 18, page_str)
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.5)
        self.line(36, 26, letter[0] - 36, 26)
        
        self.restoreState()

def build_simple_pdf(filename="Argus_CAM_Simple_Client_Testing_Guide.pdf"):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=32,
        bottomMargin=32
    )

    styles = getSampleStyleSheet()
    
    # Palette
    c_primary = colors.HexColor("#0f172a")     # Slate 900
    c_blue = colors.HexColor("#0284c7")        # Sky 600
    c_dark = colors.HexColor("#1e293b")        # Slate 800
    c_green = colors.HexColor("#059669")       # Emerald 600
    c_bg_card = colors.HexColor("#f8fafc")     # Slate 50
    c_border = colors.HexColor("#cbd5e1")      # Slate 300
    
    # Styles
    title_style = ParagraphStyle(
        'MainTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=21,
        textColor=c_primary,
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'Subtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=13,
        textColor=c_blue,
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'StepHeading',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=c_dark,
        spaceBefore=5,
        spaceAfter=2,
        keepWithNext=True
    )

    body_style = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=11,
        textColor=c_primary,
        spaceAfter=2
    )

    code_style = ParagraphStyle(
        'Code',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#0284c7")
    )

    tbl_header = ParagraphStyle(
        'TH',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    tbl_cell = ParagraphStyle(
        'TC',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_primary
    )

    tbl_cell_bold = ParagraphStyle(
        'TCB',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=10,
        textColor=c_primary
    )

    story = []

    # =========================================================================
    # PAGE 1: HEADER, LINK BANNER, STEPS 1 - 3
    # =========================================================================
    story.append(Paragraph("Argus Master CAM CNC Software", title_style))
    story.append(Paragraph("Client Quick Testing Guide - Simple Step-by-Step Instructions", subtitle_style))

    # Live Link Callout Card
    link_data = [[
        Paragraph(
            "<b>TEST IT LIVE IN YOUR BROWSER NOW (NO INSTALLATION REQUIRED):</b><br/>"
            "Open this link on your computer: "
            "<a href='https://arguscamcncsoftware.vercel.app' color='#0284c7'><b><u>https://arguscamcncsoftware.vercel.app</u></b></a><br/>"
            "<i>Works instantly on Google Chrome, Microsoft Edge, Firefox, or Safari.</i>",
            ParagraphStyle('LinkCard', fontName='Helvetica', fontSize=9, leading=13, textColor=c_dark)
        )
    ]]
    link_tbl = Table(link_data, colWidths=[540])
    link_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#eff6ff")),
        ('BOX', (0,0), (-1,-1), 1.2, c_blue),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(link_tbl)
    story.append(Spacer(1, 6))

    story.append(Paragraph(
        "<b>Note for the Client:</b> Everything in this software is <b>100% dynamic</b>. When you change numbers, toolpaths recalculate in real-time. When you post-process, real CNC files are created and downloaded to your PC.",
        body_style
    ))
    story.append(Spacer(1, 4))

    # STEP 1
    story.append(Paragraph("Step 1: Open the Software & Look at the Screen", h1_style))
    s1_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("1.1", tbl_cell_bold),
            Paragraph("Click the link: <b>https://arguscamcncsoftware.vercel.app</b>", tbl_cell),
            Paragraph("The software loads in a clean, professional <b>Light CAD Theme</b> (similar to SolidWorks and Mastercam).", tbl_cell)
        ],
        [
            Paragraph("1.2", tbl_cell_bold),
            Paragraph("Look at the <b>3D Viewport</b> in the center.", tbl_cell),
            Paragraph("You see the 3D part and the machine table. You can rotate the 3D view with your left mouse button, pan with right click, and zoom with scroll wheel.", tbl_cell)
        ],
        [
            Paragraph("1.3", tbl_cell_bold),
            Paragraph("Look at the <b>left sidebar</b> (Operations Manager).", tbl_cell),
            Paragraph("You will see ready-to-run toolpaths: <b>Face Milling</b>, <b>2D Dynamic Pocket</b>, <b>3D Waterline Finishing</b>, and <b>5-Axis Swarf</b>.", tbl_cell)
        ]
    ]
    t_s1 = Table(s1_steps, colWidths=[25, 235, 280])
    t_s1.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s1)
    story.append(Spacer(1, 6))

    # STEP 2
    story.append(Paragraph("Step 2: Watch the 3D Tool Cut the Part (Backplot Simulation)", h1_style))
    s2_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("2.1", tbl_cell_bold),
            Paragraph("Click the <b>Toolpaths</b> tab at the top Ribbon &bull; Click <b>Backplot</b> (cyan icon) - OR click the <b>Play (>) button</b> on Operation #2 in the left list.", tbl_cell),
            Paragraph("A realistic 3D cutting tool (fluted endmill, shank, and tapered spindle holder) appears directly inside the 3D workspace.", tbl_cell)
        ],
        [
            Paragraph("2.2", tbl_cell_bold),
            Paragraph("Click the <b>Play (>) button</b> on the bottom control bar.", tbl_cell),
            Paragraph("The tool moves along the toolpath. Green/blue lines show cutting passes. Dashed yellow lines show rapid positioning moves.", tbl_cell)
        ],
        [
            Paragraph("2.3", tbl_cell_bold),
            Paragraph("Drag the <b>Timeline Slider</b> back and forth with your mouse.", tbl_cell),
            Paragraph("The tool jumps to that exact moment. You see live <b>X, Y, Z coordinates (mm)</b> updating in real time on the screen.", tbl_cell)
        ],
        [
            Paragraph("2.4", tbl_cell_bold),
            Paragraph("Click <b>Verify Solid</b> on the bottom bar.", tbl_cell),
            Paragraph("Watch the solid raw stock block get carved away as the tool cuts into the cavity.", tbl_cell)
        ]
    ]
    t_s2 = Table(s2_steps, colWidths=[25, 235, 280])
    t_s2.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s2)
    story.append(Spacer(1, 6))

    # STEP 3
    story.append(Paragraph("Step 3: Change Cutting Settings & Watch Toolpaths Recalculate Live", h1_style))
    s3_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("3.1", tbl_cell_bold),
            Paragraph("Click the green <b>Operations Wizard</b> button in the top Ribbon.", tbl_cell),
            Paragraph("A settings window opens with options for Face Milling, Pocketing, Contouring, and 5-Axis.", tbl_cell)
        ],
        [
            Paragraph("3.2", tbl_cell_bold),
            Paragraph("Select <b>Dynamic Pocket</b> &bull; Change <b>Stepdown</b> from <code>4.0 mm</code> to <code>1.5 mm</code> &bull; Change <b>Stepover %</b> from <code>50%</code> to <code>25%</code>.", tbl_cell),
            Paragraph("You are asking the software to cut smaller, shallower, more precise passes.", tbl_cell)
        ],
        [
            Paragraph("3.3", tbl_cell_bold),
            Paragraph("Click <b>Generate & Add Operation</b>.", tbl_cell),
            Paragraph("The window closes. <b>Look at the 3D screen:</b> The toolpath lines recalculate immediately with much denser, finer cuts matching your exact numbers!", tbl_cell)
        ]
    ]
    t_s3 = Table(s3_steps, colWidths=[25, 235, 280])
    t_s3.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s3)

    # =========================================================================
    # PAGE 2: STEPS 4 - 6 & CLIENT FEEDBACK
    # =========================================================================
    story.append(PageBreak())

    # STEP 4
    story.append(Paragraph("Step 4: Generate & Download Real CNC G-Code to Your Computer", h1_style))
    s4_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("4.1", tbl_cell_bold),
            Paragraph("In the Ribbon (Toolpaths tab), click the blue <b>G1 Post</b> button (or <b>Post & Export</b>).", tbl_cell),
            Paragraph("The <b>NC2Check 5-Axis Post-Processor & Audit</b> window opens.", tbl_cell)
        ],
        [
            Paragraph("4.2", tbl_cell_bold),
            Paragraph("Select your CNC machine controller from the dropdown:<br/>&bull; <b>Siemens 840D / Sinumerik ONE</b> (`.mpf`)<br/>&bull; <b>Heidenhain TNC 640 (PLANE SPATIAL)</b> (`.h`)<br/>&bull; <b>Fanuc 31i-B5</b> (`.nc`)<br/>&bull; <b>Haas NextGen</b> (`.nc`)", tbl_cell),
            Paragraph("The post engine prepares correct syntax, header codes, and kinematic commands for that exact controller brand.", tbl_cell)
        ],
        [
            Paragraph("4.3", tbl_cell_bold),
            Paragraph("Click <b>Run Pre-Flight Audit & Generate G-Code</b>.", tbl_cell),
            Paragraph("The software checks if the part fits within DMG MORI DMU 50 axis limits. You see total <b>G-Code block count</b>, <b>cutting distance in meters</b>, and <b>cycle time in minutes</b>.", tbl_cell)
        ],
        [
            Paragraph("4.4", tbl_cell_bold),
            Paragraph("Click <b>Download File</b>.", tbl_cell),
            Paragraph("A real CNC program file downloads to your PC (e.g. <code>DMU50_ZeroClamp_Job.nc</code>). Open it in Notepad - it contains genuine G-code ready for a real CNC machine!", tbl_cell)
        ]
    ]
    t_s4 = Table(s4_steps, colWidths=[25, 235, 280])
    t_s4.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s4)
    story.append(Spacer(1, 6))

    # STEP 5
    story.append(Paragraph("Step 5: Test Real Machining Physics (Feeds & Speeds)", h1_style))
    s5_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("5.1", tbl_cell_bold),
            Paragraph("In the Ribbon, click the cyan <b>Feeds & Speeds</b> button.", tbl_cell),
            Paragraph("The Machining Physics Calculator opens.", tbl_cell)
        ],
        [
            Paragraph("5.2", tbl_cell_bold),
            Paragraph("Change the <b>Material</b> from <i>Aluminum 6061</i> to <i>Titanium Ti-6Al-4V</i> or <i>Steel 4140</i>.", tbl_cell),
            Paragraph("Watch the numbers update instantly: <b>Cutting Force (Fc in Newtons)</b>, <b>Spindle Power (kW)</b>, and <b>Torque (Nm)</b> increase to match the harder metal.", tbl_cell)
        ],
        [
            Paragraph("5.3", tbl_cell_bold),
            Paragraph("Increase <b>Tool Stickout</b> from 45 mm to 70 mm.", tbl_cell),
            Paragraph("The <b>Tool Deflection (microns)</b> recalculates live using beam bending formulas. Warnings appear if deflection is too high for precision tolerances.", tbl_cell)
        ]
    ]
    t_s5 = Table(s5_steps, colWidths=[25, 235, 280])
    t_s5.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s5)
    story.append(Spacer(1, 6))

    # STEP 6
    story.append(Paragraph("Step 6: Switch Between Light and Dark Theme (1-Click)", h1_style))
    s6_steps = [
        [Paragraph("#", tbl_header), Paragraph("What to Do", tbl_header), Paragraph("What You Will See", tbl_header)],
        [
            Paragraph("6.1", tbl_cell_bold),
            Paragraph("Click the <b>Sun / Moon icon</b> in the top-right TitleBar.", tbl_cell),
            Paragraph("The entire screen switches instantly between <b>Mastercam Light CAD</b> and <b>Industrial Dark CAD</b> with zero lag or page reload.", tbl_cell)
        ]
    ]
    t_s6 = Table(s6_steps, colWidths=[25, 235, 280])
    t_s6.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_s6)
    story.append(Spacer(1, 8))

    # 1-MINUTE CLIENT FEEDBACK BOX
    story.append(Paragraph("1-Minute Client Feedback & Sign-Off", h1_style))
    fb_data = [
        [Paragraph("Feature Tested", tbl_header), Paragraph("Did it work smoothly?", tbl_header), Paragraph("Client Rating / Comments", tbl_header)],
        [Paragraph("1. 3D Toolpath Backplot & Scrubber", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
        [Paragraph("2. Solid Material Removal Verify", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
        [Paragraph("3. Operations Wizard Recalculation", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
        [Paragraph("4. G-Code Post & File Download", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
        [Paragraph("5. Feeds & Speeds Physics Math", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
        [Paragraph("6. Light / Dark Theme Toggle", tbl_cell), Paragraph("[  ] YES    [  ] NO", tbl_cell), Paragraph("", tbl_cell)],
    ]
    t_fb = Table(fb_data, colWidths=[180, 110, 250])
    t_fb.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_dark),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('INNERGRID', (0,0), (-1,-1), 0.5, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 5),
        ('RIGHTPADDING', (0,0), (-1,-1), 5),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_bg_card])
    ]))
    story.append(t_fb)
    story.append(Spacer(1, 6))

    sig_data = [
        [
            Paragraph("<b>Evaluator Name:</b> ___________________________", tbl_cell),
            Paragraph("<b>Company:</b> ___________________________", tbl_cell),
            Paragraph("<b>Date:</b> ______________", tbl_cell),
            Paragraph("<b>Verdict:</b> [  ] APPROVED  [  ] REVISE", tbl_cell)
        ]
    ]
    t_sig = Table(sig_data, colWidths=[160, 150, 90, 140])
    t_sig.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_bg_card),
        ('BOX', (0,0), (-1,-1), 0.8, c_border),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('TOPPADDING', (0,0), (-1,-1), 4),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t_sig)

    doc.build(story, canvasmaker=TwoPageCanvas)
    print(f"Simple client guide PDF built: {filename}")

if __name__ == "__main__":
    out_name = sys.argv[1] if len(sys.argv) > 1 else "Argus_CAM_Simple_Client_Testing_Guide.pdf"
    build_simple_pdf(out_name)
