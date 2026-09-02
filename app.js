// Real-Time Google Earth Live Motion Engine with Seamless All-Path Flow & Zero-Glitch Drag

let isPlaying = false;
let animationFrameId = null;
let currentProgress = 0.0; // 0.0 to 1.0
let playSpeed = 1.0;
let currentZoom = 1.0;

// Path elements
let pathMainLine = null;
let pathMainGlow = null;
let pathHwyWestLine = null;
let pathHwyWestGlow = null;
let pathSeLine = null;
let pathSeGlow = null;
let pathFlyoverNeLine = null;
let pathFlyoverNeGlow = null;
let pathRampNwLine = null;
let pathRampNwGlow = null;
let pathFlyoverSwLine = null;
let pathFlyoverSwGlow = null;

let singleDroneNode = null;
let singleMapWorld = null;

// Panning State
let isDragging = false;
let startX = 0, startY = 0;
let panX = 0, panY = 0;

const milestones = [
    {
        progress: 0.0,
        name: "Top Highway Access (Saral Bihari Corridor)",
        heading: "250° WSW",
        action: "DEPART ARTERIAL HIGHWAY CORRIDOR",
        sub: "Direct access near Saral Bihari Temple",
        speed: "45 km/h",
        icon: "🛣️"
    },
    {
        progress: 0.22,
        name: "Sector Ingress & Internal Grid",
        heading: "170° S",
        action: "ENTERING INTERNAL SECTOR ROAD NETWORK",
        sub: "Connecting into planned colony infrastructure",
        speed: "35 km/h",
        icon: "🏘️"
    },
    {
        progress: 0.50,
        name: "Untitled Placemark (Origin Pin)",
        heading: "260° W",
        action: "PASSING UNTITLED PLACEMARK PIN",
        sub: "Coordinates: 26°44'10.69\"N, 75°52'21.88\"E",
        speed: "40 km/h",
        icon: "📍"
    },
    {
        progress: 1.0,
        name: "West Arterial Link & Terminal",
        heading: "265° W",
        action: "ARRIVE AT WEST INTERCHANGE JUNCTION",
        sub: "Connecting to Balaji Temple & Western Ring Road link",
        speed: "55 km/h",
        icon: "🏁"
    }
];

document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initControls();
    initKeyboard();
    resetMotion();
    setTimeout(() => playMotion(), 500);
});

function initElements() {
    pathMainLine = document.getElementById('path-main-line');
    pathMainGlow = document.getElementById('path-main-glow');
    pathHwyWestLine = document.getElementById('path-hwy-west-line');
    pathHwyWestGlow = document.getElementById('path-hwy-west-glow');
    pathSeLine = document.getElementById('path-se-line');
    pathSeGlow = document.getElementById('path-se-glow');
    pathFlyoverNeLine = document.getElementById('path-flyover-ne-line');
    pathFlyoverNeGlow = document.getElementById('path-flyover-ne-glow');
    pathRampNwLine = document.getElementById('path-ramp-nw-line');
    pathRampNwGlow = document.getElementById('path-ramp-nw-glow');
    pathFlyoverSwLine = document.getElementById('path-flyover-sw-line');
    pathFlyoverSwGlow = document.getElementById('path-flyover-sw-glow');

    singleDroneNode = document.getElementById('single-drone-node');
    singleMapWorld = document.getElementById('single-map-world');

    // Initialize all SVG path dasharrays
    const paths = [
        pathMainLine, pathMainGlow,
        pathHwyWestLine, pathHwyWestGlow,
        pathSeLine, pathSeGlow,
        pathFlyoverNeLine, pathFlyoverNeGlow,
        pathRampNwLine, pathRampNwGlow,
        pathFlyoverSwLine, pathFlyoverSwGlow
    ];

    paths.forEach(p => {
        if (p) {
            const len = p.getTotalLength();
            p.style.strokeDasharray = len;
            p.style.strokeDashoffset = len;
        }
    });
}

function initControls() {
    const playBtn = document.getElementById('play-pause-btn');
    const replayBtn = document.getElementById('replay-btn');
    const fsBtn = document.getElementById('fullscreen-toggle-btn');
    const scrubTrack = document.getElementById('scrubber-track');
    const stage = document.getElementById('stage-single');

    // 1. BUTTER-SMOOTH ZERO-GLITCH POINTER DRAG & PANNING
    if (stage) {
        stage.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.floating-control-center') || e.target.closest('.app-footer-dock') || e.target.closest('.app-header')) return;
            isDragging = true;
            startX = e.clientX - panX;
            startY = e.clientY - panY;
            stage.classList.add('is-dragging');
            if (singleMapWorld) singleMapWorld.classList.add('is-dragging');
            stage.setPointerCapture(e.pointerId);
        });

        stage.addEventListener('pointermove', (e) => {
            if (!isDragging) return;
            panX = e.clientX - startX;
            panY = e.clientY - startY;
            applyMapTransform();
        });

        const stopDrag = (e) => {
            if (!isDragging) return;
            isDragging = false;
            stage.classList.remove('is-dragging');
            if (singleMapWorld) singleMapWorld.classList.remove('is-dragging');
            try { stage.releasePointerCapture(e.pointerId); } catch(err) {}
        };

        stage.addEventListener('pointerup', stopDrag);
        stage.addEventListener('pointercancel', stopDrag);

        // 2. DIRECT MOUSE WHEEL SCROLL -> SMOOTH ZOOM IN & ZOOM OUT
        stage.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
            const newZoom = Math.min(4.0, Math.max(0.6, currentZoom * zoomFactor));
            setZoomLevel(newZoom);
        }, { passive: false });

        // 3. MOBILE & TABLET 2-FINGER PINCH-TO-ZOOM
        let initialPinchDist = null;
        let initialZoom = 1.0;

        stage.addEventListener('touchstart', (e) => {
            if (e.touches.length === 2) {
                initialPinchDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                initialZoom = currentZoom;
            }
        }, { passive: true });

        stage.addEventListener('touchmove', (e) => {
            if (e.touches.length === 2 && initialPinchDist) {
                const currentDist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY
                );
                const factor = currentDist / initialPinchDist;
                const newZoom = Math.min(4.0, Math.max(0.6, initialZoom * factor));
                setZoomLevel(newZoom);
            }
        }, { passive: true });

        stage.addEventListener('touchend', (e) => {
            if (e.touches.length < 2) {
                initialPinchDist = null;
            }
        }, { passive: true });

        // Double click/tap to reset position & zoom
        stage.addEventListener('dblclick', (e) => {
            if (e.target.closest('.app-footer-dock') || e.target.closest('.app-header')) return;
            panX = 0;
            panY = 0;
            setZoomLevel(1.0);
        });
    }

    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (isPlaying) pauseMotion();
            else {
                if (currentProgress >= 1.0) resetMotion();
                playMotion();
            }
        });
    }

    if (replayBtn) {
        replayBtn.addEventListener('click', () => {
            resetMotion();
            playMotion();
        });
    }

    if (fsBtn) fsBtn.addEventListener('click', toggleFullScreen);

    // Speed Controls
    document.querySelectorAll('[data-sp]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-sp]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            playSpeed = parseFloat(btn.dataset.sp);
        });
    });

    // Zoom Controls
    document.querySelectorAll('[data-zoom]').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('[data-zoom]').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setZoomLevel(parseFloat(btn.dataset.zoom));
        });
    });

    const zoomInBtn = document.getElementById('zoom-in-btn');
    const zoomOutBtn = document.getElementById('zoom-out-btn');
    if (zoomInBtn) zoomInBtn.addEventListener('click', () => setZoomLevel(Math.min(2.5, currentZoom + 0.25)));
    if (zoomOutBtn) zoomOutBtn.addEventListener('click', () => setZoomLevel(Math.max(0.8, currentZoom - 0.25)));

    const toggleLabelsBtn = document.getElementById('toggle-labels-btn');
    if (toggleLabelsBtn) {
        toggleLabelsBtn.addEventListener('click', toggleLandmarks);
    }

    // Scrubber click/drag
    if (scrubTrack) {
        scrubTrack.addEventListener('click', (e) => {
            const rect = scrubTrack.getBoundingClientRect();
            const clickPos = (e.clientX - rect.left) / rect.width;
            seekToProgress(Math.max(0, Math.min(1, clickPos)));
        });
    }
}

function applyMapTransform() {
    if (singleMapWorld) {
        singleMapWorld.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
    }
}

function initKeyboard() {
    document.addEventListener('keydown', (e) => {
        if (e.key === ' ' || e.code === 'Space') {
            e.preventDefault();
            if (isPlaying) pauseMotion();
            else playMotion();
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullScreen();
        } else if (e.key === 'l' || e.key === 'L') {
            toggleLandmarks();
        }
    });
}

let landmarksVisible = false;
function toggleLandmarks() {
    landmarksVisible = !landmarksVisible;
    const layer = document.getElementById('landmarks-layer');
    const btn = document.getElementById('toggle-labels-btn');
    if (layer) {
        if (landmarksVisible) {
            layer.classList.remove('hidden');
            if (btn) btn.querySelector('.btn-text').textContent = 'Hide Labels';
        } else {
            layer.classList.add('hidden');
            if (btn) btn.querySelector('.btn-text').textContent = 'Show Labels';
        }
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(e => console.log(e));
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
}

function playMotion() {
    isPlaying = true;
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn) {
        playBtn.querySelector('.action-icon').textContent = '⏸';
        playBtn.querySelector('.action-text').textContent = 'PAUSE MOTION';
    }

    let lastTimestamp = performance.now();
    const totalDuration = 7500; // 7.5 seconds

    function step(timestamp) {
        const delta = timestamp - lastTimestamp;
        lastTimestamp = timestamp;

        currentProgress += (delta / (totalDuration / playSpeed));

        if (currentProgress >= 1.0) {
            currentProgress = 1.0;
            renderMotionState(1.0);
            pauseMotion();
            if (playBtn) {
                playBtn.querySelector('.action-icon').textContent = '↺';
                playBtn.querySelector('.action-text').textContent = 'REPLAY MOTION';
            }
            return;
        }

        renderMotionState(currentProgress);

        if (isPlaying) {
            animationFrameId = requestAnimationFrame(step);
        }
    }

    animationFrameId = requestAnimationFrame(step);
}

function pauseMotion() {
    isPlaying = false;
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    const playBtn = document.getElementById('play-pause-btn');
    if (playBtn && currentProgress < 1.0) {
        playBtn.querySelector('.action-icon').textContent = '▶';
        playBtn.querySelector('.action-text').textContent = 'RESUME MOTION';
    }
}

function resetMotion() {
    pauseMotion();
    currentProgress = 0.0;
    renderMotionState(0.0);
}

function seekToProgress(prog) {
    currentProgress = prog;
    renderMotionState(prog);
}

function seekToMilestone(idx) {
    if (milestones[idx]) {
        seekToProgress(milestones[idx].progress);
    }
}

function setZoomLevel(zoom) {
    currentZoom = parseFloat(zoom.toFixed(2));
    applyMapTransform();
}

// -------------------------------------------------------------
// RENDER ALL PATHS SIMULTANEOUSLY & CONTINUOUSLY
// -------------------------------------------------------------
function renderMotionState(prog) {
    if (!pathMainLine) return;

    const lenMain = pathMainLine.getTotalLength();
    const currentLen = lenMain * prog;

    // 1. Draw Primary Track (Top Highway -> Colony -> Placemark -> West Link)
    pathMainLine.style.strokeDashoffset = lenMain * (1 - prog);
    if (pathMainGlow) pathMainGlow.style.strokeDashoffset = lenMain * (1 - prog);

    // 2. Animate Highway West Extension when departing junction
    if (pathHwyWestLine && pathHwyWestGlow) {
        const lenHwyW = pathHwyWestLine.getTotalLength();
        if (prog > 0.08) {
            const hwyProg = Math.min((prog - 0.08) / 0.3, 1);
            pathHwyWestLine.style.strokeDashoffset = lenHwyW * (1 - hwyProg);
            pathHwyWestGlow.style.strokeDashoffset = lenHwyW * (1 - hwyProg);
        } else {
            pathHwyWestLine.style.strokeDashoffset = lenHwyW;
            pathHwyWestGlow.style.strokeDashoffset = lenHwyW;
        }
    }

    // 3. Animate South-East Branch to Navchetna School when passing central junction
    if (pathSeLine && pathSeGlow) {
        const lenSe = pathSeLine.getTotalLength();
        if (prog > 0.45) {
            const seProg = Math.min((prog - 0.45) / 0.4, 1);
            pathSeLine.style.strokeDashoffset = lenSe * (1 - seProg);
            pathSeGlow.style.strokeDashoffset = lenSe * (1 - seProg);
        } else {
            pathSeLine.style.strokeDashoffset = lenSe;
            pathSeGlow.style.strokeDashoffset = lenSe;
        }
    }

    // 4. Animate Interchange Flyovers & Ramps
    const interchangePaths = [
        { line: pathFlyoverNeLine, glow: pathFlyoverNeGlow, startProg: 0.1 },
        { line: pathRampNwLine, glow: pathRampNwGlow, startProg: 0.2 },
        { line: pathFlyoverSwLine, glow: pathFlyoverSwGlow, startProg: 0.3 }
    ];

    interchangePaths.forEach(item => {
        if (item.line && item.glow) {
            const len = item.line.getTotalLength();
            if (prog > item.startProg) {
                const subProg = Math.min((prog - item.startProg) / 0.4, 1);
                item.line.style.strokeDashoffset = len * (1 - subProg);
                item.glow.style.strokeDashoffset = len * (1 - subProg);
            } else {
                item.line.style.strokeDashoffset = len;
                item.glow.style.strokeDashoffset = len;
            }
        }
    });

    // 5. Moving Pointer Position along Main Track
    const dronePt = pathMainLine.getPointAtLength(currentLen);
    if (singleDroneNode) {
        singleDroneNode.setAttribute('transform', `translate(${dronePt.x}, ${dronePt.y})`);
    }

    // 6. Telemetry Updates
    const scrubberFill = document.getElementById('scrubber-fill');
    const scrubPct = document.getElementById('scrub-pct');
    const telemetryDist = document.getElementById('telemetry-dist');

    if (scrubberFill) scrubberFill.style.width = `${prog * 100}%`;
    if (scrubPct) scrubPct.textContent = `${Math.round(prog * 100)}%`;

    const distTraveled = (prog * 1.62).toFixed(2);
    if (telemetryDist) telemetryDist.textContent = `${distTraveled} / 1.62 km`;

    updateActiveMilestone(prog);
}

function updateActiveMilestone(prog) {
    let activeM = milestones[0];
    for (let i = milestones.length - 1; i >= 0; i--) {
        if (prog >= milestones[i].progress - 0.05) {
            activeM = milestones[i];
            break;
        }
    }

    const currentPointLabel = document.getElementById('current-point-label');
    const telemetryHeading = document.getElementById('telemetry-heading');

    if (currentPointLabel) currentPointLabel.textContent = `📍 ${activeM.name}`;
    if (telemetryHeading) telemetryHeading.textContent = activeM.heading;
}
