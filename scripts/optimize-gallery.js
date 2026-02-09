const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

const DEFAULT_GALLERY_DIR = path.join(__dirname, '../public/images/gallery');
const MAX_WIDTH = 1920; // Max width for gallery images
const QUALITY = 85; // JPEG quality (85 is good balance)

/**
 * Convert HEIF/HEIC to JPEG using macOS sips command
 */
async function convertHeifToJpeg(inputPath, outputPath) {
  try {
    const { stdout, stderr } = await execAsync(`sips -s format jpeg "${inputPath}" --out "${outputPath}"`);
    if (stderr && !stderr.includes('Warning')) {
      console.warn('  ⚠️  sips warning:', stderr);
    }
    return true;
  } catch (error) {
    console.error('  ❌ Failed to convert HEIF/HEIC:', error.message);
    return false;
  }
}

async function optimizeImages(customPath = null) {
  console.log('🖼️  Starting image optimization...\n');

  try {
    let targetDir;
    let imageFiles;
    let isCustomPath = false;

    if (customPath) {
      // Resolve to absolute path
      const resolvedPath = path.isAbsolute(customPath)
        ? customPath
        : path.resolve(process.cwd(), customPath);

      // Check if path exists
      let stats;
      try {
        stats = await fs.stat(resolvedPath);
      } catch (error) {
        console.error(`❌ Error: Path "${customPath}" not found\n`);
        process.exit(1);
      }

      if (stats.isDirectory()) {
        // Directory mode - process all images in directory
        targetDir = resolvedPath;
        isCustomPath = true;
        console.log(`📁 Processing directory: ${targetDir}\n`);

        const files = await fs.readdir(targetDir);
        imageFiles = files.filter(file => {
          const ext = path.extname(file).toLowerCase();
          return ['.jpg', '.jpeg', '.png', '.heic', '.heif'].includes(ext);
        });

        if (imageFiles.length === 0) {
          console.log('⚠️  No images found in directory\n');
          process.exit(0);
        }

        console.log(`Found ${imageFiles.length} images to optimize\n`);
      } else if (stats.isFile()) {
        // Single file mode
        const ext = path.extname(resolvedPath).toLowerCase();
        if (!['.jpg', '.jpeg', '.png', '.heic', '.heif'].includes(ext)) {
          console.error(`❌ Error: "${customPath}" is not a supported image format`);
          console.log('Supported formats: .jpg, .jpeg, .png, .heic, .heif\n');
          process.exit(1);
        }

        targetDir = path.dirname(resolvedPath);
        imageFiles = [path.basename(resolvedPath)];
        isCustomPath = true;
        console.log(`📄 Optimizing single file: ${resolvedPath}\n`);
      }
    } else {
      // Default mode - use gallery directory
      targetDir = DEFAULT_GALLERY_DIR;
      console.log(`📁 Processing default gallery directory: ${targetDir}\n`);

      const files = await fs.readdir(targetDir);
      imageFiles = files.filter(file => {
        const ext = path.extname(file).toLowerCase();
        return ['.jpg', '.jpeg', '.png', '.heic', '.heif'].includes(ext);
      });

      console.log(`Found ${imageFiles.length} images to optimize\n`);
    }

    let totalSavings = 0;
    const results = [];

    for (const file of imageFiles) {
      const inputPath = path.join(targetDir, file);

      try {
        // Get original file size
        const originalStats = await fs.stat(inputPath);
        const originalSize = originalStats.size;

        // Create output filename (convert to .jpg)
        const baseName = path.parse(file).name;
        const outputFile = `${baseName}.jpg`;
        const outputPath = path.join(targetDir, outputFile);
        const tempPath = path.join(targetDir, `${baseName}.tmp.jpg`);

        // Process image
        console.log(`Processing: ${file}...`);

        // Check if file is HEIF/HEIC - needs conversion first
        const ext = path.extname(file).toLowerCase();
        let actualInputPath = inputPath;

        if (['.heic', '.heif'].includes(ext)) {
          console.log('  🔄 Converting HEIF/HEIC to JPEG...');
          const convertedPath = path.join(targetDir, `${baseName}.converted.jpg`);

          const converted = await convertHeifToJpeg(inputPath, convertedPath);
          if (!converted) {
            console.error(`  ❌ Skipping ${file} - conversion failed\n`);
            continue;
          }

          actualInputPath = convertedPath;
          console.log('  ✅ Conversion successful');
        }

        const image = sharp(actualInputPath);
        const metadata = await image.metadata();

        // Resize if wider than MAX_WIDTH
        let processedImage = image;
        if (metadata.width > MAX_WIDTH) {
          processedImage = processedImage.resize(MAX_WIDTH, null, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        // Convert to JPEG with optimization
        await processedImage
          .jpeg({
            quality: QUALITY,
            progressive: true,
            mozjpeg: true
          })
          .toFile(tempPath);

        // Get optimized file size
        const optimizedStats = await fs.stat(tempPath);
        const optimizedSize = optimizedStats.size;
        const savings = originalSize - optimizedSize;
        const savingsPercent = ((savings / originalSize) * 100).toFixed(1);

        totalSavings += savings;

        // Move temp file to final output
        await fs.rename(tempPath, outputPath);

        // Clean up: Delete original if it's HEIC/HEIF
        if (['.heic', '.heif'].includes(ext)) {
          await fs.unlink(inputPath);
          console.log(`  ✅ Converted ${file} → ${outputFile}`);
        }

        // Clean up: Delete converted intermediate file if it exists
        if (actualInputPath !== inputPath) {
          try {
            await fs.unlink(actualInputPath);
          } catch (err) {
            // Ignore if file doesn't exist
          }
        }

        results.push({
          file: outputFile,
          originalSize,
          optimizedSize,
          savings,
          savingsPercent,
          dimensions: `${metadata.width}x${metadata.height}`
        });

        console.log(`  ✅ ${formatBytes(originalSize)} → ${formatBytes(optimizedSize)} (saved ${savingsPercent}%)\n`);

      } catch (error) {
        console.error(`  ❌ Error processing ${file}:`, error.message, '\n');
      }
    }

    // Print summary
    console.log('\n📊 Optimization Summary\n');
    console.log('─'.repeat(70));

    results.forEach(result => {
      console.log(`${result.file.padEnd(50)} ${formatBytes(result.savings).padStart(10)} saved`);
    });

    console.log('─'.repeat(70));
    console.log(`\n✅ Total space saved: ${formatBytes(totalSavings)}`);
    console.log(`📁 Optimized ${results.length} ${results.length === 1 ? 'image' : 'images'} in ${targetDir}\n`);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

// Parse command-line arguments
const targetPath = process.argv[2]; // Optional: file or directory path

// Show usage info
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
📖 Image Optimizer

Usage:
  node scripts/optimize-gallery.js [path]

Arguments:
  [path]  Optional. Can be:
          • Nothing - optimizes all images in default gallery directory
          • A filename - optimizes that file in the gallery directory
          • An absolute path - optimizes file or directory at that path
          • A relative path - optimizes file or directory relative to project root

Examples:
  node scripts/optimize-gallery.js
    → Optimize all images in public/images/gallery/

  node scripts/optimize-gallery.js gallery-5.jpg
    → Optimize gallery-5.jpg in public/images/gallery/

  node scripts/optimize-gallery.js public/images/contact
    → Optimize all images in public/images/contact/ directory

  node scripts/optimize-gallery.js public/images/contact/contact-image.jpg
    → Optimize specific file at that path

  node scripts/optimize-gallery.js /Users/you/Desktop/photos
    → Optimize all images in absolute path directory

  node scripts/optimize-gallery.js ~/Downloads/photo.heic
    → Optimize specific file with home directory shortcut

Settings:
  • Max width: ${MAX_WIDTH}px
  • Quality: ${QUALITY}%
  • Output: Progressive JPEG
  • Supported formats: .jpg, .jpeg, .png, .heic, .heif
  `);
  process.exit(0);
}

// Run optimization
optimizeImages(targetPath);
