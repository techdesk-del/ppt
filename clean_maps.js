const fs = require('fs');
const jpeg = require('jpeg-js');
const path = require('path');

function cleanImage(inputPath, outputPath) {
    const rawData = fs.readFileSync(inputPath);
    const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
    const width = img.width;
    const height = img.height;
    const data = img.data;

    // Detect orange pixels
    const isOrange = (r, g, b) => {
        // Orange line in Google Earth is bright reddish-orange: high R, medium G, low B
        const rVal = r;
        const gVal = g;
        const bVal = b;
        return (rVal > 180 && gVal > 60 && gVal < 165 && bVal < 70 && (rVal - gVal) > 40 && (gVal - bVal) > 30);
    };

    const mask = new Uint8Array(width * height);
    let orangeCount = 0;

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            if (isOrange(r, g, b)) {
                mask[y * width + x] = 1;
                orangeCount++;
            }
        }
    }
    console.log(`Detected ${orangeCount} orange pixels in ${path.basename(inputPath)}`);

    // Dilate mask slightly (radius 3) to cover anti-aliased edges
    const dilatedMask = new Uint8Array(width * height);
    const radius = 3;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            if (mask[y * width + x]) {
                for (let dy = -radius; dy <= radius; dy++) {
                    for (let dx = -radius; dx <= radius; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            dilatedMask[ny * width + nx] = 1;
                        }
                    }
                }
            }
        }
    }

    // Inpaint masked pixels using surrounding non-masked pixels (fast directional interpolation)
    for (let pass = 0; pass < 3; pass++) {
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pIdx = y * width + x;
                if (dilatedMask[pIdx]) {
                    let rSum = 0, gSum = 0, bSum = 0, count = 0;
                    const searchDist = 7;
                    for (let d = 1; d <= searchDist; d++) {
                        const neighbors = [
                            [x - d, y], [x + d, y],
                            [x, y - d], [x, y + d],
                            [x - d, y - d], [x + d, y + d],
                            [x - d, y + d], [x + d, y - d]
                        ];
                        for (const [nx, ny] of neighbors) {
                            if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                                const nIdx = ny * width + nx;
                                if (!dilatedMask[nIdx]) {
                                    const bIdx = nIdx * 4;
                                    rSum += data[bIdx];
                                    gSum += data[bIdx + 1];
                                    bSum += data[bIdx + 2];
                                    count++;
                                }
                            }
                        }
                        if (count >= 4) break;
                    }

                    if (count > 0) {
                        const idx = pIdx * 4;
                        data[idx] = Math.round(rSum / count);
                        data[idx + 1] = Math.round(gSum / count);
                        data[idx + 2] = Math.round(bSum / count);
                    }
                }
            }
        }
    }

    const encoded = jpeg.encode({ data, width, height }, 95);
    fs.writeFileSync(outputPath, encoded.data);
    console.log(`Saved clean image to: ${outputPath}`);
}

const detailedIn = path.join(__dirname, 'assets/detailed_route.jpg');
const detailedOut = path.join(__dirname, 'assets/clean_detailed_route.jpg');
const overviewIn = path.join(__dirname, 'assets/overview_route.jpg');
const overviewOut = path.join(__dirname, 'assets/clean_overview_route.jpg');

cleanImage(detailedIn, detailedOut);
cleanImage(overviewIn, overviewOut);
