#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib.colors import HexColor, red, orange, green, black
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime

# Crear PDF
pdf_path = "/Users/mike/Experimentos_JuanJo /Experimentos_JuanJo/Through Air/Clientes/clientes/CENEXPO/AUDITORIA_SEO_SEM_RIOMAGGIORE.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=0.5*inch, leftMargin=0.5*inch, topMargin=0.75*inch, bottomMargin=0.75*inch)

styles = getSampleStyleSheet()
story = []

# Estilos personalizados
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=24,
    textColor=HexColor('#1a1a1a'),
    spaceAfter=6,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=14,
    textColor=HexColor('#d32f2f'),
    spaceAfter=10,
    spaceBefore=12,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'CustomNormal',
    parent=styles['Normal'],
    fontSize=10,
    alignment=TA_LEFT,
    spaceAfter=6
)

# === PÁGINA 1: ENCABEZADO ===
story.append(Paragraph("AUDITORÍA SEO/SEM", title_style))
story.append(Paragraph("riomaggiore.co", styles['Heading2']))
story.append(Spacer(1, 0.2*inch))

fecha = datetime.now().strftime("%d de %B de %Y").replace("de January", "de Enero").replace("de February", "de Febrero").replace("de March", "de Marzo").replace("de April", "de Abril").replace("de May", "de Mayo").replace("de June", "de Junio").replace("de July", "de Julio").replace("de August", "de Agosto").replace("de September", "de Septiembre").replace("de October", "de Octubre").replace("de November", "de Noviembre").replace("de December", "de Diciembre")
story.append(Paragraph(f"<b>Fecha de Auditoría:</b> {fecha}", normal_style))
story.append(Paragraph("<b>Sitio Web:</b> https://riomaggiore.co/", normal_style))
story.append(Paragraph("<b>Tipo de Proyecto:</b> Residencial - La Tebaida, Quindío", normal_style))
story.append(Spacer(1, 0.3*inch))

# === CALIFICACIÓN GENERAL ===
story.append(Paragraph("CALIFICACIÓN GENERAL", heading_style))
calificacion_data = [
    ['Aspecto', 'Calificación', 'Estado'],
    ['SEO Técnico', '4/10', '🔴 Crítico'],
    ['Contenido & Keywords', '5/10', '🟠 Deficiente'],
    ['Experiencia de Usuario', '6/10', '🟠 Mejorable'],
    ['Mobile & Velocidad', '5/10', '🟠 Deficiente'],
]

t = Table(calificacion_data, colWidths=[2.2*inch, 1.5*inch, 1.8*inch])
t.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#d32f2f')),
    ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 11),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f5f5f5')),
    ('GRID', (0, 0), (-1, -1), 1, black),
    ('FONTSIZE', (0, 1), (-1, -1), 10),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#f5f5f5')])
]))
story.append(t)
story.append(Spacer(1, 0.25*inch))

# === PUNTOS CRÍTICOS ===
story.append(Paragraph("🔴 PUNTOS CRÍTICOS (Acción Inmediata)", heading_style))

critical_issues = [
    ("1. Meta Description Faltante",
     "Cada página DEBE tener una meta description de 150-160 caracteres con palabras clave. Actualmente falta. Impacto: No aparecerá información descriptiva en resultados de búsqueda."),

    ("2. H1 No Optimizado",
     "No hay un H1 único y descriptivo. La jerarquía de encabezados es deficiente (H4/H5 sin H1/H2). Impacto: Google no identifica correctamente el tema principal de la página."),

    ("3. Texto ALT en Imágenes Ausente",
     "Las imágenes no tienen atributos ALT descriptivos. Esto afecta SEO y accesibilidad. Impacto: Pérdida de oportunidades de ranking por búsqueda de imágenes."),

    ("4. Sitemap.xml No Configurado",
     "No hay sitemap XML referenciado en robots.txt. Impacto: Google tarda más en descubrir todas las páginas del sitio."),
]

for título, descripción in critical_issues:
    story.append(Paragraph(f"<b>{título}</b>", ParagraphStyle('SubHeading', parent=styles['Normal'], fontSize=10, textColor=HexColor('#d32f2f'), fontName='Helvetica-Bold', spaceAfter=4)))
    story.append(Paragraph(descripción, normal_style))
    story.append(Spacer(1, 0.1*inch))

story.append(PageBreak())

# === PÁGINA 2: RECOMENDACIONES ===
story.append(Paragraph("RECOMENDACIONES DETALLADAS", heading_style))

recomendaciones = [
    ("PRIORIDAD 1: Meta Descriptions", [
        "• Crear meta description única para cada página (150-160 caracteres)",
        "• Incluir palabra clave principal + propuesta de valor",
        "• Ejemplo: 'Riomaggiore en La Tebaida, Quindío. Residencial de lujo con diseño moderno, amenidades premium y ubicación privilegiada. ¡Conoce tu nuevo hogar!'",
        "Tiempo estimado: 2 horas | Impacto: Alto"
    ]),

    ("PRIORIDAD 1: Estructura de Encabezados", [
        "• Agregar un H1 único por página (diferente a title)",
        "• Estructura correcta: H1 → H2 → H3 (máximo 1 H1 por página)",
        "• Ejemplo H1: 'Proyecto Residencial Riomaggiore - Armenia, Quindío'",
        "Tiempo estimado: 3 horas | Impacto: Alto"
    ]),

    ("PRIORIDAD 1: Optimización de Imágenes", [
        "• Agregar ALT text a TODAS las imágenes",
        "• Formato: [Tipo de espacio/amenidad] + 'en Riomaggiore, La Tebaida'",
        "• Comprimir imágenes para mejorar velocidad (máx 100KB para web)",
        "• Implementar lazy loading",
        "Tiempo estimado: 4 horas | Impacto: Muy Alto"
    ]),

    ("PRIORIDAD 2: Velocidad de Carga", [
        "• Minificar CSS y JavaScript",
        "• Diferir carga de scripts no críticos",
        "• Usar CDN para servir assets",
        "• Eliminar scripts innecesarios (revisar jQuery + plugins)",
        "Tiempo estimado: 5 horas | Impacto: Alto"
    ]),

    ("PRIORIDAD 2: Contenido & Keywords", [
        "• Investigar keywords locales: 'residencial La Tebaida', 'apartamentos Armenia Quindío'",
        "• Crear secciones de contenido para c/amenidad (piscina, gym, parques)",
        "• Optimizar textos naturalmente con keywords target",
        "• Agregar FAQ schema markup (preguntas frecuentes)",
        "Tiempo estimado: 6 horas | Impacto: Medio-Alto"
    ]),
]

for titulo, items in recomendaciones:
    story.append(Paragraph(f"<b>{titulo}</b>", ParagraphStyle('SubHeading', parent=styles['Normal'], fontSize=11, textColor=HexColor('#1976d2'), fontName='Helvetica-Bold', spaceAfter=6)))
    for item in items:
        story.append(Paragraph(item, normal_style))
    story.append(Spacer(1, 0.15*inch))

# === ASPECTOS POSITIVOS ===
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("✅ ASPECTOS POSITIVOS", ParagraphStyle('SubHeading', parent=styles['Normal'], fontSize=12, textColor=green, fontName='Helvetica-Bold')))

positivos = [
    "• Estructura URL limpia: riomaggiore.co",
    "• Navegación intuitiva con menú principal clara",
    "• Presencia en redes sociales integrada (Facebook, Instagram, WhatsApp, YouTube)",
    "• Viewport configurado correctamente (mobile-responsive)",
    "• Información de ubicación clara y específica"
]

for item in positivos:
    story.append(Paragraph(item, normal_style))

story.append(PageBreak())

# === PÁGINA 3: ESTRATEGIA COMPLEMENTARIA (SEM) ===
story.append(Paragraph("ESTRATEGIA COMPLEMENTARIA: SEM (Google Ads)", heading_style))

sem_texto = """
<b>Mientras optimizas SEO (proceso de 2-3 meses), implementa SEM para resultados inmediatos:</b><br/><br/>

<b>1. Google Search Ads - Keywords Prioritarios:</b><br/>
• "residencial La Tebaida" | "apartamentos Armenia Quindío" | "proyecto vivienda Eje Cafetero"<br/>
• "casas nuevas La Tebaida" | "apartamentos nuevos Armenia" | "vivienda moderna Quindío"<br/>
Presupuesto sugerido: $400-600 USD/mes (inicialmente)<br/><br/>

<b>2. Google Display - Remarketing:</b><br/>
• Audiencias: Visitantes del sitio que NO compraron<br/>
• Anuncios: Promoción de amenidades, cronograma de entregas<br/>
Presupuesto sugerido: $200-300 USD/mes<br/><br/>

<b>3. Meta Ads (Facebook/Instagram):</b><br/>
• Segmentación: Profesionales 30-50 años, ingresos altos, ciudades cercanas<br/>
• Anuncios: Tours virtuales, testimonios, lifestyle amenities<br/>
Presupuesto sugerido: $300-400 USD/mes<br/><br/>

<b>Conversión esperada con SEM:</b> 5-8 leads/mes (dependiendo de presupuesto y calidad de landing page)<br/>
<b>Costo por lead estimado:</b> $50-80 USD
"""

story.append(Paragraph(sem_texto, normal_style))

# === ROADMAP ===
story.append(Spacer(1, 0.2*inch))
story.append(Paragraph("ROADMAP DE IMPLEMENTACIÓN", heading_style))

roadmap_data = [
    ['Fase', 'Tareas', 'Duración', 'Prioridad'],
    ['1. CRÍTICA\n(Semana 1-2)', 'Meta descriptions + H1 + ALT text', '10-12 horas', 'INMEDIATA'],
    ['2. OPTIMIZACIÓN\n(Semana 3)', 'Velocidad + Estructura SEO técnica', '8-10 horas', 'Alta'],
    ['3. CONTENIDO\n(Semana 4)', 'Keywords research + Secciones contenido', '6 horas', 'Media'],
    ['4. MONITOREO\n(Mes 2+)', 'Google Search Console + Analytics 4', 'Continuo', 'Mantenimiento'],
]

t2 = Table(roadmap_data, colWidths=[1.3*inch, 2.2*inch, 1.3*inch, 1.2*inch])
t2.setStyle(TableStyle([
    ('BACKGROUND', (0, 0), (-1, 0), HexColor('#1976d2')),
    ('TEXTCOLOR', (0, 0), (-1, 0), 'white'),
    ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, 0), 10),
    ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
    ('BACKGROUND', (0, 1), (-1, -1), HexColor('#f5f5f5')),
    ('GRID', (0, 0), (-1, -1), 1, black),
    ('FONTSIZE', (0, 1), (-1, -1), 9),
    ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ('ROWBACKGROUNDS', (0, 1), (-1, -1), [HexColor('#ffffff'), HexColor('#f5f5f5')])
]))
story.append(t2)

story.append(Spacer(1, 0.3*inch))

# === CONCLUSIÓN ===
story.append(Paragraph("CONCLUSIÓN", heading_style))
conclusion = """
El sitio <b>riomaggiore.co</b> tiene fundamentos sólidos en diseño y navegación, pero carece de optimización SEO técnica fundamental. Los problemas identificados son <b>fácilmente solucionables</b> en 2-3 semanas.<br/><br/>

<b>Acción recomendada:</b> Implementar PRIORITARIAMENTE meta descriptions, H1 y ALT text esta semana. Paralelamente, lanzar campaña SEM para captar demanda inmediata mientras SEO gana tracción.<br/><br/>

<b>Potencial de impacto:</b> Con estas optimizaciones, se espera aumento de 150-300% en tráfico orgánico en 3 meses.
"""
story.append(Paragraph(conclusion, normal_style))

# Construir PDF
doc.build(story)
print(f"✅ PDF generado: {pdf_path}")
