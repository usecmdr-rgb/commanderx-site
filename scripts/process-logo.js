const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const inputFile = path.join(__dirname, '../public/ovrsee_stacked_transparent.png');
const outputDir = path.join(__dirname, '../public/assets/logos/ovrsee');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function processLogo() {
  try {
    // Read the transparent logo
    const image = sharp(inputFile);
    const metadata = await image.metadata();
    
    // Create dark/black version (brightness(0)) for light mode
    await image
      .clone()
      .modulate({
        brightness: 0, // Makes it black
        saturation: 0  // Remove color
      })
      .toFile(path.join(outputDir, 'ovrsee-logo-new-dark.png'));
    
    console.log('✓ Created dark version (ovrsee-logo-new-dark.png)');
    
    // Create white version (brightness(0) invert(1)) for dark mode
    await image
      .clone()
      .modulate({
        brightness: 0, // Makes it black first
        saturation: 0  // Remove color
      })
      .negate() // Invert to white
      .toFile(path.join(outputDir, 'ovrsee-logo-new-white.png'));
    
    console.log('✓ Created white version (ovrsee-logo-new-white.png)');
    
    console.log('\nAll logo files created successfully!');
  } catch (error) {
    console.error('Error processing logo:', error);
    process.exit(1);
  }
}

processLogo();

