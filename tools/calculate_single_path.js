const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/single_complete_route.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 170 && g > 60 && g < 170 && b < 70 && (r - g) > 30 && (g - b) > 20);
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

// 1. Upper Ingress Path: from left highway (259, 192) -> diagonal (320, 150) -> transverse (350, 195) -> horizontal to pin (445, 198)
const upperIngress = [
    { x: 259, y: 192 },
    { x: 275, y: 178 },
    { x: 295, y: 162 },
    { x: 318, y: 148 },
    { x: 335, y: 168 },
    { x: 350, y: 195 },
    { x: 380, y: 196 },
    { x: 410, y: 197 },
    { x: 445, y: 198 }
];

// 2. North Arm (towards Mathurawala): from (445, 198) -> up through (422, 110) -> (430, 75) -> (438, 36)
const northArm = [
    { x: 445, y: 198 },
    { x: 435, y: 170 },
    { x: 428, y: 140 },
    { x: 422, y: 110 },
    { x: 405, y: 75 },
    { x: 430, y: 70 },
    { x: 438, y: 36 }
];

// 3. Central Blue Pin:
const pinPoint = { x: 445, y: 218 };

// 4. Main Long Corridor (from Pin down to Jaipur Ring Road):
const southCorridor = [];
for (let y = 218; y <= 540; y += 18) {
    const subset = orangePixels.filter(p => Math.abs(p.y - y) <= 9 && p.x >= 430 && p.x <= 580);
    if (subset.length > 0) {
        const avgX = subset.reduce((sum, p) => sum + p.x, 0) / subset.length;
        southCorridor.push({ x: Math.round(avgX), y });
    }
}
southCorridor.push({ x: 568, y: 546 });

// 5. Lower Loop & Branch at Ring Road:
const lowerBranch = [
    { x: 470, y: 460 },
    { x: 490, y: 485 },
    { x: 515, y: 505 },
    { x: 545, y: 512 },
    { x: 560, y: 512 }
];

const lowerRoundabout = [
    { x: 535, y: 490 },
    { x: 555, y: 495 },
    { x: 560, y: 515 },
    { x: 545, y: 530 },
    { x: 525, y: 525 },
    { x: 520, y: 505 },
    { x: 535, y: 490 }
];

function ptsToD(pts) {
    return `M ${pts[0].x} ${pts[0].y}` + pts.slice(1).map(p => ` L ${p.x} ${p.y}`).join('');
}

console.log('upperIngress d =', `"${ptsToD(upperIngress)}"`);
console.log('northArm d =', `"${ptsToD(northArm)}"`);
console.log('southCorridor d =', `"${ptsToD(southCorridor)}"`);
console.log('lowerBranch d =', `"${ptsToD(lowerBranch)}"`);
console.log('lowerRoundabout d =', `"${ptsToD(lowerRoundabout)}"`);

// Full unified route from Highway -> Pin -> South Corridor -> Ring Road:
const unifiedRoute = [
    ...upperIngress,
    pinPoint,
    ...southCorridor
];
console.log('unifiedRoute d =', `"${ptsToD(unifiedRoute)}"`);
