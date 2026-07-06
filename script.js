/* ================================================
   GAISHA YUSYA DWITHA — Birthday Page · script.js
   ================================================ */

// ── DOM REFS ──────────────────────────────────
const particlesEl       = document.getElementById('particles');
const ringsBg           = document.getElementById('ringsBg');
const confettiContainer = document.getElementById('confettiContainer');
const fireworksCanvas   = document.getElementById('fireworksCanvas');
const ctx               = fireworksCanvas.getContext('2d');
const micStatus         = document.getElementById('micStatus');
const micIcon           = document.getElementById('micIcon');
const micText           = document.getElementById('micText');
const blowMeterWrap     = document.getElementById('blowMeterWrap');
const blowMeterFill     = document.getElementById('blowMeterFill');
const blowMeterLabel    = document.getElementById('blowMeterLabel');
const flameOuter        = document.getElementById('svgCandleGroup');
const smokeContainer    = document.getElementById('svgSmokeGroup');
const birthdayMessage   = document.getElementById('birthdayMessage');
const letterSection     = document.getElementById('letterSection');
const bgMusic           = document.getElementById('bgMusic');
const musicBtn          = document.getElementById('musicBtn');
const musicIcon         = document.getElementById('musicIcon');
const musicControls     = document.getElementById('musicControls');
const preciousSection   = document.getElementById('preciousSection');
const preciousBtnLink   = document.getElementById('preciousBtn');
const envelope          = document.getElementById('envelope');
const letterOverlay     = document.getElementById('letterOverlay');
const letterClose       = document.getElementById('letterClose');
const introScreen       = document.getElementById('introScreen');
const startBtn          = document.getElementById('startBtn');
const curtainLeft       = document.getElementById('curtainLeft');
const curtainRight      = document.getElementById('curtainRight');
const sparkleBurst      = document.getElementById('sparkleBurst');
const mainWrapper       = document.querySelector('.main-wrapper');

// ── STATE ─────────────────────────────────────
let candleBlown       = false;
let micActive         = false;
let audioContext      = null;
let analyser          = null;
let micStream         = null;
let animFrameId       = null;
let fireworksActive   = false;
let fireworkParticles = [];
let musicPlaying      = false;
let firstInteraction  = false;
let iosAudioUnlocked  = false;
let appStarted        = false;

// Catatan: "precious memories for me" sekarang membuka HALAMAN TERPISAH
// (precious.html) — bukan lagi modal overlay. Tombolnya berupa <a href="precious.html">
// biasa di index.html, jadi tidak butuh JS khusus di sini selain memunculkan
// section-nya setelah lilin ditiup (lihat blowOutCandle()).



// ── PARTICLES ────────────────────────────────
function createParticles() {
  const colors = ['#4a90d9','#6aaee8','#a8d0f5','#2d5494','#c9a96e','#1e3560'];
  const count  = window.innerWidth < 480 ? 14 : 24;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 5 + 2;
    const sway = (Math.random() - 0.5) * 140;
    p.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      --dur:${(Math.random()*9+7).toFixed(1)}s;
      --delay:${(Math.random()*12).toFixed(1)}s;
      --sway:${sway}px;
    `;
    particlesEl.appendChild(p);
  }
}

// ── AMBIENT RINGS ─────────────────────────────
function createRings() {
  const sizes = [300, 480, 660, 860, 1060];
  sizes.forEach((s, i) => {
    const ring = document.createElement('div');
    ring.className = 'ring';
    ring.style.cssText = `
      width:${s}px; height:${s}px;
      top:50%; left:50%;
      transform:translate(-50%,-50%);
      --rd:${8 + i * 2}s;
      --rdelay:${i * 1.2}s;
    `;
    ringsBg.appendChild(ring);
  });
}

// ── FIREWORKS ────────────────────────────────
function resizeCanvas() {
  fireworksCanvas.width  = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

class FireworkParticle {
  constructor(x, y) {
    this.x = x; this.y = y;
    const ang = Math.random() * Math.PI * 2;
    const spd = Math.random() * 5 + 2;
    this.vx = Math.cos(ang) * spd;
    this.vy = Math.sin(ang) * spd;
    this.life = 1;
    this.decay = Math.random() * 0.018 + 0.01;
    this.size = Math.random() * 3.5 + 1.5;
    const palette = ['#4a90d9','#6aaee8','#a8d0f5','#c9a96e','#ffffff','#2d5494','#e8c98a'];
    this.color = palette[Math.floor(Math.random() * palette.length)];
    this.trail = [];
  }
  update() {
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();
    this.vy += 0.065; this.vx *= 0.98;
    this.x += this.vx; this.y += this.vy;
    this.life -= this.decay;
  }
  draw() {
    this.trail.forEach((pt, i) => {
      const alpha = (i / this.trail.length) * this.life * 0.4;
      ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = this.color;
      ctx.beginPath(); ctx.arc(pt.x, pt.y, this.size * 0.4, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    });
    ctx.save(); ctx.globalAlpha = this.life; ctx.fillStyle = this.color;
    ctx.shadowBlur = 7; ctx.shadowColor = this.color;
    ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
}

let fwTimer = 0;
function launchFirework() {
  const x = Math.random() * fireworksCanvas.width;
  const y = Math.random() * fireworksCanvas.height * 0.55;
  const count = window.innerWidth < 480 ? 50 : 80;
  for (let i = 0; i < count; i++) fireworkParticles.push(new FireworkParticle(x, y));
}
function updateFireworks() {
  if (!fireworksActive) return;
  ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
  fwTimer++;
  if (fwTimer % 30 === 0) launchFirework();
  fireworkParticles = fireworkParticles.filter(p => p.life > 0);
  fireworkParticles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(updateFireworks);
}
function startFireworks() {
  fireworksActive = true;
  launchFirework(); launchFirework();
  updateFireworks();
  setTimeout(() => {
    fireworksActive = false;
    setTimeout(() => ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height), 1800);
  }, 12000);
}

// ── CONFETTI ─────────────────────────────────
function launchConfetti() {
  const colors = ['#4a90d9','#6aaee8','#a8d0f5','#c9a96e','#e8c98a','#ffffff','#2d5494'];
  const count  = window.innerWidth < 480 ? 70 : 130;
  spawnConfetti(count, colors);
  setTimeout(() => spawnConfetti(Math.floor(count * 0.6), colors), 1000);
  setTimeout(() => spawnConfetti(Math.floor(count * 0.4), colors), 2200);
}
function spawnConfetti(count, colors) {
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const sway = (Math.random() - 0.5) * 280;
    piece.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      width:${Math.random()*9+5}px;
      height:${Math.random()*13+7}px;
      border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
      --dur:${(Math.random()*2.5+2.5).toFixed(2)}s;
      --delay:${(Math.random()*1.5).toFixed(2)}s;
      --sway:${sway}px;
      transform:rotate(${Math.random()*360}deg);
    `;
    confettiContainer.appendChild(piece);
    piece.addEventListener('animationend', () => piece.remove());
  }
}

// ── BLOW OUT CANDLE ───────────────────────────
function blowOutCandle() {
  if (candleBlown) return;
  candleBlown = true;
  stopMic();

  // Extinguish
  flameOuter.classList.add('blown-out');

  // Smoke
  smokeContainer.style.display = 'block';
  requestAnimationFrame(() => { smokeContainer.style.opacity = '1'; });

  // Celebrate
  setTimeout(() => { launchConfetti(); startFireworks(); }, 350);

  // Show birthday msg + tombol precious memories
  setTimeout(() => {
    birthdayMessage.style.display = 'block';
    micStatus.style.display       = 'none';
    preciousSection.classList.add('visible');
  }, 1100);

  // Hide smoke
  setTimeout(() => {
    smokeContainer.style.opacity = '0';
    setTimeout(() => { smokeContainer.style.display = 'none'; }, 400);
  }, 4000);

  // Music
  if (!musicPlaying) tryPlayMusic();
  else bgMusic.volume = 1;

  // Simpan status "sudah merayakan" supaya kalau kembali dari precious.html
  // (atau reload di tab yang sama), halaman langsung skip ke tampilan akhir
  // tanpa mengulang intro & tiup lilin dari awal.
  try { sessionStorage.setItem('gaishaCelebrated', 'true'); } catch (e) {}
}

// ── MICROPHONE ────────────────────────────────
async function startMic() {
  if (micActive || candleBlown) return;
  try {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    });
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(micStream);
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    source.connect(analyser);

    micActive = true;
    micIcon.textContent = '🎙️';
    micStatus.classList.add('mic-active');
    micText.textContent = 'Mikrofon aktif! Tiup lilinnya sekarang 💨';
    blowMeterWrap.style.display = 'block';
    blowMeterLabel.textContent  = 'Tiup sekuat mungkin!';
    detectBlow();
  } catch (err) {
    micText.textContent = '⚠️ Mikrofon tidak bisa diakses. Ketuk lilinnya langsung!';
    micIcon.textContent = '⚠️';
    document.getElementById('svgCandleGroup').addEventListener('click', blowOutCandle, { once: true });
    document.getElementById('cakeArt').addEventListener('click', blowOutCandle, { once: true });
  }
}

const BLOW_THRESHOLD = 24;
const BLOW_SUSTAIN   = 180;
let blowSustainStart = null;

function detectBlow() {
  if (!analyser || candleBlown) return;
  const bufLen  = analyser.fftSize;
  const dataArr = new Uint8Array(bufLen);

  function loop() {
    if (candleBlown || !micActive) return;
    animFrameId = requestAnimationFrame(loop);
    analyser.getByteTimeDomainData(dataArr);

    let sum = 0;
    for (let i = 0; i < bufLen; i++) {
      const n = (dataArr[i] - 128) / 128;
      sum += n * n;
    }
    const rms   = Math.sqrt(sum / bufLen) * 100;
    const level = Math.min(rms, 100);
    blowMeterFill.style.width = level + '%';

    if (level > BLOW_THRESHOLD) {
      if (!blowSustainStart) blowSustainStart = Date.now();
      blowMeterLabel.textContent = `Teruskan! 💨 (${Math.round(level)}%)`;
      if (Date.now() - blowSustainStart >= BLOW_SUSTAIN) { blowOutCandle(); return; }
    } else {
      blowSustainStart = null;
      blowMeterLabel.textContent = level > 5
        ? `Lebih kuat! 💨 (${Math.round(level)}%)`
        : 'Tiup ke mikrofon HP kamu...';
    }
  }
  loop();
}

function stopMic() {
  micActive = false;
  if (animFrameId) cancelAnimationFrame(animFrameId);
  if (micStream)  micStream.getTracks().forEach(t => t.stop());
  if (audioContext) audioContext.close().catch(() => {});
  micStream = audioContext = analyser = null;
}

micStatus.addEventListener('click', () => {
  handleFirstInteraction();
  if (!candleBlown && !micActive) startMic();
});

// ── MUSIC (iOS Safari safe) ───────────────────
function unlockIOSAudio() {
  if (iosAudioUnlocked) return;
  iosAudioUnlocked = true;
  try {
    const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
    const buf = tmpCtx.createBuffer(1, 1, 22050);
    const src = tmpCtx.createBufferSource();
    src.buffer = buf; src.connect(tmpCtx.destination); src.start(0);
    tmpCtx.resume().catch(() => {});
  } catch(e) {}
}

function handleFirstInteraction() {
  if (firstInteraction) return;
  firstInteraction = true;
  unlockIOSAudio();
  tryPlayMusic();
}

function tryPlayMusic() {
  if (musicPlaying) return;
  bgMusic.muted  = false;
  bgMusic.volume = 0.55;
  const p = bgMusic.play();
  if (p !== undefined) {
    p.then(() => { musicPlaying = true; musicIcon.textContent = '⏸'; })
     .catch(() => {
       setTimeout(() => {
         bgMusic.play()
           .then(() => { musicPlaying = true; musicIcon.textContent = '⏸'; })
           .catch(() => {});
       }, 300);
     });
  }
}

// ── MUSIC HANDOFF ANTAR HALAMAN (index.html ⇄ precious.html) ──
// Supaya lagu terasa "menyambung" (tidak restart dari 0:00) saat pindah
// halaman, posisi & status main disimpan ke localStorage sebelum pindah,
// lalu dibaca lagi & dilanjutkan begitu halaman baru selesai dimuat.
const MUSIC_STATE_KEY = 'gaishaMusicState';

function saveMusicState() {
  try {
    localStorage.setItem(MUSIC_STATE_KEY, JSON.stringify({
      time: bgMusic.currentTime || 0,
      playing: musicPlaying,
      savedAt: Date.now()
    }));
  } catch (e) {}
}

function restoreMusicState() {
  let state = null;
  try { state = JSON.parse(localStorage.getItem(MUSIC_STATE_KEY)); } catch (e) {}
  if (!state) return;

  // Kalau state sudah lebih dari 15 detik yang lalu, anggap basi (tab lama
  // yang ditinggal), jangan dipakai supaya tidak melompat aneh.
  if (Date.now() - state.savedAt > 15000) return;

  const applyTime = () => {
    try { bgMusic.currentTime = state.time || 0; } catch (e) {}
  };
  if (bgMusic.readyState >= 1) applyTime();
  else bgMusic.addEventListener('loadedmetadata', applyTime, { once: true });

  if (state.playing) {
    firstInteraction = true;
    musicControls.classList.add('music-controls-visible');
    tryPlayMusic();
  }
}

// Simpan state tiap kali user pindah halaman (klik link precious/kembali,
// tutup tab, refresh, dsb).
window.addEventListener('pagehide', saveMusicState);
window.addEventListener('beforeunload', saveMusicState);
if (preciousBtnLink) preciousBtnLink.addEventListener('click', saveMusicState);

restoreMusicState();

// ── SPARKLE BURST (dari posisi tombol saat diklik) ────
function fireSparkleBurst(originX, originY) {
  sparkleBurst.style.left = originX + 'px';
  sparkleBurst.style.top  = originY + 'px';
  sparkleBurst.innerHTML = '';

  const count = window.innerWidth < 480 ? 22 : 34;
  for (let i = 0; i < count; i++) {
    const spark = document.createElement('div');
    spark.className = 'spark';
    const angle    = (i / count) * Math.PI * 2 + (Math.random() * 0.4 - 0.2);
    const distance = Math.random() * 220 + 80;
    const sx = Math.cos(angle) * distance;
    const sy = Math.sin(angle) * distance;
    const dur   = (Math.random() * 0.4 + 0.5).toFixed(2);
    const delay = (Math.random() * 0.12).toFixed(2);
    spark.style.cssText = `--sx:${sx}px; --sy:${sy}px; --sdur:${dur}s; --sdelay:${delay}s;`;
    sparkleBurst.appendChild(spark);
  }
  requestAnimationFrame(() => sparkleBurst.classList.add('burst-go'));
}

// ── INTRO BUTTON — curtain-split reveal, musik main setelah tirai kebuka ──
startBtn.addEventListener('click', (e) => {
  if (appStarted) return;
  appStarted = true;
  firstInteraction = true;
  unlockIOSAudio();

  // 1. Sparkle meledak dari titik tombol diklik
  fireSparkleBurst(e.clientX, e.clientY);

  // 2. Fade teks & tombol intro
  const introContent = document.querySelector('.intro-content');
  introContent.style.transition = 'opacity 0.3s, transform 0.3s';
  introContent.style.opacity    = '0';
  introContent.style.transform  = 'scale(0.9)';

  // 3. Tirai kebuka ke kiri & kanan
  setTimeout(() => {
    curtainLeft.classList.add('curtain-open');
    curtainRight.classList.add('curtain-open');
  }, 220);

  // 4. Musik BARU mulai diputar setelah tirai mulai kesibak — bukan langsung pas klik
  setTimeout(() => {
    tryPlayMusic();
    musicControls.classList.add('music-controls-visible');
  }, 500);

  // 5. Sembunyikan intro, tampilkan halaman utama dengan reveal animation
  setTimeout(() => {
    introScreen.classList.add('fade-out');
    mainWrapper.classList.remove('hidden');
    void mainWrapper.offsetWidth; // paksa reflow supaya animasi reveal terpicu
    mainWrapper.classList.add('reveal');
  }, 750);
});

musicBtn.addEventListener('click', () => {
  handleFirstInteraction();
  if (musicPlaying) {
    bgMusic.pause(); musicPlaying = false; musicIcon.textContent = '▶';
  } else {
    bgMusic.muted  = false;
    bgMusic.volume = 0.55;
    bgMusic.play().then(() => { musicPlaying = true; musicIcon.textContent = '⏸'; }).catch(() => {});
  }
});

bgMusic.addEventListener('error', () => {
  document.querySelector('.music-label').textContent = 'Monokrom — Tulus (tambahkan music.mp3)';
});

// Catatan: musik TIDAK lagi dipicu oleh klik/sentuhan sembarang di halaman.
// Musik hanya mulai lewat sequence tombol intro "Buka Kejutannya" (lihat di atas),
// atau lewat tombol musicBtn manual — supaya urutan reveal-nya konsisten dan unik.

// ── INIT ──────────────────────────────────────
createParticles();
createRings();
// Catatan: lilin sekarang jadi bagian dari SVG kue itu sendiri (lihat index.html),
// jadi posisinya otomatis selalu presisi di tengah tier atas tanpa perlu perhitungan JS lagi.

// ── SKIP KE TAMPILAN AKHIR ─────────────────────
// Kalau sebelumnya sudah pernah tiup lilin di tab ini (misalnya user habis
// membuka precious.html lalu klik "Kembali"), langsung tampilkan versi akhir
// halaman tanpa mengulang intro screen & animasi tiup lilin dari awal.
function skipToEnd() {
  appStarted   = true;
  candleBlown  = true;
  firstInteraction = true;

  // Sembunyikan intro screen instan (tanpa animasi curtain)
  introScreen.style.transition = 'none';
  introScreen.classList.add('fade-out');

  // Tampilkan main content langsung, tanpa animasi reveal
  mainWrapper.classList.remove('hidden');
  mainWrapper.style.animation = 'none';
  mainWrapper.style.opacity   = '1';
  mainWrapper.style.transform = 'none';

  // Lilin dalam kondisi sudah padam
  flameOuter.classList.add('blown-out');

  // Tampilkan langsung pesan ulang tahun + tombol precious memories
  birthdayMessage.style.display = 'block';
  micStatus.style.display       = 'none';
  preciousSection.classList.add('visible');

  // Musik lanjut main
  tryPlayMusic();
  musicControls.classList.add('music-controls-visible');
}

let alreadyCelebrated = false;
try { alreadyCelebrated = sessionStorage.getItem('gaishaCelebrated') === 'true'; } catch (e) {}

// Kalau URL punya hash #cakeSection (dari tombol "← Kembali" di precious.html),
// itu berarti user PASTI sudah pernah lihat halaman ini sebelumnya — jadi kita
// selalu skip ke tampilan akhir + scroll ke kue, tidak bergantung pada
// sessionStorage (yang bisa saja sudah ter-reset, misalnya beda tab/instance).
const cameFromPrecious = window.location.hash === '#cakeSection';

if (alreadyCelebrated || cameFromPrecious) {
  skipToEnd();

  if (cameFromPrecious) {
    const cakeSection = document.getElementById('cakeSection');
    if (cakeSection) {
      // Delay singkat: kasih waktu mainWrapper selesai ditampilkan (display/layout settle)
      // dulu sebelum scroll, supaya posisi scroll dihitung dengan benar & terasa mulus.
      // requestAnimationFrame dobel dipakai supaya browser benar-benar sudah selesai
      // satu paint cycle penuh sebelum kita hitung posisi scroll target.
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTimeout(() => {
            cakeSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 80);
        });
      });
    }
  }
}