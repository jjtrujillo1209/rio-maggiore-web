#!/usr/bin/env python3
"""
Through Air Marketing Agency - CLI Dashboard
Gestiona clientes, ejecuta auditorías y organiza reportes
"""

import os
import sys
import json
import datetime
from pathlib import Path
from typing import Optional, List

class ThroughAirCLI:
    def __init__(self):
        self.base_path = Path(__file__).parent
        self.clientes_path = self.base_path / "clientes"
        self.proyectos_path = self.base_path / "proyectos"
        self.reportes_path = self.base_path / "reportes"
        self.templates_path = self.base_path / "templates"

    def print_header(self, text: str):
        """Imprime header formateado"""
        print(f"\n{'='*60}")
        print(f"  {text}")
        print(f"{'='*60}\n")

    def print_success(self, text: str):
        """Imprime mensaje de éxito"""
        print(f"✅ {text}")

    def print_error(self, text: str):
        """Imprime mensaje de error"""
        print(f"❌ {text}")

    def print_info(self, text: str):
        """Imprime mensaje informativo"""
        print(f"ℹ️  {text}")

    def cmd_nuevo_cliente(self, nombre: str):
        """Crear nuevo cliente"""
        self.print_header(f"Nuevo Cliente: {nombre}")

        cliente_path = self.clientes_path / nombre
        cliente_path.mkdir(exist_ok=True)

        # Crear archivo de cliente desde template
        cliente_file = cliente_path / f"{nombre}.md"
        if not cliente_file.exists():
            template = """# Cliente: {nombre}

## Información Básica
**Nombre Empresa:** [Completar]
**Sitio Web:** [Completar]
**Industria:** [Completar]
**Contacto:** [Completar]

## Objetivos Marketing
1. [Objetivo 1]
2. [Objetivo 2]
3. [Objetivo 3]

## Estado Actual
[Describir situación actual]

## Proyectos Activos
[Listar proyectos]

---
**Creado:** {fecha}
**Estado:** Activo
""".format(nombre=nombre, fecha=datetime.date.today().isoformat())

            cliente_file.write_text(template)
            self.print_success(f"Cliente '{nombre}' creado")
            print(f"📁 Ubicación: {cliente_path}")
        else:
            self.print_error(f"Cliente '{nombre}' ya existe")

    def cmd_listar_clientes(self):
        """Listar todos los clientes"""
        self.print_header("Clientes Registrados")

        if not self.clientes_path.exists():
            self.print_info("No hay clientes registrados")
            return

        clientes = [d.name for d in self.clientes_path.iterdir() if d.is_dir()]

        if not clientes:
            self.print_info("No hay clientes registrados")
            return

        for i, cliente in enumerate(clientes, 1):
            print(f"{i}. {cliente}")

    def cmd_nuevo_proyecto(self, nombre: str, cliente: str):
        """Crear nuevo proyecto para un cliente"""
        self.print_header(f"Nuevo Proyecto: {nombre}")

        proyecto_path = self.proyectos_path / nombre
        proyecto_path.mkdir(exist_ok=True)

        # Crear estructura de proyecto
        (proyecto_path / "assets").mkdir(exist_ok=True)
        (proyecto_path / "reportes").mkdir(exist_ok=True)

        # Crear archivo de proyecto
        proyecto_file = proyecto_path / "proyecto.md"
        if not proyecto_file.exists():
            template = """# Proyecto: {nombre}

**Cliente:** {cliente}
**Fecha Inicio:** {fecha}
**Owner:** [Completar]

## Descripción
[Descripción del proyecto]

## Objetivos
1. [Objetivo 1]
2. [Objetivo 2]
3. [Objetivo 3]

## Timeline
[Ver template PROJECT_TIMELINE.md]

## Status
- [ ] Fase 1: Descubrimiento
- [ ] Fase 2: Planificación
- [ ] Fase 3: Ejecución
- [ ] Fase 4: Optimización

## Documentación
- Audit: reportes/AUDIT.md
- Propuesta: reportes/PROPOSAL.md
- Reportes: reportes/

---
**Estado:** En Progreso
**Próxima Revisión:** [Fecha]
""".format(nombre=nombre, cliente=cliente, fecha=datetime.date.today().isoformat())

            proyecto_file.write_text(template)
            self.print_success(f"Proyecto '{nombre}' creado para '{cliente}'")
            print(f"📁 Ubicación: {proyecto_path}")
        else:
            self.print_error(f"Proyecto '{nombre}' ya existe")

    def cmd_listar_proyectos(self):
        """Listar todos los proyectos"""
        self.print_header("Proyectos Activos")

        if not self.proyectos_path.exists():
            self.print_info("No hay proyectos")
            return

        proyectos = [d.name for d in self.proyectos_path.iterdir() if d.is_dir()]

        if not proyectos:
            self.print_info("No hay proyectos")
            return

        for i, proyecto in enumerate(proyectos, 1):
            print(f"{i}. {proyecto}")

    def cmd_ejecutar_auditoria(self, url: str, cliente: str):
        """Ejecutar auditoría de marketing para cliente"""
        self.print_header(f"Auditoría de Marketing")
        print(f"URL: {url}")
        print(f"Cliente: {cliente}")

        timestamp = datetime.datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        reporte_file = self.reportes_path / f"{cliente}_AUDIT_{timestamp}.md"

        print(f"\n📋 Para ejecutar la auditoría completa:")
        print(f"   /market audit {url}")
        print(f"\n💾 Guardar reporte como:")
        print(f"   {reporte_file}")
        self.print_info("Reporte se guardará automáticamente")

    def cmd_status_dashboard(self):
        """Mostrar dashboard de status"""
        self.print_header("Through Air - Dashboard de Status")

        # Contar clientes
        clientes = 0
        if self.clientes_path.exists():
            clientes = len([d for d in self.clientes_path.iterdir() if d.is_dir()])

        # Contar proyectos
        proyectos = 0
        if self.proyectos_path.exists():
            proyectos = len([d for d in self.proyectos_path.iterdir() if d.is_dir()])

        # Contar reportes
        reportes = 0
        if self.reportes_path.exists():
            reportes = len([f for f in self.reportes_path.iterdir() if f.is_file()])

        print(f"👥 Clientes: {clientes}")
        print(f"📊 Proyectos Activos: {proyectos}")
        print(f"📄 Reportes Generados: {reportes}")
        print(f"\n📁 Sistema de Archivos")
        print(f"   Base: {self.base_path}")
        print(f"   Clientes: {self.clientes_path}")
        print(f"   Proyectos: {self.proyectos_path}")
        print(f"   Reportes: {self.reportes_path}")
        print(f"   Templates: {self.templates_path}")

    def cmd_help(self):
        """Mostrar ayuda"""
        self.print_header("Through Air Marketing Agency - CLI Help")

        help_text = """
COMANDOS DISPONIBLES:

📋 GESTIÓN DE CLIENTES
  nuevo-cliente <nombre>           Crear nuevo cliente
  listar-clientes                  Listar todos los clientes

📊 GESTIÓN DE PROYECTOS
  nuevo-proyecto <nombre> <cliente>  Crear nuevo proyecto
  listar-proyectos                 Listar todos los proyectos

🔍 AUDITORÍAS & ANÁLISIS
  auditoria <url> <cliente>        Ejecutar auditoría de marketing

📈 DASHBOARD
  status                           Ver dashboard de status

❓ AYUDA
  help                             Mostrar esta ayuda

SKILLS DISPONIBLES GLOBALMENTE:
  /market audit [url]              Auditoría completa
  /market quick [url]              Análisis rápido (60s)
  /market copy [url]               Copy optimizado
  /market emails [tema]            Secuencias de email
  /market social [tema]            Calendario social
  /market ads [url]                Creativos para ads
  /market funnel [url]             Análisis de funnel
  /market competitors [url]        Inteligencia competitiva
  /market landing [url]            CRO landing page
  /market seo [url]                Auditoría SEO
  /market brand [url]              Voz de marca
  /market launch [producto]        Playbook de lanzamiento
  /market proposal [cliente]       Propuesta de cliente
  /market report [url]             Reporte Markdown
  /market report-pdf [url]         Reporte PDF

EJEMPLOS:
  python through-air-cli.py nuevo-cliente "Acme Corp"
  python through-air-cli.py nuevo-proyecto "Website Redesign" "Acme Corp"
  python through-air-cli.py auditoria https://acme.com "Acme Corp"
  python through-air-cli.py status
        """
        print(help_text)

    def run(self, args: List[str]):
        """Ejecutar CLI"""
        if not args or args[0] == "help":
            self.cmd_help()
            return

        cmd = args[0]

        if cmd == "nuevo-cliente" and len(args) >= 2:
            self.cmd_nuevo_cliente(args[1])
        elif cmd == "listar-clientes":
            self.cmd_listar_clientes()
        elif cmd == "nuevo-proyecto" and len(args) >= 3:
            self.cmd_nuevo_proyecto(args[1], args[2])
        elif cmd == "listar-proyectos":
            self.cmd_listar_proyectos()
        elif cmd == "auditoria" and len(args) >= 3:
            self.cmd_ejecutar_auditoria(args[1], args[2])
        elif cmd == "status":
            self.cmd_status_dashboard()
        else:
            self.print_error(f"Comando no reconocido: {cmd}")
            print("Usa 'help' para ver comandos disponibles")


if __name__ == "__main__":
    cli = ThroughAirCLI()
    cli.run(sys.argv[1:])
