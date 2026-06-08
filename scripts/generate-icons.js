/**
 * Script para gerar ícones PNG do PWA
 * Execute: node scripts/generate-icons.js
 */

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <!-- Outer background -->
  <rect width="512" height="512" rx="102" fill="#10b981"/>

  <!-- Card body -->
  <rect x="77" y="128" width="358" height="247" rx="30" fill="#ecfdf5"/>
  <!-- Card header strip -->
  <rect x="77" y="128" width="358" height="77" rx="30" fill="#d1fae5"/>
  <!-- Card top accent -->
  <rect x="77" y="128" width="358" height="34" rx="17" fill="#a7f3d0"/>

  <!-- Chip -->
  <rect x="316" y="222" width="153" height="102" rx="26" fill="#10b981" stroke="#ecfdf5" stroke-width="6"/>
  <!-- Chip circle -->
  <circle cx="392" cy="273" r="21" fill="#ecfdf5"/>

  <!-- Card lines -->
  <rect x="111" y="307" width="119" height="17" rx="8" fill="#6ee7b7"/>
  <rect x="111" y="341" width="77" height="17" rx="8" fill="#a7f3d0"/>
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
