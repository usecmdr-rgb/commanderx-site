const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, '../public/ovrsee_stacked_transparent.png');
const outputDir = path.join(__dirname, '../public/assets/logos/ovrsee');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function exportPrimaryLogo() {
  try {
    // Read the transparent logo
    const image = sharp(inputFile);
    const metadata = await image.metadata();
    
    // Calculate aspect ratio
    const aspectRatio = metadata.width / metadata.height;
    
    console.log(`Original dimensions: ${metadata.width}x${metadata.height}`);
    console.log(`Aspect ratio: ${aspectRatio.toFixed(2)}:1\n`);
    
    // 1. ovrsee-logo-primary.png — 3000px wide
    const primaryWidth = 3000;
    const primaryHeight = Math.round(primaryWidth / aspectRatio);
    
    await image
      .clone()
      .resize(primaryWidth, primaryHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(outputDir, 'ovrsee-logo-primary.png'));
    
    console.log(`✓ Created ovrsee-logo-primary.png (${primaryWidth}x${primaryHeight})`);
    
    // 2. ovrsee-logo-primary-transparent.png — transparent background (same as primary but explicitly transparent)
    await image
      .clone()
      .resize(primaryWidth, primaryHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(outputDir, 'ovrsee-logo-primary-transparent.png'));
    
    console.log(`✓ Created ovrsee-logo-primary-transparent.png (${primaryWidth}x${primaryHeight})`);
    
    // 3. ovrsee-logo-black.png — solid black version
    await image
      .clone()
      .resize(primaryWidth, primaryHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .modulate({
        brightness: 0, // Makes it black
        saturation: 0  // Remove color
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(outputDir, 'ovrsee-logo-black.png'));
    
    console.log(`✓ Created ovrsee-logo-black.png (${primaryWidth}x${primaryHeight})`);
    
    // 4. ovrsee-logo-white.png — white version
    await image
      .clone()
      .resize(primaryWidth, primaryHeight, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .modulate({
        brightness: 0, // Makes it black first
        saturation: 0  // Remove color
      })
      .negate() // Invert to white
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(outputDir, 'ovrsee-logo-white.png'));
    
    console.log(`✓ Created ovrsee-logo-white.png (${primaryWidth}x${primaryHeight})`);
    
    // 5. ovrsee-logo-square.png — 1:1 social icon (use the larger dimension for square)
    const squareSize = Math.max(primaryWidth, primaryHeight);
    
    await image
      .clone()
      .resize(squareSize, squareSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ quality: 100, compressionLevel: 9 })
      .toFile(path.join(outputDir, 'ovrsee-logo-square.png'));
    
    console.log(`✓ Created ovrsee-logo-square.png (${squareSize}x${squareSize})`);
    
    // 6. ovrsee-logo-primary.svg — scalable (copy the existing SVG or create from PNG)
    // Check if we have an SVG source
    const svgSource = path.join(__dirname, '../public/ovrsee_stacked_logo.svg');
    if (fs.existsSync(svgSource)) {
      // Copy the SVG file
      fs.copyFileSync(svgSource, path.join(outputDir, 'ovrsee-logo-primary.svg'));
      console.log('✓ Created ovrsee-logo-primary.svg (from source)');
    } else {
      // If no SVG source, we can't create a true SVG, but we'll note it
      console.log('⚠ SVG source not found, skipping ovrsee-logo-primary.svg');
    }
    
    console.log('\n✅ All primary logo files exported successfully!');
  } catch (error) {
    console.error('Error exporting logo:', error);
    process.exit(1);
  }
}

exportPrimaryLogo();

