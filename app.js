/**
 * THE DEEP — Ocean Descent Experience
 */

// ============================================
// SAFARI DETECTION
// ============================================

const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
if (isSafari) {
    document.documentElement.classList.add('is-safari');
}

// ============================================
// STATE
// ============================================

const state = {
    currentDepth: 0,
    smoothDepth: 0,
    maxDepth: 4500, // Final depth at bottom
    currentZone: 'sunlight',
    discoveredCreatures: new Set(),
    maxDepthReached: 0,
    soundEnabled: false,
    scrollVelocity: 0,
    lastScrollTop: 0,
    mouseX: 0.5,
    mouseY: 0.5,
    eventsPlayed: new Set()
};

// Zone config
const zones = {
    sunlight: { name: 'Sunlight Zone', depthRange: [0, 200], video: 0 },
    twilight: { name: 'Twilight Zone', depthRange: [200, 1000], video: 1 },
    midnight: { name: 'Midnight Zone', depthRange: [1000, 4000], video: 2 },
    abyss: { name: 'The Abyss', depthRange: [4000, 4500], video: 3 }
};

// Environmental data - Scientific measurements
// Light: % of surface sunlight (0% = aphotic zone, no photosynthesis possible)
// Temperature: °C (varies by location, using average deep ocean thermocline)
// Pressure: atmospheres (1 atm per 10m depth)
const envData = {
    0: { light: 100, temp: 26, pressure: 1 },     // Surface: Full sunlight, warm tropical water
    10: { light: 45, temp: 25, pressure: 2 },     // 10m: Significant light
    50: { light: 10, temp: 22, pressure: 6 },     // 50m: 10% light (euphotic limit)
    100: { light: 1, temp: 18, pressure: 11 },    // 100m: 1% light (disphotic begins)
    200: { light: 0, temp: 12, pressure: 21 },    // 200m: Aphotic zone starts - TOTAL DARKNESS
    500: { light: 0, temp: 7, pressure: 51 },     // 500m: Cold
    1000: { light: 0, temp: 4, pressure: 101 },   // 1000m: Very cold, 100+ atm
    2000: { light: 0, temp: 2, pressure: 201 },   // 2000m: Near-freezing
    3000: { light: 0, temp: 1.5, pressure: 301 }, // 3000m: Almost freezing
    4000: { light: 0, temp: 1, pressure: 401 },   // 4000m: Abyss - barely above freezing
    4500: { light: 0, temp: 0.5, pressure: 451 }  // 4500m: Deep abyss - near 0°C
};

// Depth events
const depthEvents = {
    350: { video: 'assets/events/whale-passing.mp4', duration: 6000 },
    1800: { video: 'assets/events/jellyfish-bloom.mp4', duration: 5000 }
};

// Creatures
const creatures = {
    'clownfish': { name: 'Clownfish', latin: 'Amphiprioninae', depth: 15, image: 'assets/creatures/clownfish.png' },
    'sea-turtle': { name: 'Green Sea Turtle', latin: 'Chelonia mydas', depth: 45, image: 'assets/creatures/sea-turtle.png' },
    'manta-ray': { name: 'Manta Ray', latin: 'Mobula birostris', depth: 80, image: 'assets/creatures/manta-ray.png' },
    'dolphin': { name: 'Bottlenose Dolphin', latin: 'Tursiops truncatus', depth: 150, image: 'assets/creatures/dolphin.png' },
    'humpback': { name: 'Humpback Whale', latin: 'Megaptera novaeangliae', depth: 300, image: 'assets/creatures/humpback.png' },
    'giant-squid': { name: 'Giant Squid', latin: 'Architeuthis dux', depth: 500, image: 'assets/creatures/giant-squid.png' },
    'lanternfish': { name: 'Lanternfish', latin: 'Myctophidae', depth: 700, image: 'assets/creatures/lanternfish.png' },
    'swordfish': { name: 'Swordfish', latin: 'Xiphias gladius', depth: 900, image: 'assets/creatures/swordfish.png' },
    'anglerfish': { name: 'Anglerfish', latin: 'Lophiiformes', depth: 1500, image: 'assets/creatures/anglerfish.png' },
    'jellyfish': { name: 'Deep Sea Jellyfish', latin: 'Atolla wyvillei', depth: 2000, image: 'assets/creatures/jellyfish.png' },
    'vampire-squid': { name: 'Vampire Squid', latin: 'Vampyroteuthis infernalis', depth: 2800, image: 'assets/creatures/vampire-squid.png' },
    'giant-isopod': { name: 'Giant Isopod', latin: 'Bathynomus giganteus', depth: 3500, image: 'assets/creatures/giant-isopod.png' }
};

// ============================================
// DOM
// ============================================

const el = {
    depthFill: document.getElementById('depthFill'),
    depthMarker: document.getElementById('depthMarker'),
    depthNumber: document.getElementById('depthNumber'),
    zoneName: document.getElementById('zoneName'),
    envLight: document.getElementById('envLight'),
    envTemp: document.getElementById('envTemp'),
    envPressure: document.getElementById('envPressure'),
    discoveredCount: document.getElementById('discoveredCount'),
    scrollHint: document.getElementById('scrollHint'),
    videoLayers: document.querySelectorAll('.video-layer'),
    eventLayer: document.getElementById('eventLayer'),
    eventVideo: document.getElementById('eventVideo'),
    depthOverlay: document.getElementById('depthOverlay'),
    abyssDarkness: document.getElementById('abyssDarkness'),
    lightRays: document.getElementById('lightRays'),
    particles: document.getElementById('particles'),
    discoveryFlash: document.getElementById('discoveryFlash'),
    zoneSections: document.querySelectorAll('.zone-section'),
    creatures: document.querySelectorAll('.creature'),
    journalBtn: document.getElementById('journalBtn'),
    journalModal: document.getElementById('journalModal'),
    journalClose: document.getElementById('journalClose'),
    journalEntries: document.getElementById('journalEntries'),
    journalDepth: document.getElementById('journalDepth'),
    journalSpecies: document.getElementById('journalSpecies'),
    soundBtn: document.getElementById('soundBtn'),
    soundHint: document.getElementById('soundHint'),
    audioBubbles: document.getElementById('audioBubbles'),
    audioMoreBubbles: document.getElementById('audioMoreBubbles'),
    audioDeep: document.getElementById('audioDeep'),
    audioWhalePassing: document.getElementById('audioWhalePassing'),
    finalDepth: document.getElementById('finalDepth'),
    finalSpecies: document.getElementById('finalSpecies'),
    ascendBtn: document.getElementById('ascendBtn')
};

// ============================================
// SCROLL & DEPTH - ZONE-BASED MAPPING
// ============================================

let zoneBoundaries = [];

function calculateZoneBoundaries() {
    zoneBoundaries = [];
    const sections = document.querySelectorAll('.zone-section');
    const introSection = document.querySelector('.intro-section');
    const introEnd = introSection ? introSection.offsetTop + introSection.offsetHeight : 0;
    
    sections.forEach(section => {
        const zone = section.dataset.zone;
        if (zone && zones[zone]) {
            zoneBoundaries.push({
                zone: zone,
                start: section.offsetTop,
                end: section.offsetTop + section.offsetHeight,
                depthStart: zones[zone].depthRange[0],
                depthEnd: zones[zone].depthRange[1]
            });
        }
    });
}

function getDepthFromScroll(scrollY) {
    if (zoneBoundaries.length === 0) return 0;
    
    // Before first zone - still at 0
    const firstZone = zoneBoundaries[0];
    if (scrollY < firstZone.start) {
        return 0;
    }
    
    // Find which zone we're in
    for (const boundary of zoneBoundaries) {
        if (scrollY >= boundary.start && scrollY < boundary.end) {
            // Calculate progress through this zone
            const zoneProgress = (scrollY - boundary.start) / (boundary.end - boundary.start);
            const depth = boundary.depthStart + zoneProgress * (boundary.depthEnd - boundary.depthStart);
            return Math.round(Math.max(0, depth));
        }
    }
    
    // Past last zone
    const lastZone = zoneBoundaries[zoneBoundaries.length - 1];
    return lastZone.depthEnd;
}

function initScrollTracking() {
    // Calculate zone boundaries after DOM is ready
    setTimeout(calculateZoneBoundaries, 100);
    window.addEventListener('resize', calculateZoneBoundaries);
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        state.currentDepth = getDepthFromScroll(scrollY);
        state.scrollVelocity = Math.abs(scrollY - state.lastScrollTop);
        state.lastScrollTop = scrollY;
        
        if (state.currentDepth > state.maxDepthReached) {
            state.maxDepthReached = state.currentDepth;
        }
        
        if (scrollY > 100) {
            el.scrollHint.classList.add('hidden');
        }
    }, { passive: true });
    
    // Smooth animation loop
    smoothLoop();
}

function smoothLoop() {
    state.smoothDepth += (state.currentDepth - state.smoothDepth) * 0.1;
    
    updateDepthUI();
    updateZone();
    updateVisualEffects();
    updateAudio();
    checkZoneSections();
    checkDepthEvents();
    updateFinalStats();
    
    requestAnimationFrame(smoothLoop);
}

function updateDepthUI() {
    const displayDepth = Math.round(state.smoothDepth);
    const progress = Math.min(state.smoothDepth / state.maxDepth, 1);
    
    el.depthFill.style.height = `${progress * 100}%`;
    el.depthMarker.style.top = `${progress * 100}%`;
    el.depthNumber.textContent = displayDepth.toLocaleString();
}

// ============================================
// ZONE MANAGEMENT
// ============================================

function updateZone() {
    // Determine zone from scroll position, not calculated depth
    const scrollY = window.scrollY;
    let newZone = 'sunlight';
    
    for (const boundary of zoneBoundaries) {
        if (scrollY >= boundary.start && scrollY < boundary.end) {
            newZone = boundary.zone;
            break;
        }
    }
    
    // If past all zones, use last zone
    if (zoneBoundaries.length > 0 && scrollY >= zoneBoundaries[zoneBoundaries.length - 1].start) {
        newZone = zoneBoundaries[zoneBoundaries.length - 1].zone;
    }
    
    if (newZone !== state.currentZone) {
        state.currentZone = newZone;
        el.zoneName.textContent = zones[newZone].name;
        switchVideoLayer(zones[newZone].video);
        
        // Special handling for abyss - ensure video plays
        if (newZone === 'abyss') {
            const abyssLayer = el.videoLayers[3];
            if (abyssLayer) {
                const video = abyssLayer.querySelector('video');
                if (video) {
                    video.currentTime = 0;
                    video.play().catch(() => {});
                }
            }
        }
    }
}

function switchVideoLayer(index) {
    el.videoLayers.forEach((layer, i) => {
        const videos = layer.querySelectorAll('video');
        if (i === index) {
            layer.classList.add('active');
            // Ensure videos play - slight delay for Safari
            setTimeout(() => {
                videos.forEach(v => {
                    v.play().catch(() => {});
                });
            }, isSafari ? 100 : 0);
        } else {
            layer.classList.remove('active');
            // Safari optimization: pause inactive videos to reduce load
            if (isSafari) {
                setTimeout(() => {
                    if (!layer.classList.contains('active')) {
                        videos.forEach(v => v.pause());
                    }
                }, 500);
            }
        }
    });
}

// ============================================
// PARALLAX - REMOVED (was causing flickering)
// ============================================

function initMouseTracking() {
    // Disabled - mouse tracking was causing performance issues
}

function updateParallax() {
    // Disabled - parallax was causing flickering
}

// ============================================
// ENVIRONMENTAL DATA
// ============================================

function updateEnvironmentalData() {
    const depth = Math.round(state.smoothDepth);
    const data = interpolateEnvData(depth);
    
    // Light - show "None" when 0%
    if (el.envLight) {
        if (data.light <= 0) {
            el.envLight.textContent = 'None';
        } else if (data.light < 1) {
            el.envLight.textContent = '<1%';
        } else {
            el.envLight.textContent = `${Math.round(data.light)}%`;
        }
    }
    
    // Temperature - show decimals for cold temps to convey severity
    if (el.envTemp) {
        const temp = data.temp;
        if (temp <= 5) {
            el.envTemp.textContent = `${temp.toFixed(1)}°C`;
        } else {
            el.envTemp.textContent = `${Math.round(temp)}°C`;
        }
    }
    
    if (el.envPressure) el.envPressure.textContent = `${Math.round(data.pressure)} atm`;
}

function interpolateEnvData(depth) {
    const depths = Object.keys(envData).map(Number).sort((a, b) => a - b);
    let lower = depths[0], upper = depths[depths.length - 1];
    
    for (let i = 0; i < depths.length - 1; i++) {
        if (depth >= depths[i] && depth < depths[i + 1]) {
            lower = depths[i];
            upper = depths[i + 1];
            break;
        }
    }
    
    if (depth >= upper) return envData[upper];
    
    const t = (depth - lower) / (upper - lower);
    return {
        light: envData[lower].light + (envData[upper].light - envData[lower].light) * t,
        temp: envData[lower].temp + (envData[upper].temp - envData[lower].temp) * t,
        pressure: envData[lower].pressure + (envData[upper].pressure - envData[lower].pressure) * t
    };
}

// ============================================
// VISUAL EFFECTS
// ============================================

function updateVisualEffects() {
    const currentLight = interpolateEnvData(state.smoothDepth).light;
    const depth = state.smoothDepth;
    
    // Darkness overlay - SUNLIGHT ZONE STAYS BRIGHT (0-200m)
    let darknessOpacity = 0;
    if (depth >= 200) {
        // Twilight zone: gradual darkening (200-1000m)
        if (depth < 1000) {
            darknessOpacity = ((depth - 200) / 800) * 0.7; // 0 to 0.7
        }
        // Midnight zone: very dark (1000-4000m)
        else if (depth < 4000) {
            darknessOpacity = 0.7 + ((depth - 1000) / 3000) * 0.2; // 0.7 to 0.9
        }
        // Abyss: near total darkness
        else {
            darknessOpacity = 0.9 + ((depth - 4000) / 500) * 0.08; // 0.9 to 0.98
        }
    }
    el.depthOverlay.style.opacity = darknessOpacity;
    
    // Light rays - visible in sunlight zone, fade through twilight
    let rayOpacity = 1;
    if (depth > 100) {
        rayOpacity = Math.max(1 - ((depth - 100) / 400), 0); // Fade from 100m to 500m
    }
    el.lightRays.style.opacity = rayOpacity;
    
    // Color temperature shift (warm surface → cold deep)
    const warmth = Math.max(1 - (depth / 1000), 0);
    document.documentElement.style.setProperty('--depth-warmth', warmth);
    
    // Abyss - keep video visible, no extra darkness
    if (el.abyssDarkness) {
        el.abyssDarkness.style.background = 'transparent';
    }
}

// ============================================
// DEPTH EVENTS
// ============================================

function checkDepthEvents() {
    for (const [triggerDepth, event] of Object.entries(depthEvents)) {
        const depth = Number(triggerDepth);
        if (Math.abs(state.smoothDepth - depth) < 40 && !state.eventsPlayed.has(depth)) {
            playDepthEvent(event, depth);
        }
    }
}

function playDepthEvent(event, depth) {
    state.eventsPlayed.add(depth);
    
    fetch(event.video, { method: 'HEAD' })
        .then(res => {
            if (res.ok) {
                el.eventVideo.src = event.video;
                el.eventLayer.classList.add('active');
                el.eventVideo.play().catch(() => {});
                
                // Play whale audio for whale event
                if (depth === 350 && el.audioWhalePassing && state.soundEnabled) {
                    el.audioWhalePassing.currentTime = 0;
                    el.audioWhalePassing.volume = 0.5;
                    el.audioWhalePassing.play().catch(() => {});
                }
                
                setTimeout(() => el.eventLayer.classList.remove('active'), event.duration);
            }
        })
        .catch(() => {});
}

// ============================================
// PARTICLES
// ============================================

let particleCtx, particlesList = [];

function initParticles() {
    particleCtx = el.particles.getContext('2d');
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Fewer particles on Safari for performance
    const particleCount = isSafari ? 15 : 40;
    for (let i = 0; i < particleCount; i++) particlesList.push(createParticle());
    animateParticles();
}

function resizeCanvas() {
    el.particles.width = window.innerWidth;
    el.particles.height = window.innerHeight;
}

function createParticle() {
    return {
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        size: Math.random() * 2 + 0.5,
        speedY: Math.random() * -0.3 - 0.1,
        speedX: (Math.random() - 0.5) * 0.1,
        opacity: Math.random() * 0.3 + 0.1,
        pulse: Math.random() * Math.PI * 2
    };
}

let lastParticleFrame = 0;
const particleFrameInterval = isSafari ? 2 : 1; // Safari: skip every other frame

function animateParticles() {
    lastParticleFrame++;
    
    // Safari: only render every 2nd frame for performance
    if (isSafari && lastParticleFrame % particleFrameInterval !== 0) {
        requestAnimationFrame(animateParticles);
        return;
    }
    
    particleCtx.clearRect(0, 0, el.particles.width, el.particles.height);
    
    const ratio = state.smoothDepth / state.maxDepth;
    
    let r, g, b;
    if (ratio < 0.05) { r = 255; g = 255; b = 255; }
    else if (ratio < 0.2) { r = 180; g = 210; b = 255; }
    else if (ratio < 0.5) { r = 0; g = 245; b = 212; }
    else { r = 180; g = 100; b = 255; }
    
    particlesList.forEach(p => {
        p.y += p.speedY;
        p.x += p.speedX;
        p.pulse += 0.01;
        
        if (p.y < -10) { p.y = el.particles.height + 10; p.x = Math.random() * el.particles.width; }
        
        const pulseFactor = Math.sin(p.pulse) * 0.2 + 0.8;
        
        particleCtx.beginPath();
        particleCtx.arc(p.x, p.y, p.size * pulseFactor, 0, Math.PI * 2);
        particleCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${p.opacity * pulseFactor})`;
        particleCtx.fill();
    });
    
    requestAnimationFrame(animateParticles);
}

// ============================================
// ZONE VISIBILITY
// ============================================

function checkZoneSections() {
    el.zoneSections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight * 0.6 && rect.bottom > 0) {
            section.classList.add('in-view');
        }
    });
    
    // Show final section when near bottom
    const finalSection = document.querySelector('.final-section');
    if (finalSection && state.smoothDepth >= 4300) {
        finalSection.style.opacity = '1';
        finalSection.style.visibility = 'visible';
    }
}

// ============================================
// CREATURE DISCOVERY
// ============================================

// Mobile detection
const isMobile = () => window.innerWidth <= 768;

// Mobile modal elements
const creatureModal = document.getElementById('creatureModal');
const creatureModalContent = document.getElementById('creatureModalContent');
const creatureModalClose = document.getElementById('creatureModalClose');

function initCreatureDiscovery() {
    el.creatures.forEach(creature => {
        const id = creature.dataset.creature;
        
        // Desktop: show card on hover
        creature.addEventListener('mouseenter', () => {
            discoverCreature(id, creature);
        });
        
        // Click/tap handler
        creature.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            discoverCreature(id, creature);
            
            // On mobile, open modal
            if (isMobile()) {
                openCreatureModal(id);
            }
        });
    });
    
    // Close modal handlers
    if (creatureModalClose) {
        creatureModalClose.addEventListener('click', closeCreatureModal);
    }
    
    if (creatureModal) {
        creatureModal.addEventListener('click', (e) => {
            if (e.target === creatureModal) {
                closeCreatureModal();
            }
        });
    }
}

function openCreatureModal(id) {
    const data = creatures[id];
    if (!data || !creatureModal || !creatureModalContent) return;
    
    const zoneLabel = data.depth < 200 ? 'Sunlight Zone' : 
                      data.depth < 1000 ? 'Twilight Zone' : 
                      data.depth < 4000 ? 'Midnight Zone' : 'The Abyss';
    
    creatureModalContent.innerHTML = `
        <div class="modal-image">
            <img src="${data.image}" alt="${data.name}">
        </div>
        <div class="modal-info">
            <h3>${data.name}</h3>
            <p class="modal-latin">${data.latin}</p>
            <p class="modal-fact">${getCreatureFact(id)}</p>
            <span class="modal-depth">${data.depth}m · ${zoneLabel}</span>
        </div>
    `;
    
    creatureModal.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeCreatureModal() {
    if (creatureModal) {
        creatureModal.classList.remove('open');
        document.body.style.overflow = '';
    }
}

function getCreatureFact(id) {
    const facts = {
        'clownfish': 'Lives symbiotically within sea anemones, immune to their stinging tentacles.',
        'sea-turtle': 'Can hold their breath for up to 7 hours while sleeping underwater.',
        'manta-ray': 'Has the largest brain-to-body ratio of any fish, showing signs of self-awareness.',
        'dolphin': 'Sleeps with one eye open and half their brain awake to watch for predators.',
        'humpback': 'Their songs can travel up to 10,000 miles through the ocean.',
        'giant-squid': 'Has the largest eyes in the animal kingdom—the size of dinner plates.',
        'lanternfish': 'The most abundant fish in the ocean, creating the largest animal migration daily.',
        'swordfish': 'Can heat their eyes and brain to hunt in cold depths.',
        'anglerfish': 'Males fuse permanently to females, sharing blood and nutrients for life.',
        'jellyfish': 'Creates bioluminescent displays to confuse predators in the darkness.',
        'vampire-squid': 'Feeds on "marine snow"—falling organic debris from above.',
        'giant-isopod': 'Can survive over 5 years without eating. Related to the common woodlouse.'
    };
    return facts[id] || 'A mysterious creature of the deep.';
}

function discoverCreature(id, element) {
    if (state.discoveredCreatures.has(id)) return;
    
    state.discoveredCreatures.add(id);
    element.classList.add('discovered');
    
    el.discoveredCount.textContent = state.discoveredCreatures.size;
    el.discoveredCount.classList.add('bump');
    setTimeout(() => el.discoveredCount.classList.remove('bump'), 400);
    
    el.discoveryFlash.classList.add('active');
    setTimeout(() => el.discoveryFlash.classList.remove('active'), 600);
    
    if (state.soundEnabled) {
        el.audioDiscover.currentTime = 0;
        el.audioDiscover.volume = 0.2;
        el.audioDiscover.play().catch(() => {});
    }
    
    updateJournal();
}

// ============================================
// JOURNAL
// ============================================

function initJournal() {
    el.journalBtn.addEventListener('click', openJournal);
    el.journalClose.addEventListener('click', closeJournal);
    el.journalModal.addEventListener('click', (e) => { if (e.target === el.journalModal) closeJournal(); });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeJournal();
        if (e.key === 'j' && !e.metaKey && !e.ctrlKey) {
            el.journalModal.classList.contains('open') ? closeJournal() : openJournal();
        }
    });
}

function openJournal() {
    el.journalModal.classList.add('open');
    document.body.style.overflow = 'hidden';
    updateJournalStats();
    updateJournal();
}

function closeJournal() {
    el.journalModal.classList.remove('open');
    document.body.style.overflow = '';
}

function updateJournalStats() {
    el.journalDepth.textContent = state.maxDepthReached.toLocaleString();
    el.journalSpecies.textContent = state.discoveredCreatures.size;
}

function updateJournal() {
    if (state.discoveredCreatures.size === 0) {
        el.journalEntries.innerHTML = `<div class="journal-empty"><p>No species discovered yet.</p><p class="journal-empty-hint">Hover over glowing markers to discover creatures.</p></div>`;
        return;
    }
    
    const sorted = Array.from(state.discoveredCreatures).sort((a, b) => creatures[a].depth - creatures[b].depth);
    el.journalEntries.innerHTML = sorted.map((id, index) => {
        const c = creatures[id];
        const zoneLabel = c.depth < 200 ? 'Sunlight' : c.depth < 1000 ? 'Twilight' : c.depth < 4000 ? 'Midnight' : 'Abyss';
        return `
            <div class="journal-entry" style="animation-delay: ${index * 0.05}s">
                <div class="journal-entry-image">
                    <img src="${c.image}" alt="${c.name}">
                </div>
                <div class="journal-entry-info">
                    <h4>${c.name}</h4>
                    <p><em>${c.latin}</em></p>
                    <span class="journal-entry-depth">${c.depth}m · ${zoneLabel} Zone</span>
                </div>
            </div>
        `;
    }).join('');
    
    updateJournalStats();
}

// ============================================
// FINAL STATS
// ============================================

function updateFinalStats() {
    if (el.finalDepth) el.finalDepth.textContent = state.maxDepthReached.toLocaleString();
    if (el.finalSpecies) el.finalSpecies.textContent = state.discoveredCreatures.size;
}

// ============================================
// AUDIO
// ============================================

function initAudio() {
    if (!el.soundBtn) return;
    
    el.soundBtn.addEventListener('click', toggleSound);
    el.soundBtn.classList.add('muted');
    
    // Clicking the hint also enables sound
    if (el.soundHint) {
        el.soundHint.addEventListener('click', toggleSound);
    }
    
    // Set all volumes to 0 initially
    const audioElements = [el.audioBubbles, el.audioMoreBubbles, el.audioDeep];
    audioElements.forEach(audio => {
        if (audio) audio.volume = 0;
    });
}

function toggleSound() {
    state.soundEnabled = !state.soundEnabled;
    el.soundBtn.classList.toggle('muted', !state.soundEnabled);
    
    // Hide and remove the hint once sound is interacted with
    if (el.soundHint && !el.soundHint.classList.contains('hidden')) {
        el.soundHint.classList.add('hidden');
        setTimeout(() => {
            if (el.soundHint && el.soundHint.parentNode) {
                el.soundHint.parentNode.removeChild(el.soundHint);
            }
        }, 500);
    }
    
    const loopingAudio = [el.audioBubbles, el.audioMoreBubbles, el.audioDeep];
    
    if (state.soundEnabled) {
        loopingAudio.forEach(audio => {
            if (audio) {
                audio.play().catch(err => console.log('Audio play error:', err));
            }
        });
        updateAudio();
    } else {
        loopingAudio.forEach(audio => {
            if (audio) audio.pause();
        });
        if (el.audioWhalePassing) el.audioWhalePassing.pause();
    }
}

function updateAudio() {
    if (!state.soundEnabled) return;
    
    const depth = state.smoothDepth;
    
    // BUBBLES (0-500m): Sunlight zone, fades into twilight
    // Full volume at surface, fades out by 500m
    if (el.audioBubbles) {
        const vol = Math.max(0.4 * (1 - depth / 500), 0);
        el.audioBubbles.volume = vol;
    }
    
    // MORE BUBBLES (100-1500m): Twilight zone ambience
    // Fades in from 100m, full at 300m, fades out by 1500m
    if (el.audioMoreBubbles) {
        let vol = 0;
        if (depth > 100 && depth < 1500) {
            if (depth < 300) {
                vol = ((depth - 100) / 200) * 0.3;
            } else if (depth < 1000) {
                vol = 0.3;
            } else {
                vol = 0.3 * (1 - (depth - 1000) / 500);
            }
        }
        el.audioMoreBubbles.volume = Math.max(vol, 0);
    }
    
    // DEEP LOW SOUND (800m+): Midnight and Abyss zones
    // Fades in from 800m, full at 1500m, stays for abyss
    if (el.audioDeep) {
        let vol = 0;
        if (depth > 800) {
            if (depth < 1500) {
                vol = ((depth - 800) / 700) * 0.35;
            } else {
                vol = 0.35;
            }
        }
        el.audioDeep.volume = vol;
    }
}

// ============================================
// ACTIONS
// ============================================

function initActions() {
    el.ascendBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ============================================
// VIDEOS
// ============================================

function initVideos() {
    el.videoLayers[0].classList.add('active');
    el.videoLayers.forEach((layer, i) => {
        layer.querySelectorAll('video').forEach(v => {
            v.load();
            v.addEventListener('error', () => v.style.display = 'none');
        });
        if (i === 0) layer.querySelectorAll('video').forEach(v => v.play().catch(() => {}));
    });
}

// ============================================
// INIT
// ============================================

function init() {
    initVideos();
    initMouseTracking();
    initScrollTracking();
    initParticles();
    initCreatureDiscovery();
    initJournal();
    initAudio();
    initActions();
    
    console.log('The Deep — Scroll to descend, hover on glowing markers to discover species.');
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
