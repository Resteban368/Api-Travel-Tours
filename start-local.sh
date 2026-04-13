#!/bin/bash

# Kill existing processes
echo "🛑 Deteniendo procesos anteriores..."
pkill -f "node dist/src/main" 2>/dev/null
pkill -f ngrok 2>/dev/null
sleep 2

# Build
echo "🔨 Compilando..."
npm run build

# Start app
echo "🚀 Iniciando app en puerto 3001..."
npm run start:prod > /tmp/api.log 2>&1 &
sleep 4

# Start ngrok
echo "🌐 Iniciando ngrok..."
ngrok http 3001 > /tmp/ngrok.log 2>&1 &
sleep 5

# Get URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -oE '"public_url":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$NGROK_URL" ]; then
  echo "❌ No se pudo obtener URL de ngrok"
  exit 1
fi

echo ""
echo "✅ API corriendo en:"
echo "   📍 Local: http://localhost:3001"
echo "   🌐 ngrok: $NGROK_URL"
echo ""
echo "Prueba:"
echo "   curl -X POST '$NGROK_URL/v1/auth/login' \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"email\":\"admin@agente.com\",\"password\":\"Admin2026!\"}'"
