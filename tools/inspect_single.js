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
console.log(`Total orange pixels: ${orangePixels.length}`);

// Min and Max X, Y
const sortedX = [...orangePixels].sort((a,b) => a.x - b.x);
const sortedY = [...orangePixels].sort((a,b) => a.y - b.y);

console.log('Min X:', sortedX[0]);
console.log('Max X:', sortedX[sortedX.length - 1]);
console.log('Min Y:', sortedY[0]);
console.log('Max Y:', sortedY[sortedY.length - 1]);

// Let's find the sections:
// 1. Upper Highway entrance on left:
const leftHighway = orangePixels.filter(p => p.x < 300);
console.log('Left Highway points count:', leftHighway.length, 'sample:', leftHighway[0]);

// 2. Horizontal plotted road (middle-top):
const horizRoad = orangePixels.filter(p => p.y >= 180 && p.y <= 210);
console.log('Horiz road count:', horizRoad.length, 'X range:', Math.min(...horizRoad.map(p=>p.x)), 'to', Math.max(...horizRoad.map(p=>p.x)));

// 3. Central vertical / pin area:
const centerRoad = orangePixels.filter(p => p.x >= 400 && p.x <= 460);
console.log('Center road Y range:', Math.min(...centerRoad.map(p=>p.y)), 'to', Math.max(...centerRoad.map(p=>p.y)));

// 4. Lower diagonal road to Ring road:
const lowerRoad = orangePixels.filter(p => p.y >= 250 && p.y <= 550);
console.log('Lower road count:', lowerRoad.length);

// 5. Ring road loop at bottom:
const bottomLoop = orangePixels.filter(p => p.y >= 450);
console.log('Bottom loop count:', bottomLoop.length, 'X range:', Math.min(...bottomLoop.map(p=>p.x)), 'to', Math.max(...bottomLoop.map(p=>p.x)));
