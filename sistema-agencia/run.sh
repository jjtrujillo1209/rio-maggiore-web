#!/bin/bash

# Through Air Marketing Agency - Quick Start Script

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Mostrar menú si no hay argumentos
if [ $# -eq 0 ]; then
    echo ""
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║   Through Air Marketing Agency - Sistema de Agencia   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "COMANDOS RÁPIDOS:"
    echo ""
    echo "  ./run.sh nuevo-cliente <nombre>"
    echo "  ./run.sh listar-clientes"
    echo "  ./run.sh nuevo-proyecto <nombre> <cliente>"
    echo "  ./run.sh listar-proyectos"
    echo "  ./run.sh auditoria <url> <cliente>"
    echo "  ./run.sh status"
    echo "  ./run.sh help"
    echo ""
    echo "EJEMPLOS:"
    echo "  ./run.sh nuevo-cliente 'Acme Corp'"
    echo "  ./run.sh nuevo-proyecto 'Redesign' 'Acme Corp'"
    echo "  ./run.sh auditoria https://acme.com 'Acme Corp'"
    echo ""
    exit 0
fi

# Ejecutar comando
python3 through-air-cli.py "$@"
