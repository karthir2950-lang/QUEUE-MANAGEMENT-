import io
from datetime import datetime
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle
from reportlab.platypus.flowables import HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
import qrcode

class TokenPDFService:
    @staticmethod
    def generate_token_pdf(appointment_data: dict, qr_data: str) -> bytes:
        """
        Generate a professional printable PDF ticket for a queue token.
        Returns the PDF as bytes.
        """
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4, rightMargin=72, leftMargin=72, topMargin=72, bottomMargin=18)
        
        styles = getSampleStyleSheet()
        
        # Custom styles
        title_style = ParagraphStyle(
            'TitleStyle',
            parent=styles['Heading1'],
            fontSize=24,
            spaceAfter=12,
            textColor=colors.HexColor('#4f46e5'), # Primary color
            alignment=1 # Center
        )
        
        subtitle_style = ParagraphStyle(
            'SubtitleStyle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.gray,
            alignment=1,
            spaceAfter=24
        )
        
        token_title_style = ParagraphStyle(
            'TokenTitleStyle',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.black,
            alignment=1,
            spaceAfter=6
        )
        
        token_value_style = ParagraphStyle(
            'TokenValueStyle',
            parent=styles['Heading1'],
            fontSize=48,
            textColor=colors.black,
            alignment=1,
            spaceAfter=24
        )
        
        normal_bold = ParagraphStyle('NormalBold', parent=styles['Normal'], fontName='Helvetica-Bold')
        
        footer_style = ParagraphStyle(
            'FooterStyle',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.gray,
            alignment=1,
            spaceAfter=6
        )
        
        elements = []
        
        # Header
        elements.append(Paragraph("SMARTQUEUE", title_style))
        elements.append(Paragraph("Smart Queue Management", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceAfter=24))
        
        # Token section
        elements.append(Paragraph("YOUR TOKEN", token_title_style))
        elements.append(Paragraph(appointment_data.get('token_number', '---'), token_value_style))
        
        # Details Table
        data = [
            [Paragraph("Booking ID", normal_bold), appointment_data.get('booking_id', '---')],
            [Paragraph("Customer", normal_bold), appointment_data.get('user_name', '---')],
            [Paragraph("Organization", normal_bold), appointment_data.get('organization', '---')],
            [Paragraph("Branch", normal_bold), appointment_data.get('branch', '---')],
            [Paragraph("Service", normal_bold), appointment_data.get('service', '---')],
            [Paragraph("Appointment Date", normal_bold), str(appointment_data.get('appointment_date', '---'))],
            [Paragraph("Appointment Time", normal_bold), str(appointment_data.get('appointment_time', '---'))],
            [Paragraph("Queue Status", normal_bold), appointment_data.get('queue_status', '---')],
        ]
        
        if appointment_data.get('queue_status') in ['WAITING']:
            data.extend([
                [Paragraph("People Ahead", normal_bold), str(appointment_data.get('people_ahead', 0))],
                [Paragraph("Estimated Wait", normal_bold), f"{appointment_data.get('estimated_wait_time', 0)} minutes"]
            ])

        table = Table(data, colWidths=[2*inch, 3*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, -1), 'LEFT'),
            ('ALIGN', (1, 0), (1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.lightgrey),
        ]))
        
        elements.append(table)
        elements.append(Spacer(1, 24))
        
        # QR Code
        elements.append(HRFlowable(width="100%", thickness=1, color=colors.lightgrey, spaceAfter=24))
        
        # Generate QR code image in memory
        qr = qrcode.QRCode(box_size=10, border=2)
        qr.add_data(qr_data)
        qr.make(fit=True)
        img = qr.make_image(fill_color="black", back_color="white")
        
        img_buffer = io.BytesIO()
        img.save(img_buffer, format="PNG")
        img_buffer.seek(0)
        
        qr_img = Image(img_buffer, width=1.5*inch, height=1.5*inch)
        qr_img.hAlign = 'CENTER'
        elements.append(qr_img)
        elements.append(Spacer(1, 12))
        
        # Footer
        elements.append(Paragraph("Please arrive before your appointment time.", footer_style))
        elements.append(Paragraph("Token status may change in real time.", footer_style))
        elements.append(Paragraph("Use the SmartQueue application for live queue updates.", footer_style))
        
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        return pdf_bytes
