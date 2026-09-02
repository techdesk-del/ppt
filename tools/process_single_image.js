const fs = require('fs');
const jpeg = require('jpeg-js');
const path = require('path');

const inputPath = path.join(__dirname, 'assets/single_complete_route.jpg');
const rawData = fs.readFileSync(inputPath);
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

console.log(`Image Dimensions: ${width} x ${height}`);

const isOrange = (r, g, b) => {
    return (r > 175 && g > 60 && g < 170 && b < 70 && (r - g) > 35 && (g - b) > 25);
};

const orangePixels = [];
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (isOrange(data[idx], data[idx+1], data[idx+2])) {
            orangePixels.push({ x, y });
        }
    }
}
console.log(`Found ${orangePixels.length} orange pixels in single_complete_route.jpg`);

// 1. Trace the Upper Route (from Highway on left at x~250, y~330 -> through plotted road -> blue pin at x~435, y~380 -> and north towards Mathurawala)
// 2. Trace the Lower Route (from blue pin at x~435, y~380 -> down to Ring Road at y~540 -> and the loop at bottom)

// Let's sample specific sections:
// Upper Highway Start:
const upperStart = orangePixels.filter(p => p.x <= 320 && p.y >= 260 && p.y <= 360).sort((a,b) => a.x - b.x)[0];
console.log('Upper Start (Highway):', upperStart);

// Blue pin location:
const bluePinNear = orangePixels.filter(p => Math.abs(p.x - 435) <= 15 && Math.abs(p.y - 380) <= 20);
console.log('Blue Pin Near sample count:', bluePinNear.length);

// Lower End (Ring Road):
const lowerEnd = orangePixels.filter(p => p.y >= 540).sort((a,b) => b.y - a.y)[0];
console.log('Lower End (Ring Road):', lowerEnd);

// Top North End (Mathurawala):
const topNorthEnd = orangePixels.filter(p => p.y <= 120).sort((a,b) => a.y - b.y)[0];
console.log('Top North End:', topNorthEnd);

// Now generate clean image
const cleanData = new Uint8Array(data);
const mask = new Uint8Array(width * height);
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (isOrange(cleanData[idx], cleanData[idx+1], cleanData[idx+2])) {
            mask[y * width + x] = 1;
        }
    }
}

// Dilate
const dilatedMask = new Uint8Array(width * height);
const radius = 3;
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        if (mask[y * width + x]) {
            for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                        dilatedMask[ny * width + nx] = 1;
                    }
                }
            }
        }
    }
}

// Inpaint
for (let pass = 0; pass < 3; pass++) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pIdx = y * width + x;
            if (dilatedMask[pIdx]) {
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (let d = 1; d <= 7; d++) {
                    const neighbors = [
                        [x - d, y], [x + d, y], [x, y - d], [x, y + d],
                        [x - d, y - d], [x + d, y + d], [x - d, y + d], [x + d, y - d]
                    ];
                    for (const [nx, ny] of neighbors) {
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            const nIdx = ny * width + nx;
                            if (!dilatedMask[nIdx]) {
                                const bIdx = nIdx * 4;
                                rSum += cleanData[bIdx];
                                gSum += cleanData[bIdx + 1];
                                bSum += cleanData[bIdx + 2];
                                count++;
                            }
                        }
                    }
                    if (count >= 4) break;
                }
                if (count > 0) {
                    const idx = pIdx * 4;
                    cleanData[idx] = Math.round(rSum / count);
                    cleanData[idx + 1] = Math.round(gSum / count);
                    cleanData[idx + 2] = Math.round(bSum / count);
                }
            }
        }
    }
}

const cleanOut = path.join(__dirname, 'assets/clean_single_complete_route.jpg');
const encoded = jpeg.encode({ data: cleanData, width, height }, 95);
fs.writeFileSync(cleanOut, encoded.data);
console.log(`Saved clean single image to: ${cleanOut}`);
