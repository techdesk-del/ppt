// Real-Time Google Earth Live Motion Engine with Seamless All-Path Flow & Zero-Glitch Drag

let isPlaying = false;
let animationFrameId = null;
let currentProgress = 0.0; // 0.0 to 1.0
let playSpeed = 1.0;
let currentZoom = 1.0;

// Path elements
let pathMainLine = null;
let pathMainGlow = null;
let pathNorthLine = null;
let pathNorthGlow = null;
let pathLowerBranchLine = null;
let pathLowerBranchGlow = null;
let pathLowerLoopLine = null;
let pathLowerLoopGlow = null;

let singleDroneNode = null;
let singleMapWorld = null;

// Panning State
let isDragging = false;
let startX = 0, startY = 0;
let panX = 0, panY = 0;

const milestones = [
    {
        progress: 0.0,
        name: "West Highway Ingress",
        heading: "045° NE",
        action: "DEPART WEST ARTERIAL HIGHWAY",
        sub: "Connecting into residential/commercial sector grid",
        speed: "40 km/h",
        icon: "🛣️"
    },
    {
        progress: 0.38,
        name: "Untitled Placemark (Origin Pin)",
        heading: "155° SSE",
        action: "REACH UNTITLED PLACEMARK PIN",
        sub: "Coordinates: 26°44'10.69\"N, 75°52'21.88\"E",
        speed: "35 km/h",
        icon: "📍"
    },
    {
        progress: 0.70,
        name: "Southbound Main Corridor",
        heading: "155° SSE",
        action: "TRAVERSING SOUTH ARTERIAL LINK",
        sub: "Passing Manpur Nagalya & Prahladpura sector",
        speed: "55 km/h",
        icon: "⬇️"
    },
    {
        progress: 1.0,
        name: "Jaipur Ring Road (148C / Toll Rd)",
        heading: "160° SSE",
        action: "ARRIVE AT JAIPUR RING ROAD JUNCTION",
        sub: "Final high-speed toll expressway interchange",
        speed: "60 km/h",
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
    pathNorthLine = document.getElementById('path-north-line');
    pathNorthGlow = document.getElementById('path-north-glow');
    pathLowerBranchLine = document.getElementById('path-lower-branch-line');
    pathLowerBranchGlow = document.getElementById('path-lower-branch-glow');
    pathLowerLoopLine = document.getElementById('path-lower-loop-line');
    pathLowerLoopGlow = document.getElementById('path-lower-loop-glow');

    singleDroneNode = document.getElementById('single-drone-node');
    singleMapWorld = document.getElementById('single-map-world');

    // Initialize all SVG path dasharrays
    const paths = [
        pathMainLine, pathMainGlow,
        pathNorthLine, pathNorthGlow,
        pathLowerBranchLine, pathLowerBranchGlow,
        pathLowerLoopLine, pathLowerLoopGlow
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
            if (e.target.closest('.floating-control-center') || e.target.closest('.top-hud')) return;
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
            
            // Calculate zoom delta (Up = Zoom In, Down = Zoom Out)
            const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
            const newZoom = Math.min(4.0, Math.max(0.6, currentZoom * zoomFactor));
            
            setZoomLevel(newZoom);
        }, { passive: false });

        // Double click to reset position & zoom
        stage.addEventListener('dblclick', (e) => {
            if (e.target.closest('.floating-control-center') || e.target.closest('.top-hud')) return;
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

    // 1. Draw Primary Seamless Highway-to-RingRoad Line (Zero Cut at Pin)
    pathMainLine.style.strokeDashoffset = lenMain * (1 - prog);
    if (pathMainGlow) pathMainGlow.style.strokeDashoffset = lenMain * (1 - prog);

    // 2. Animate North Arm (Mathurawala) simultaneously when reaching placemark
    if (pathNorthLine && pathNorthGlow) {
        const lenNorth = pathNorthLine.getTotalLength();
        if (prog > 0.35) {
            const northProg = Math.min((prog - 0.35) / 0.35, 1);
            pathNorthLine.style.strokeDashoffset = lenNorth * (1 - northProg);
            pathNorthGlow.style.strokeDashoffset = lenNorth * (1 - northProg);
        } else {
            pathNorthLine.style.strokeDashoffset = lenNorth;
            pathNorthGlow.style.strokeDashoffset = lenNorth;
        }
    }

    // 3. Animate Lower Branch & Loop when approaching Ring Road
    if (pathLowerBranchLine && pathLowerBranchGlow) {
        const lenBranch = pathLowerBranchLine.getTotalLength();
        if (prog > 0.65) {
            const branchProg = Math.min((prog - 0.65) / 0.35, 1);
            pathLowerBranchLine.style.strokeDashoffset = lenBranch * (1 - branchProg);
            pathLowerBranchGlow.style.strokeDashoffset = lenBranch * (1 - branchProg);
        } else {
            pathLowerBranchLine.style.strokeDashoffset = lenBranch;
            pathLowerBranchGlow.style.strokeDashoffset = lenBranch;
        }
    }

    if (pathLowerLoopLine && pathLowerLoopGlow) {
        const lenLoop = pathLowerLoopLine.getTotalLength();
        if (prog > 0.75) {
            const loopProg = Math.min((prog - 0.75) / 0.25, 1);
            pathLowerLoopLine.style.strokeDashoffset = lenLoop * (1 - loopProg);
            pathLowerLoopGlow.style.strokeDashoffset = lenLoop * (1 - loopProg);
        } else {
            pathLowerLoopLine.style.strokeDashoffset = lenLoop;
            pathLowerLoopGlow.style.strokeDashoffset = lenLoop;
        }
    }

    // 4. Vehicle Head Position along Main Track (Clean Circular Bead)
    const dronePt = pathMainLine.getPointAtLength(currentLen);
    if (singleDroneNode) {
        singleDroneNode.setAttribute('transform', `translate(${dronePt.x}, ${dronePt.y})`);
    }

    // 5. Telemetry Updates
    const scrubberFill = document.getElementById('scrubber-fill');
    const scrubPct = document.getElementById('scrub-pct');
    const telemetryDist = document.getElementById('telemetry-dist');
    const navDistRem = document.getElementById('nav-dist-rem');

    if (scrubberFill) scrubberFill.style.width = `${prog * 100}%`;
    if (scrubPct) scrubPct.textContent = `${Math.round(prog * 100)}%`;

    const distTraveled = (prog * 1.45).toFixed(2);
    const distRemain = ((1 - prog) * 1450).toFixed(0);
    if (telemetryDist) telemetryDist.textContent = `${distTraveled} / 1.45 km`;
    if (navDistRem) navDistRem.textContent = `${distRemain} m`;

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
