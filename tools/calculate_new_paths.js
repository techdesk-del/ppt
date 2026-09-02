const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/single_complete_route.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 165 && g > 55 && g < 180 && b < 85 && (r - g) > 25 && (g - b) > 15);
};

const orangePixels = [];
for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (isOrange(data[idx], data[idx + 1], data[idx + 2])) {
            orangePixels.push({ x, y });
        }
    }
}

console.log(`Total orange pixels: ${orangePixels.length}`);

// Segment 1: Top Highway (x: 835 down to 770, y: 39 to 50)
const topHighway = [];
for (let x = 835; x >= 773; x -= 8) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 4 && p.y >= 30 && p.y <= 60);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        topHighway.push({ x, y: Math.round(avgY) });
    }
}
topHighway.push({ x: 773, y: 50 });

// Segment 2: North Arm into Colony (y: 50 down to 148, x: ~773 to 795)
const colonyEntrance = [];
for (let y = 50; y <= 148; y += 10) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 5 && p.x >= 760 && p.x <= 805);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        colonyEntrance.push({ x: Math.round(avgX), y });
    }
}
colonyEntrance.push({ x: 795, y: 148 });

// Segment 3: Diagonal Internal Road 1 (from 795, 148 to 718, 163)
const internalDiag1 = [];
for (let x = 795; x >= 718; x -= 8) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 4 && p.y >= 140 && p.y <= 170);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        internalDiag1.push({ x, y: Math.round(avgY) });
    }
}
internalDiag1.push({ x: 718, y: 163 });

// Segment 4: Diagonal Internal Road 2 (from 718, 163 to junction at 662, 273)
const internalDiag2 = [];
for (let y = 163; y <= 273; y += 10) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 5 && p.x >= 650 && p.x <= 730);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        internalDiag2.push({ x: Math.round(avgX), y });
    }
}
internalDiag2.push({ x: 662, y: 273 });

// Segment 5: West Corridor passing Untitled placemark (from 662, 273 to 186, 214)
const westCorridor = [];
for (let x = 662; x >= 186; x -= 16) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 8 && p.y >= 200 && p.y <= 290);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        westCorridor.push({ x, y: Math.round(avgY) });
    }
}
westCorridor.push({ x: 186, y: 214 });

// Segment 6: South-East Corridor towards Navchetna School (from 662, 273 to 891, 388)
const seCorridor = [];
for (let x = 662; x <= 880; x += 15) {
    const subset = orangePixels.filter(p => Math.abs(p.x - x) <= 8 && p.y >= 265 && p.y <= 340);
    if (subset.length > 0) {
        const avgY = subset.reduce((sum, p) => sum + p.y, 0) / subset.length;
        seCorridor.push({ x, y: Math.round(avgY) });
    }
}
// Final turn south past the school
seCorridor.push({ x: 885, y: 318 });
seCorridor.push({ x: 887, y: 345 });
seCorridor.push({ x: 891, y: 388 });

function ptsToD(pts) {
    return `M ${pts[0].x} ${pts[0].y}` + pts.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');
}

console.log('\n--- EXTRACTED EXACT PATHS ---');
console.log('topHighway:', ptsToD(topHighway));
console.log('colonyEntrance:', ptsToD(colonyEntrance));
console.log('internalDiag1:', ptsToD(internalDiag1));
console.log('internalDiag2:', ptsToD(internalDiag2));
console.log('westCorridor:', ptsToD(westCorridor));
console.log('seCorridor:', ptsToD(seCorridor));

// Main Primary Vehicle Track:
// From Top Highway -> Colony Entrance -> Diag 1 -> Diag 2 -> Junction (662, 273) -> Passing Placemark (603, 272) -> West Terminal (186, 214)
const primaryTrack = [
    ...topHighway,
    ...colonyEntrance.slice(1),
    ...internalDiag1.slice(1),
    ...internalDiag2.slice(1),
    ...westCorridor.slice(1)
];

console.log('\nprimaryTrack:', ptsToD(primaryTrack));
