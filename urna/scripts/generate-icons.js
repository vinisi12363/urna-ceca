// Simple icon generator using canvas API in Node
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SVG template for icons
const createSVGIcon = (size) => `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#1f2937" rx="${size * 0.15}"/>
  <g transform="translate(${size/2}, ${size/2})">
    <rect x="${-size*0.3}" y="${-size*0.35}" width="${size*0.6}" height="${size*0.5}" fill="white" rx="${size*0.05}"/>
    <rect x="${-size*0.25}" y="${-size*0.25}" width="${size*0.5}" height="${size*0.3}" fill="#e5e7eb" rx="${size*0.02}"/>
    <circle cx="${-size*0.15}" cy="${-size*0.1}" r="${size*0.03}" fill="#1f2937"/>
    <circle cx="${-size*0.05}" cy="${-size*0.1}" r="${size*0.03}" fill="#1f2937"/>
    <circle cx="${size*0.05}" cy="${-size*0.1}" r="${size*0.03}" fill="#1f2937"/>
    <rect x="${-size*0.25}" y="${size*0.1}" width="${size*0.14}" height="${size*0.08}" fill="#cd3333" rx="${size*0.01}"/>
    <rect x="${-size*0.08}" y="${size*0.1}" width="${size*0.14}" height="${size*0.08}" fill="white" rx="${size*0.01}"/>
    <rect x="${size*0.09}" y="${size*0.1}" width="${size*0.14}" height="${size*0.08}" fill="#32a852" rx="${size*0.01}"/>
  </g>
</svg>`;

const sizes = [192, 512];
const iconsDir = join(__dirname, '..', 'public', 'icons');

try {
  mkdirSync(iconsDir, { recursive: true });

  sizes.forEach(size => {
    const svg = createSVGIcon(size);
    const filename = join(iconsDir, `icon-${size}x${size}.svg`);
    writeFileSync(filename, svg);
    console.log(`✓ Created ${filename}`);
  });

  console.log('\n✅ Icons generated successfully!');
  console.log('⚠️  Note: SVG icons are being used. For PNG icons, you can:');
  console.log('   1. Use an online tool like https://cloudconvert.com/svg-to-png');
  console.log('   2. Or install sharp/imagemagick locally to convert them');

} catch (error) {
  console.error('Error generating icons:', error);
  process.exit(1);
}
