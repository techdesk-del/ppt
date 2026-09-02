const fs = require('fs');
const jpeg = require('jpeg-js');

const rawData = fs.readFileSync('d:/ppt/assets/single_complete_route.jpg');
const img = jpeg.decode(rawData, { useTArray: true, formatAsRGBA: true });
const { width, height, data } = img;

const isOrange = (r, g, b) => {
    return (r > 155 && g > 40 && g < 185 && b < 100 && (r - g) >= 20 && (g - b) >= 10);
};

const grid = [];
let totalOrange = 0;
for (let y = 0; y < height; y++) {
    grid[y] = new Uint8Array(width);
    for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        if (isOrange(data[idx], data[idx + 1], data[idx + 2])) {
            grid[y][x] = 1;
            totalOrange++;
        }
    }
}
console.log('Total orange pixels:', totalOrange);

// Connected component labeling to isolate separate lines/paths
const visited = new Uint8Array(width * height);
const components = [];

for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
        if (grid[y][x] && !visited[y * width + x]) {
            const comp = [];
            const queue = [[x, y]];
            visited[y * width + x] = 1;

            while (queue.length > 0) {
                const [cx, cy] = queue.pop();
                comp.push({ x: cx, y: cy });

                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const nx = cx + dx, ny = cy + dy;
                        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                            if (grid[ny][nx] && !visited[ny * width + nx]) {
                                visited[ny * width + nx] = 1;
                                queue.push([nx, ny]);
                            }
                        }
                    }
                }
            }

            if (comp.length > 25) {
                components.push(comp);
            }
        }
    }
}

console.log(`Found ${components.length} distinct orange path components.`);
components.sort((a, b) => b.length - a.length);

components.forEach((c, idx) => {
    const xs = c.map(p => p.x), ys = c.map(p => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    console.log(`Comp #${idx+1}: size=${c.length}, bbox=[x: ${minX}..${maxX}, y: ${minY}..${maxY}]`);
});
