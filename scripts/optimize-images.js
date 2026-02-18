/**
 * Build-time image optimization script
 * Compresses JPG/PNG images in public/images/ using sharp
 * Run as part of the build process: node scripts/optimize-images.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const IMAGES_DIR = path.join(__dirname, '..', 'public', 'images');
const MAX_WIDTH = 1920; // Max width for any image
const QUALITY_JPG = 80;
const QUALITY_PNG = 80;

// Track stats
let totalOriginal = 0;
let totalOptimized = 0;
let filesProcessed = 0;

async function optimizeImage(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

    try {
        const originalSize = fs.statSync(filePath).size;

        // Skip tiny files (< 10KB) - not worth optimizing
        if (originalSize < 10240) return;

        const image = sharp(filePath);
        const metadata = await image.metadata();

        // Build pipeline
        let pipeline = sharp(filePath);

        // Resize if wider than MAX_WIDTH
        if (metadata.width && metadata.width > MAX_WIDTH) {
            pipeline = pipeline.resize(MAX_WIDTH, null, {
                withoutEnlargement: true,
                fit: 'inside',
            });
        }

        // Compress based on format
        if (ext === '.png') {
            pipeline = pipeline.png({ quality: QUALITY_PNG, compressionLevel: 9 });
        } else {
            pipeline = pipeline.jpeg({ quality: QUALITY_JPG, mozjpeg: true });
        }

        // Write to buffer, then back to file
        const buffer = await pipeline.toBuffer();

        // Only write if the optimized version is smaller
        if (buffer.length < originalSize) {
            fs.writeFileSync(filePath, buffer);
            totalOriginal += originalSize;
            totalOptimized += buffer.length;
            filesProcessed++;
            const savings = ((1 - buffer.length / originalSize) * 100).toFixed(1);
            console.log(`  ✓ ${path.relative(IMAGES_DIR, filePath)}: ${formatBytes(originalSize)} → ${formatBytes(buffer.length)} (-${savings}%)`);
        } else {
            console.log(`  ○ ${path.relative(IMAGES_DIR, filePath)}: already optimal (${formatBytes(originalSize)})`);
        }
    } catch (err) {
        console.error(`  ✗ ${path.relative(IMAGES_DIR, filePath)}: ${err.message}`);
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return bytes + 'B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + 'KB';
    return (bytes / (1024 * 1024)).toFixed(1) + 'MB';
}

async function walkDir(dir) {
    const files = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await walkDir(fullPath)));
        } else {
            files.push(fullPath);
        }
    }
    return files;
}

async function main() {
    console.log('🖼️  Optimizing images in public/images/...\n');

    if (!fs.existsSync(IMAGES_DIR)) {
        console.log('No images directory found, skipping.');
        return;
    }

    const files = await walkDir(IMAGES_DIR);
    const imageFiles = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));

    console.log(`Found ${imageFiles.length} images to process:\n`);

    for (const file of imageFiles) {
        await optimizeImage(file);
    }

    if (filesProcessed > 0) {
        const totalSavings = ((1 - totalOptimized / totalOriginal) * 100).toFixed(1);
        console.log(`\n✅ Done! ${filesProcessed} files optimized.`);
        console.log(`   Total: ${formatBytes(totalOriginal)} → ${formatBytes(totalOptimized)} (-${totalSavings}%)`);
    } else {
        console.log('\n✅ All images are already optimized.');
    }
}

main().catch(console.error);
