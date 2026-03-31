#!/bin/bash
# =============================================================
# SEED: Métodos de Pago via API (POST /metodos-pago)
# Cada inserción dispara automáticamente la sincronización
# con la base de datos vectorial.
# Titular: Daniela Agatón o TRAVEL TOURS FLO.
# =============================================================

BASE_URL="http://localhost:3001/v1/metodos-pago"

echo "🏦 Insertando Bancolombia - Cuenta de Ahorros..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "Bancolombia",
    "tipo_pago": "Transferencia Bancaria",
    "tipo_cuenta": "Cuenta de Ahorros",
    "numero_metodo": "84786904446",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🏦 Insertando Bancolombia - Llave Bancolombia..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "Bancolombia",
    "tipo_pago": "Transferencia Bancaria",
    "tipo_cuenta": "Llave Bancolombia",
    "numero_metodo": "@agaton501",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🏠 Insertando Davivienda - Cuenta de Ahorros..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "Davivienda",
    "tipo_pago": "Transferencia Bancaria",
    "tipo_cuenta": "Cuenta de Ahorros",
    "numero_metodo": "488436670902",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🏠 Insertando Davivienda - Llave Davivienda..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "Davivienda",
    "tipo_pago": "Transferencia Bancaria",
    "tipo_cuenta": "Llave Davivienda",
    "numero_metodo": "@Davi3142266528",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🟣 Insertando NU - Cuenta de Ahorros..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "NU",
    "tipo_pago": "Billetera Digital",
    "tipo_cuenta": "Cuenta de Ahorros",
    "numero_metodo": "28568976",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🟣 Insertando NU - Placa NU..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "NU",
    "tipo_pago": "Billetera Digital",
    "tipo_cuenta": "Placa NU",
    "numero_metodo": "AGA501",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "🟣 Insertando NU - Llave NU..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "NU",
    "tipo_pago": "Billetera Digital",
    "tipo_cuenta": "Llave NU",
    "numero_metodo": "@AGA501",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "⚡ Insertando Bold..."
curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_metodo": "Bold",
    "tipo_pago": "Datáfono / Bold",
    "tipo_cuenta": "Cuenta de Ahorros Bancolombia",
    "numero_metodo": "84786904446",
    "titular_cuenta": "Daniela Agatón o TRAVEL TOURS FLO."
  }' | jq .

echo ""
echo "✅ Seed completado. La BD vectorial se sincronizó automáticamente con cada inserción."
