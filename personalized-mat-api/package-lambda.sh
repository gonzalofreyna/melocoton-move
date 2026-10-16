#!/usr/bin/env bash
set -euo pipefail

# Empaqueta SOLO la API independiente. No crea ni modifica Lambdas.
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

if ! command -v zip >/dev/null || ! command -v npm >/dev/null; then
  echo "Se requieren npm y zip." >&2
  exit 1
fi

npm install --omit=dev --no-audit --no-fund
mkdir -p dist
rm -f dist/personalized-mat-api.zip
zip -q -r dist/personalized-mat-api.zip src node_modules package.json \
  -x 'src/*.test.mjs' 'node_modules/.cache/*'

echo "Paquete generado en: personalized-mat-api/dist/personalized-mat-api.zip"
echo "El paquete NO se ha desplegado en AWS."
