const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/media_1788325588225.jpg');
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

console.log(`Found ${orangePixels.length} orange pixels in Screenshot 1.`);

// Main straight path: from top pin (y = 25) down to bottom (y = 495)
const mainLine = [];
for (let y = 25; y <= 495; y += 20) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 10 && p.x >= 320 && p.x <= 530);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        mainLine.push({ x: Math.round(avgX), y });
    }
}

// Curved branch: from x = 358 down along curve to x = 500
const branchLine = [];
for (let x = 358; x <= 500; x += 15) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 8 && p.y >= 330 && p.y <= 460);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        branchLine.push({ x, y: Math.round(avgY) });
    }
}

let svgMain = `M ${mainLine[0].x} ${mainLine[0].y}`;
for (let i = 1; i < mainLine.length; i++) svgMain += ` L ${mainLine[i].x} ${mainLine[i].y}`;

let svgBranch = `M ${branchLine[0].x} ${branchLine[0].y}`;
for (let i = 1; i < branchLine.length; i++) svgBranch += ` L ${branchLine[i].x} ${branchLine[i].y}`;

console.log('Overview Main d = "' + svgMain + '"');
console.log('Overview Branch d = "' + svgBranch + '"');
