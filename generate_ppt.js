const pptxgen = require('pptxgenjs');
const path = require('path');
const fs = require('fs');

async function createSingleImagePresentation() {
    const pptx = new pptxgen();
    pptx.layout = 'LAYOUT_16x9';
    pptx.title = 'Jaipur Complete Site Route & Access Analysis';
    pptx.author = 'Executive Engineering & Leadership';

    const imgPath = path.resolve(__dirname, 'assets/single_complete_route.jpg');
    const COLOR_GREEN = '00FF66';
    const COLOR_CYAN = '00E5FF';
    const COLOR_GOLD = 'FFD700';

    // =========================================================================
    // SLIDE 1: Full-Screen Complete Route Master Slide
    // =========================================================================
    const slide1 = pptx.addSlide();
    if (fs.existsSync(imgPath)) {
        slide1.addImage({
            path: imgPath,
            x: 0, y: 0, w: 13.333, h: 7.5,
            sizing: { type: 'cover', w: 13.333, h: 7.5 }
        });
    }

    // Top HUD Ribbon
    slide1.addShape(pptx.ShapeType.roundRect, {
        x: 0.5, y: 0.4, w: 12.333, h: 0.8,
        fill: { color: '070B14', transparency: 15 },
        line: { color: COLOR_GREEN, width: 1.5 },
        rectRadius: 0.1
    });

    slide1.addText("JAIPUR SITE COMPLETE CORRIDOR ACCESS & HIGHWAY CONNECTIVITY", {
        x: 0.8, y: 0.45, w: 7.5, h: 0.35,
        fontSize: 13, bold: true, color: 'FFFFFF', fontFace: 'Calibri'
    });
    slide1.addText("📍 GPS: 26°44'10.69\"N, 75°52'21.88\"E  |  JAIPUR RING ROAD (148C / TOLL ROAD)", {
        x: 0.8, y: 0.8, w: 7.5, h: 0.3,
        fontSize: 10, bold: true, color: COLOR_CYAN, fontFace: 'Consolas'
    });

    // Right Floating Intelligence HUD
    slide1.addShape(pptx.ShapeType.roundRect, {
        x: 8.8, y: 1.5, w: 4.0, h: 5.4,
        fill: { color: '0B132B', transparency: 10 },
        line: { color: COLOR_GREEN, width: 1.5 },
        rectRadius: 0.15
    });

    slide1.addText("KEY ROUTE ANNOTATIONS", {
        x: 9.1, y: 1.7, w: 3.4, h: 0.3,
        fontSize: 11, bold: true, color: COLOR_GREEN, fontFace: 'Calibri'
    });

    const points = [
        "1️⃣ Highway Ingress (West):\nEntry from west road corridor passing Saral Bihari Temple.",
        "2️⃣ Untitled Placemark Pin:\nCentral survey base at 26°44'10.69\"N, 75°52'21.88\"E.",
        "3️⃣ North Arm (Mathurawala):\nConnecting north towards Mathurawala sector grid.",
        "4️⃣ Southbound Corridor Link:\nStraight linear bypass connecting south to Jaipur Ring Road.",
        "5️⃣ Jaipur Ring Rd (148C / Toll):\nMulti-lane high-speed expressway interchange loop."
    ];

    slide1.addText(points.join("\n\n"), {
        x: 9.1, y: 2.1, w: 3.4, h: 4.6,
        fontSize: 9.5, color: 'F1F5F9', fontFace: 'Calibri', lineSpacing: 13
    });

    const outputPath = path.resolve(__dirname, 'Jaipur_Site_Route_Analysis_Complete.pptx');
    await pptx.writeFile({ fileName: outputPath });
    console.log(`Single Complete Image PPTX created successfully at: ${outputPath}`);
}

createSingleImagePresentation().catch(err => console.error(err));
