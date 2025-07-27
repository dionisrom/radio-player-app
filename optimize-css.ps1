# PowerShell script to optimize CSS

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Green
npm install

# Build optimized CSS
Write-Host "Building optimized CSS..." -ForegroundColor Green
npm run build:css

Write-Host "CSS optimization complete!" -ForegroundColor Green
Write-Host "To watch for changes during development, run: npm run watch:css" -ForegroundColor Cyan
