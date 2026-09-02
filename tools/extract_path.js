const fs = require('fs');
const jpeg = require('jpeg-js');
const path = require('path');

const rawData = fs.readFileSync('d:/ppt/assets/media_1788325588251.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 180 && g > 60 && g < 170 && b < 70 && (r - g) > 40 && (g - b) > 30);
};

// Find all orange points
const orangePixels = [];
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (isOrange(data[idx], data[idx+1], data[idx+2])) {
            orangePixels.push({ x, y });
        }
    }
}

console.log(`Found ${orangePixels.length} orange pixels.`);

// Let's sample the orange line along key milestones from start to finish
// Let's find min X, max X, min Y, max Y, etc.
const sortedByX = [...orangePixels].sort((a,b) => a.x - b.x);
const sortedByY = [...orangePixels].sort((a,b) => a.y - b.y);

console.log('Min X (Highway start):', sortedByX[0]);
console.log('Max X (Right road):', sortedByX[sortedByX.length - 1]);
console.log('Min Y (Top North end):', sortedByY[0]);
console.log('Max Y (Bottom pin end):', sortedByY[sortedByY.length - 1]);

// Let's trace the path points along the line:
// 1. Bottom-Left Highway: around x: 96, y: 520 (or whatever min X is)
// 2. Rising diagonally to the apex/corner
// 3. Going horizontally right
// 4. Going from bottom-right (pin) up to the right vertical road
// 5. Going up along the right vertical road
// 6. The kink at the top right

// Let's bin by X or Y to get smooth centroid polyline
function getCentroids() {
    // Segment 1: Diagonal from Bottom-Left (minX) to Corner 1
    // Let's find pixels where y > 350 and x < 350
    const seg1 = orangePixels.filter(p => p.x <= 298 && p.y >= 380);
    // Segment 2: Horizontal road (x between 290 and 650, y between 480 and 520)
    const seg2 = orangePixels.filter(p => p.x >= 290 && p.x <= 655 && p.y >= 490 && p.y <= 525);
    // Segment 3: Feeder from Placemark (x between 650 and 700, y >= 510)
    const seg3 = orangePixels.filter(p => p.x >= 650 && p.y >= 510);
    // Segment 4: Vertical road going North past school (x between 580 and 660, y between 150 and 510)
    const seg4 = orangePixels.filter(p => p.x >= 580 && p.x <= 660 && p.y >= 150 && p.y <= 510);
    // Segment 5: Top kink and north exit (y < 160)
    const seg5 = orangePixels.filter(p => p.y < 160);

    console.log('Seg1 count:', seg1.length);
    console.log('Seg2 count:', seg2.length);
    console.log('Seg3 count:', seg3.length);
    console.log('Seg4 count:', seg4.length);
    console.log('Seg5 count:', seg5.length);
}

getCentroids();
