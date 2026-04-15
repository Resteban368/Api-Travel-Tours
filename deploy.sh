#!/bin/bash
set -e

IMAGE="banestecodes/api-travel-tours:latest"
DEPLOY_URL="http://2.24.199.19:3000/api/deploy/8e2842d49b94f52b96f9619d3bc4dc35e9a75abffaaf9d93"

echo "🔨 Construyendo imagen para linux/amd64..."
docker buildx build --platform linux/amd64 -t $IMAGE --push .

echo "🚀 Desplegando en EasyPanel..."
curl -s "$DEPLOY_URL"

echo ""
echo "✅ Deploy completado — https://api-travel-api.rvbxuq.easypanel.host"
