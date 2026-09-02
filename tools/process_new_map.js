const fs = require('fs');
const jpeg = require('jpeg-js');
const path = require('path');

const inputPath = 'd:/ppt/assets/single_complete_route.jpg';
const rawData = fs.readFileSync(inputPath);
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

console.log(`Processing Map Image: ${width} x ${height}`);

// Detect orange / red route line pixels
const isOrange = (r, g, b) => {
    // Orange route lines: high R, moderate G, low B, R > G + 25, G > B + 15
    return (r > 165 && g > 55 && g < 180 && b < 85 && (r - g) > 25 && (g - b) > 15);
};

// Also detect the orange arrows on the interchange (yellow-orange / bright orange)
const isArrowOrange = (r, g, b) => {
    return (r > 180 && g > 70 && b < 100 && (r - g) > 20 && (g - b) > 20);
};

const orangePixels = [];
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx], g = data[idx + 1], b = data[idx + 2];
        if (isOrange(r, g, b) || isArrowOrange(r, g, b)) {
            orangePixels.push({ x, y, r, g, b });
        }
    }
}
console.log(`Found ${orangePixels.length} orange route pixels.`);

// Let's create the clean inpainted map image
const cleanData = new Uint8Array(data);
const mask = new Uint8Array(width * height);

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = cleanData[idx], g = cleanData[idx + 1], b = cleanData[idx + 2];
        if (isOrange(r, g, b) || isArrowOrange(r, g, b)) {
            mask[y * width + x] = 1;
        }
    }
}

// Dilate the mask by 3px radius so all fringes are covered
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

// Inpaint using surrounding satellite imagery pixels
for (let pass = 0; pass < 4; pass++) {
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const pIdx = y * width + x;
            if (dilatedMask[pIdx]) {
                let rSum = 0, gSum = 0, bSum = 0, count = 0;
                for (let d = 1; d <= 8; d++) {
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
                    if (count >= 5) break;
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

const cleanOut = 'd:/ppt/assets/clean_single_complete_route.jpg';
const encoded = jpeg.encode({ data: cleanData, width, height }, 95);
fs.writeFileSync(cleanOut, encoded.data);
console.log(`Saved clean base map to: ${cleanOut}`);
