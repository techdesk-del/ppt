const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/single_complete_route.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 155 && g > 40 && g < 185 && b < 100 && (r - g) >= 20 && (g - b) >= 10);
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

// Let's sample the exact centerline points for each distinct feature:

// 1. Top Highway Section A (from Top-Right x=838 down to the right-turn entry at x=773, y=50)
const topHwyA = [];
for (let x = 838; x >= 773; x -= 10) {
    const pts = orangePixels.filter(p => Math.abs(p.x - x) <= 5 && p.y >= 35 && p.y <= 55);
    if (pts.length > 0) {
        const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        topHwyA.push({ x, y: Math.round(avgY) });
    }
}
topHwyA.push({ x: 773, y: 50 });

// 1b. Top Highway Section B continuing west past Saral Bihari Temple (from x=773 down to ~600)
const topHwyB = [];
for (let x = 773; x >= 590; x -= 15) {
    const pts = orangePixels.filter(p => Math.abs(p.x - x) <= 7 && p.y >= 50 && p.y <= 95);
    if (pts.length > 0) {
        const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        topHwyB.push({ x, y: Math.round(avgY) });
    }
}

// 2. Colony Ingress (from x=773, y=50 south down to x=796, y=149)
const colonyTurn = [];
for (let y = 50; y <= 149; y += 8) {
    const pts = orangePixels.filter(p => Math.abs(p.y - y) <= 4 && p.x >= 765 && p.x <= 805);
    if (pts.length > 0) {
        const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        colonyTurn.push({ x: Math.round(avgX), y });
    }
}
colonyTurn.push({ x: 796, y: 149 });

// 3. Colony Road Diag 1 (from x=796, y=149 down-left to x=718, y=163)
const diag1 = [];
for (let x = 796; x >= 718; x -= 8) {
    const pts = orangePixels.filter(p => Math.abs(p.x - x) <= 4 && p.y >= 142 && p.y <= 170);
    if (pts.length > 0) {
        const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        diag1.push({ x, y: Math.round(avgY) });
    }
}
diag1.push({ x: 718, y: 163 });

// 4. Colony Road Diag 2 (from x=718, y=163 south-west to junction at x=662, y=273)
const diag2 = [];
for (let y = 163; y <= 273; y += 8) {
    const pts = orangePixels.filter(p => Math.abs(p.y - y) <= 4 && p.x >= 655 && p.x <= 725);
    if (pts.length > 0) {
        const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        diag2.push({ x: Math.round(avgX), y });
    }
}
diag2.push({ x: 662, y: 273 });

// 5. Long Horizontal Road (from x=180, y=214 to x=662, y=273) passing Untitled Placemark at (603, 272)
const horizRoad = [];
for (let x = 180; x <= 662; x += 12) {
    const pts = orangePixels.filter(p => Math.abs(p.x - x) <= 6 && p.y >= 210 && p.y <= 278);
    if (pts.length > 0) {
        const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        horizRoad.push({ x, y: Math.round(avgY) });
    } else {
        // Linear interpolate if missing (e.g. under blue pin at x=595..605)
        const prog = (x - 180) / (662 - 180);
        const estY = Math.round(214 + (273 - 214) * prog);
        horizRoad.push({ x, y: estY });
    }
}
horizRoad.push({ x: 662, y: 273 });

// 6. South-East Road to Navchetna School (from x=662, y=273 to x=891, y=390)
const seRoad = [];
for (let x = 662; x <= 885; x += 12) {
    const pts = orangePixels.filter(p => Math.abs(p.x - x) <= 6 && p.y >= 265 && p.y <= 335);
    if (pts.length > 0) {
        const avgY = pts.reduce((s, p) => s + p.y, 0) / pts.length;
        seRoad.push({ x, y: Math.round(avgY) });
    }
}
// Turn down near school:
const schoolTurn = [];
for (let y = 318; y <= 390; y += 8) {
    const pts = orangePixels.filter(p => Math.abs(p.y - y) <= 4 && p.x >= 875 && p.x <= 900);
    if (pts.length > 0) {
        const avgX = pts.reduce((s, p) => s + p.x, 0) / pts.length;
        schoolTurn.push({ x: Math.round(avgX), y });
    }
}
schoolTurn.push({ x: 891, y: 390 });

// 7. Interchange Arrows:
// Balaji Temple Flyover (North-East):
const balajiArrow = [
    { x: 140, y: 160 },
    { x: 190, y: 95 },
    { x: 232, y: 48 },
    { x: 248, y: 28 }
];

// Interchange Cloverleaf NW Ramp:
const cloverleafArrow = [
    { x: 135, y: 140 },
    { x: 80, y: 105 },
    { x: 45, y: 92 },
    { x: 12, y: 82 }
];

// Flyover South-West Exit:
const swFlyoverArrow = [
    { x: 140, y: 165 },
    { x: 95, y: 225 },
    { x: 58, y: 268 },
    { x: 46, y: 278 }
];

function ptsToD(pts) {
    if (pts.length === 0) return '';
    return `M ${pts[0].x} ${pts[0].y}` + pts.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');
}

console.log('--- EXACT SVG PATH DATA STRINGS ---');
console.log('topHwyA:', ptsToD(topHwyA));
console.log('topHwyB:', ptsToD(topHwyB));
console.log('colonyTurn:', ptsToD(colonyTurn));
console.log('diag1:', ptsToD(diag1));
console.log('diag2:', ptsToD(diag2));
console.log('horizRoad:', ptsToD(horizRoad));
console.log('seRoad:', ptsToD([...seRoad, ...schoolTurn.slice(1)]));
console.log('balajiArrow:', ptsToD(balajiArrow));
console.log('cloverleafArrow:', ptsToD(cloverleafArrow));
console.log('swFlyoverArrow:', ptsToD(swFlyoverArrow));

// Unified Primary Continuous Flow:
// From Top Highway -> Colony Turn -> Diag 1 -> Diag 2 -> Junction (662, 273) -> Long Horizontal Road to West Link (180, 214)
const unifiedMain = [
    ...topHwyA,
    ...colonyTurn.slice(1),
    ...diag1.slice(1),
    ...diag2.slice(1),
    // Traverse westward along horizontal road from 662, 273 to 180, 214:
    ...horizRoad.slice().reverse().slice(1)
];

console.log('\n--- UNIFIED PRIMARY CONTINUOUS TRACK ---');
console.log('unifiedMain:', ptsToD(unifiedMain));
