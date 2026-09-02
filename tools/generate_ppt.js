const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createPresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_WIDE'; // 16:9
    pptx.title = 'Jaipur Complete Site Route & Access Analysis';
    pptx.author = 'Antigravity Geospatial Engine';

    const bgImagePath = path.join(__dirname, '../assets/clean_single_complete_route.jpg');
    const sourceImagePath = path.join(__dirname, '../assets/single_complete_route.jpg');

    // Slide 1: Executive Title & Geospatial Overview
    const slide1 = pptx.addSlide();
    slide1.background = { color: '050811' };
    
    // Header Banner
    slide1.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.4, w: 12.33, h: 0.9,
        fill: { color: '0B132B' }, line: { color: '00FF66', width: 1.5 }
    });
    slide1.addText('JAIPUR COMPLETE CORRIDOR ACCESS ANALYSIS', {
        x: 0.8, y: 0.5, w: 8.5, h: 0.4,
        fontSize: 18, fontFace: 'Arial', bold: true, color: 'FFFFFF'
    });
    slide1.addText('📍 Saral Bihari Corridor | Untitled Placemark | Navchetna School | Ring Road Interchange', {
        x: 0.8, y: 0.9, w: 11.0, h: 0.3,
        fontSize: 11, fontFace: 'Arial', color: '00E5FF'
    });

    // Main Satellite Map Image
    if (fs.existsSync(sourceImagePath)) {
        slide1.addImage({
            path: sourceImagePath,
            x: 0.5, y: 1.5, w: 8.2, h: 5.2,
            sizing: { type: 'contain', w: 8.2, h: 5.2 }
        });
    }

    // Key Corridor Highlights Panel
    slide1.addShape(pptx.ShapeType.roundRect, {
        x: 9.0, y: 1.5, w: 3.8, h: 5.2,
        fill: { color: '0B132B' }, line: { color: '2A3B5C', width: 1 }, rectRadius: 0.1
    });
    
    slide1.addText('CORRIDOR TELEMETRY', {
        x: 9.2, y: 1.7, w: 3.4, h: 0.35,
        fontSize: 13, fontFace: 'Arial', bold: true, color: '00FF66'
    });

    const highlights = [
        '🛣️ Highway Ingress: Direct grade access off arterial corridor near Saral Bihari Temple',
        '📍 Untitled Placemark: Prime development sector pinpointed at 26°44\'10.69"N, 75°52\'21.88"E',
        '🏫 Educational Landmark: Navchetna Mansik Avm Mook Badhir School terminal junction',
        '🔄 Multi-Directional: Seamless bi-directional circulation to Balaji Temple & Western Link'
    ];

    slide1.addText(highlights.join('\n\n'), {
        x: 9.2, y: 2.2, w: 3.4, h: 4.2,
        fontSize: 10, fontFace: 'Arial', color: 'E2E8F0', lineSpacing: 18
    });

    // Slide 2: High Resolution Clean Satellite Map with Vector Overlays
    const slide2 = pptx.addSlide();
    slide2.background = { color: '050811' };

    slide2.addShape(pptx.ShapeType.rect, {
        x: 0.5, y: 0.4, w: 12.33, h: 0.8,
        fill: { color: '0B132B' }, line: { color: '00FF66', width: 1.5 }
    });
    slide2.addText('MASTER SITE ACCESS & ROUTE NETWORK PLAN', {
        x: 0.8, y: 0.55, w: 11.0, h: 0.45,
        fontSize: 16, fontFace: 'Arial', bold: true, color: 'FFFFFF'
    });

    if (fs.existsSync(bgImagePath)) {
        slide2.addImage({
            path: bgImagePath,
            x: 0.5, y: 1.4, w: 12.33, h: 5.4,
            sizing: { type: 'contain', w: 12.33, h: 5.4 }
        });
    }

    const outFiles = [
        path.join(__dirname, '../Jaipur_Site_Route_Analysis_Complete.pptx'),
        path.join(__dirname, '../Jaipur_Site_Route_Analysis_Final.pptx'),
        path.join(__dirname, '../Jaipur_Site_Route_Analysis.pptx')
    ];

    for (const outFile of outFiles) {
        await pptx.writeFile({ fileName: outFile });
        console.log(`Generated presentation: ${outFile}`);
    }
}

createPresentation().catch(console.error);
