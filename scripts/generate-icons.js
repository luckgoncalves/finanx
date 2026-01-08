/**
 * Script para gerar ícones PNG do PWA
 * Execute: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#10b981"/>
      <stop offset="100%" style="stop-color:#059669"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="96" fill="url(#bg)"/>
  <text x="256" y="340" font-family="system-ui, -apple-system, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">F</text>
</svg>`;

async function generateIcons() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  
  // Ensure directory exists
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    
    await sharp(Buffer.from(svgContent))
      .resize(size, size)
      .png()
      .toFile(outputPath);
    
    console.log(`✓ Gerado: icon-${size}x${size}.png`);
  }

  // Generate favicon
  const faviconPath = path.join(__dirname, '..', 'src', 'app', 'favicon.ico');
  await sharp(Buffer.from(svgContent))
    .resize(32, 32)
    .toFile(faviconPath.replace('.ico', '.png'));
  console.log('✓ Gerado: favicon');

  console.log('\n✅ Todos os ícones foram gerados com sucesso!');
}

generateIcons().catch(console.error);
