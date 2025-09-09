# Script para deploy no Vercel
Write-Host "Iniciando deploy no Vercel..."

# Verificar se o Vercel CLI está instalado
Write-Host "Verificando Vercel CLI..."
npx vercel --version

# Fazer o deploy
Write-Host "Fazendo deploy..."
npx vercel --prod --yes

Write-Host "Deploy concluído!"
