const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/media_1788325588251.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 180 && g > 60 && g < 170 && b < 70 && (r - g) > 40 && (g - b) > 30);
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

// 1. Diagonal: from x = 96 to x = 295
const diagPts = [];
for (let x = 96; x <= 295; x += 15) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 7 && p.y <= 510 && p.y >= 370);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        diagPts.push({ x, y: Math.round(avgY) });
    }
}

// Corner 1: top of diagonal before turning down/right
const corner1 = { x: 295, y: 374 };

// 2. Diagonal descent to horizontal road: from x = 295 to x = 390
const descentPts = [];
for (let x = 300; x <= 390; x += 15) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 7 && p.y >= 370 && p.y <= 515);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        descentPts.push({ x, y: Math.round(avgY) });
    }
}

// 3. Horizontal Road: from x = 390 to x = 645 (y is around 505)
const horizPts = [];
for (let x = 390; x <= 645; x += 25) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 12 && p.y >= 495 && p.y <= 520);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        horizPts.push({ x, y: Math.round(avgY) });
    }
}

// 4. Feeder from placemark: from (677, 569) to (645, 505)
const feederPts = [
    { x: 677, y: 569 },
    { x: 665, y: 535 },
    { x: 645, y: 505 }
];

// 5. Vertical Road going North: from y = 505 up to y = 160 (x goes from 645 to 585)
const vertPts = [];
for (let y = 505; y >= 160; y -= 25) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 12 && p.x >= 570 && p.x <= 660);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        vertPts.push({ x: Math.round(avgX), y });
    }
}

// 6. Top Kink / Arrow area: from y = 160 up to y = 42
const topPts = [];
for (let y = 160; y >= 42; y -= 15) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 7 && p.x >= 540 && p.x <= 630);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        topPts.push({ x: Math.round(avgX), y });
    }
}

console.log('--- EXACT SVG PATH POINTS ---');
const mainPath = [
    ...diagPts,
    corner1,
    ...descentPts,
    ...horizPts,
    ...vertPts,
    ...topPts
];

console.log('Main Path (' + mainPath.length + ' points):');
console.log(JSON.stringify(mainPath));

// Convert to SVG d attribute:
let svgD = `M ${mainPath[0].x} ${mainPath[0].y}`;
for (let i = 1; i < mainPath.length; i++) {
    svgD += ` L ${mainPath[i].x} ${mainPath[i].y}`;
}
console.log('\nSVG d = "' + svgD + '"');
