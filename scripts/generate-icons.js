#!/usr/bin/env node
// Generates SVG-based app icons for SHAHED PWA
// Run: node scripts/generate-icons.js

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 384, 512];

// Generate SVG icon
function generateSVG(size) {
  const fontSize = size * 0.38;
  const arabicFontSize = size * 0.3;
  
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="65%">
      <stop offset="0%" stop-color="#e8d5bb"/>
      <stop offset="100%" stop-color="#c4956a"/>
    </radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#fdfaf6" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="#fdfaf6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <!-- Background -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#bg)"/>
  <!-- Inner glow -->
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="url(#glow)"/>
  <!-- Decorative ring -->
  <circle cx="${size/2}" cy="${size/2}" r="${size * 0.38}" fill="none" stroke="#fdfaf6" stroke-opacity="0.2" stroke-width="${size * 0.012}"/>
  <!-- Arabic text شهد -->
  <text 
    x="${size/2}" 
    y="${size * 0.62}" 
    text-anchor="middle" 
    font-family="'Amiri', 'Arabic Typesetting', serif" 
    font-size="${arabicFontSize}" 
    font-weight="700"
    fill="#fdfaf6"
    letter-spacing="2"
  >شهد</text>
  <!-- Decorative dots -->
  <circle cx="${size * 0.35}" cy="${size * 0.75}" r="${size * 0.015}" fill="#fdfaf6" fill-opacity="0.5"/>
  <circle cx="${size * 0.5}" cy="${size * 0.77}" r="${size * 0.012}" fill="#fdfaf6" fill-opacity="0.4"/>
  <circle cx="${size * 0.65}" cy="${size * 0.75}" r="${size * 0.015}" fill="#fdfaf6" fill-opacity="0.5"/>
</svg>`;
}

// Write SVG icons
const iconsDir = path.join(__dirname, '../public/icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Write SVG versions (these work directly for web)
sizes.forEach(size => {
  const svg = generateSVG(size);
  const filename = size === 180 ? 'apple-touch-icon.svg' : `icon-${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
});

// Also write the main SVG icon
fs.writeFileSync(path.join(iconsDir, 'icon.svg'), generateSVG(512));

// Write a placeholder PNG notice
const notice = `Icons generated as SVG. For production PNG icons:
1. Open each SVG in a browser or design tool
2. Export as PNG at the specified size
3. Replace the .svg files with .png files
4. Update manifest.json icon type to image/png

OR use a tool like:
  npx svg2png-cli --input ./public/icons/icon.svg --output ./public/icons/icon-512.png --width 512 --height 512

SVG icons work on most modern browsers.
For Apple/iPhone, the apple-touch-icon should ideally be PNG.`;

fs.writeFileSync(path.join(iconsDir, 'README.txt'), notice);

console.log('✓ SVG icons generated in public/icons/');
console.log('  Sizes:', sizes.join(', '));
console.log('  Note: For best iOS support, convert SVGs to PNGs');
