/* ================================================
   PRECIOUS MEMORIES — precious-script.js
   Particle text (canvas) → runtuh jadi masonry gallery
   ================================================ */

// ═══════════════════════════════════════════════
// GANTI DI SINI: teks custom yang ditampilkan lewat partikel
// Bisa 1 baris atau beberapa baris (array = baris-baris terpisah)
// ═══════════════════════════════════════════════
const PARTICLE_TEXT = ['PRECIOUS', 'MEMORIES'];

// ═══════════════════════════════════════════════
// GANTI DI SINI: isi galeri foto/video precious memories
// Taruh file di assets/photos/ lalu tulis path-nya di sini.
// type: 'image' atau 'video'
// caption: teks kecil yang muncul saat item di-hover (boleh dikosongkan '')
// ═══════════════════════════════════════════════
const GALLERY_ITEMS = [
  { type: 'image', src: 'assets/photos/foto1.jpg', caption: '' },
  { type: 'image', src: 'assets/photos/foto2.jpg', caption: '' },
  { type: 'image', src: 'assets/photos/foto3.jpg', caption: '' },
  { type: 'image', src: 'assets/photos/foto4.jpg', caption: '' },
  { type: 'image', src: 'assets/photos/foto5.jpg', caption: '' },
  { type: 'image', src: 'assets/photos/foto6.jpg', caption: '' },
  { type: 'video', src: 'assets/photos/video1.mp4', caption: '' },
];

// ── DOM REFS ──────────────────────────────────
const particleStage  = document.getElementById('particleStage');
const particleHint   = document.getElementById('particleHint');
const canvas         = document.getElementById('particleCanvas');
const ctx            = canvas.getContext('2d');
const galleryWrap    = document.getElementById('galleryWrap');
const masonryGrid    = document.getElementById('masonryGrid');
const lightbox        = document.getElementById('lightbox');
const lightboxContent = document.getElementById('lightboxContent');
const lightboxClose   = document.getElementById('lightboxClose');

// ── CANVAS SETUP ──────────────────────────────
let W = 0, H = 0, DPR = Math.min(window.devicePixelRatio || 1, 2);

function resizeCanvas() {
  W = canvas.clientWidth;
  H = canvas.clientHeight;
  canvas.width  = W * DPR;
  canvas.height = H * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
}

// ── SAMPLE TEXT INTO PARTICLE TARGET POINTS ───
// Render teks ke offscreen canvas, baca alpha channel tiap pixel,
// titik yang "terisi" teks jadi target posisi partikel.
function sampleTextPoints(lines) {
  const off = document.createElement('canvas');
  off.width  = W;
  off.height = H;
  const octx = off.getContext('2d');

  const fontSize = Math.min(W / (Math.max(...lines.map(l => l.length)) * 0.62), H * 0.16);
  octx.fillStyle = '#fff';
  octx.font = `700 ${fontSize}px 'Playfair Display', serif`;
  octx.textAlign = 'center';
  octx.textBaseline = 'middle';

  const lineHeight = fontSize * 1.15;
  const totalHeight = lineHeight * lines.length;
  const startY = H / 2 - totalHeight / 2 + lineHeight / 2;

  lines.forEach((line, i) => {
    octx.fillText(line, W / 2, startY + i * lineHeight);
  });

  const imageData = octx.getImageData(0, 0, W, H).data;
  const points = [];
  const gap = Math.max(2, Math.floor(W / 220)); // kepadatan sampling

  for (let y = 0; y < H; y += gap) {
    for (let x = 0; x < W; x += gap) {
      const idx = (y * W + x) * 4;
      if (imageData[idx + 3] > 128) {
        points.push({ x, y });
      }
    }
  }
  return points;
}

// ── HEART SHAPE SAMPLING ──────────────────────
// Menghasilkan titik-titik yang membentuk kurva hati matematis,
// dipakai sebagai target kedua partikel (teks → hati → galeri).
function sampleHeartPoints(count) {
  const points = [];
  const cx = W / 2;
  const cy = H / 2;
  const scale = Math.min(W, H) * 0.021;

  const edgeCount = Math.floor(count * 0.55);
  const fillCount = count - edgeCount;

  for (let i = 0; i < edgeCount; i++) {
    const t = (i / edgeCount) * Math.PI * 2;
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    points.push({ x: cx + hx * scale, y: cy + hy * scale });
  }

  for (let i = 0; i < fillCount; i++) {
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    const hx = 16 * Math.pow(Math.sin(t), 3);
    const hy = -(13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
    points.push({ x: cx + hx * scale * r, y: cy + hy * scale * r });
  }

  return points;
}

// ── PARTICLE CLASS ────────────────────────────
class Particle {
  constructor(tx, ty) {
    // Mulai dari posisi random di sekitar tepi layar (efek "berdatangan")
    const edge = Math.floor(Math.random() * 4);
    if (edge === 0)      { this.x = Math.random() * W; this.y = -20; }
    else if (edge === 1) { this.x = W + 20; this.y = Math.random() * H; }
    else if (edge === 2) { this.x = Math.random() * W; this.y = H + 20; }
    else                 { this.x = -20; this.y = Math.random() * H; }

    this.tx = tx;
    this.ty = ty;
    this.size = Math.random() * 1.6 + 0.8;
    this.baseSize = this.size;
    this.speed = Math.random() * 0.04 + 0.025;
    this.hueShift = Math.random();

    // state machine: 'text' → 'burst' → 'heart' → 'fade'
    this.state = 'text';
    this.vx = 0; this.vy = 0;
    this.color = Math.random() < 0.5 ? 'gold' : 'rose';
  }

  update() {
    if (this.state === 'text') {
      this.x += (this.tx - this.x) * this.speed;
      this.y += (this.ty - this.y) * this.speed;

    } else if (this.state === 'burst') {
      this.vy += 0.03;
      this.vx *= 0.97;
      this.vy *= 0.97;
      this.x += this.vx;
      this.y += this.vy;

    } else if (this.state === 'heart') {
      this.x += (this.tx - this.x) * this.heartSpeed;
      this.y += (this.ty - this.y) * this.heartSpeed;
      this.jitterPhase = (this.jitterPhase || Math.random() * 10) + 0.02;
      this.x += Math.sin(this.jitterPhase) * 0.15;
      this.y += Math.cos(this.jitterPhase * 1.3) * 0.15;

    } else if (this.state === 'fade') {
      this.vy += 0.05;
      this.vx *= 0.98;
      this.vy *= 0.98;
      this.x += this.vx;
      this.y += this.vy;
      this.size *= 0.97;
    }
  }

  burst() {
    this.state = 'burst';
    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * 4 + 1.5;
    this.vx = Math.cos(angle) * force;
    this.vy = Math.sin(angle) * force - 1.5;
  }

  toHeart(tx, ty) {
    this.state = 'heart';
    this.tx = tx;
    this.ty = ty;
    this.heartSpeed = Math.random() * 0.05 + 0.035;
  }

  fadeOut() {
    this.state = 'fade';
    const angle = Math.random() * Math.PI * 2;
    const force = Math.random() * 9 + 3;
    this.vx = Math.cos(angle) * force;
    this.vy = Math.sin(angle) * force - 3;
  }

  draw() {
    const twinkle = 0.7 + 0.3 * Math.sin(Date.now() * 0.003 + this.hueShift * 10);
    ctx.beginPath();
    ctx.arc(this.x, this.y, Math.max(this.size, 0), 0, Math.PI * 2);
    const g = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size * 3);
    if (this.state === 'heart' && this.color === 'rose') {
      g.addColorStop(0, `rgba(255, 214, 224, ${twinkle})`);
      g.addColorStop(0.5, `rgba(233, 122, 149, ${twinkle * 0.65})`);
      g.addColorStop(1, 'rgba(233, 122, 149, 0)');
    } else {
      g.addColorStop(0, `rgba(255, 243, 214, ${twinkle})`);
      g.addColorStop(0.5, `rgba(217, 184, 119, ${twinkle * 0.6})`);
      g.addColorStop(1, 'rgba(217, 184, 119, 0)');
    }
    ctx.fillStyle = g;
    ctx.fill();
  }
}

let particles = [];
let animId = null;
let exploded = false;

function initParticles() {
  resizeCanvas();
  const points = sampleTextPoints(PARTICLE_TEXT);
  particles = points.map(p => new Particle(p.x, p.y));
}

function animate() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  animId = requestAnimationFrame(animate);

  // Saat tahap runtuh akhir, bersihkan partikel yang sudah terlalu kecil/keluar layar
  const anyFading = particles.some(p => p.state === 'fade');
  if (anyFading) {
    particles = particles.filter(p => p.state !== 'fade' || (p.size > 0.05 && p.y < H + 100));
    if (particles.length === 0) {
      cancelAnimationFrame(animId);
    }
  }
}

// ── CLICK/TOUCH: teks → meledak kecil → menyusun jadi HATI → runtuh jadi galeri ──
function triggerExplode() {
  if (exploded) return;
  exploded = true;
  particleHint.style.opacity = '0';

  // Tahap 1: ledakan kecil, teks pecah jadi serpihan partikel
  particles.forEach(p => p.burst());

  // Tahap 2: serpihan menyusun ulang jadi bentuk hati
  setTimeout(() => {
    const heartPoints = sampleHeartPoints(particles.length);
    particles.forEach((p, i) => {
      const pt = heartPoints[i % heartPoints.length];
      p.toHeart(pt.x, pt.y);
    });
  }, 480);

  // Tahap 3: biarkan hati "berdetak" sebentar biar terasa (diedit lebih lama sesuai request)
  setTimeout(() => {
    particles.forEach(p => p.fadeOut());
  }, 3500); // Dari 1750ms ke 3500ms agar love lebih lama

  setTimeout(() => {
    particleStage.classList.add('dismissed');
    // Munculkan amplop setelah partikel selesai
    const letterSection = document.getElementById('letterSection');
    if (letterSection) {
      letterSection.classList.remove('hidden');
      letterSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, 4200); // Sesuai dengan durasi fadeOut
}

// ── LOGIKA AMPLOP (Pindahan dari script.js) ──
const envelope = document.getElementById('envelope');
const letterOverlay = document.getElementById('letterOverlay');
const letterClose = document.getElementById('letterClose');
let letterOpened = false;

const letterHintEl = document.querySelector('.letter-hint');

function openLetter() {
  if (letterOpened) return;
  letterOpened = true;
  envelope.classList.add('opened');
  if (letterHintEl) letterHintEl.textContent = 'Sudah dibaca';

  setTimeout(() => {
    letterOverlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }, 650);
}

function closeLetter() {
  letterOverlay.classList.remove('open');
  document.body.style.overflow = 'auto';

  // Amplop TETAP tampil (tidak disembunyikan) setelah surat dibaca —
  // envelope sudah dalam state "opened" jadi kelihatan sudah dibuka.
  // Gallery dibangun & muncul dengan fade halus, lalu discroll otomatis
  // supaya perpindahan dari amplop ke galeri terasa nyambung/mulus.
  buildGallery();

  requestAnimationFrame(() => {
    galleryWrap.classList.add('revealed');
    setTimeout(() => {
      galleryWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 250); // kasih waktu fade-in mulai dulu sebelum scroll, biar tidak "lompat"
  });
}

if (envelope) envelope.addEventListener('click', openLetter);
if (letterClose) letterClose.addEventListener('click', closeLetter);
if (letterOverlay) {
  letterOverlay.addEventListener('click', (e) => {
    if (e.target === letterOverlay) closeLetter();
  });
}

particleStage.addEventListener('click', triggerExplode);
particleStage.addEventListener('touchstart', (e) => {
  e.preventDefault();
  triggerExplode();
}, { passive: false });

// ── BUILD MASONRY GALLERY ──────────────────────
function buildGallery() {
  masonryGrid.innerHTML = '';
  GALLERY_ITEMS.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'masonry-item';

    const rot        = (Math.random() * 4 - 2).toFixed(2);        // rotasi awal saat muncul
    const rot2        = (Math.random() * 3 - 1.5).toFixed(2);      // rotasi kecil saat melayang (independen)
    const floatDur    = (Math.random() * 3 + 5.5).toFixed(2);      // 5.5s – 8.5s, tiap kartu beda kecepatan
    const floatY      = -(Math.random() * 8 + 8).toFixed(1);       // -8px – -16px, tiap kartu beda jarak
    const floatDelay  = (Math.random() * -8).toFixed(2);           // start mid-cycle, biar tidak serentak

    el.style.setProperty('--item-delay', (i * 0.09) + 's');
    el.style.setProperty('--item-rot', rot + 'deg');
    el.style.setProperty('--item-rot2', rot2 + 'deg');
    el.style.setProperty('--float-dur', floatDur + 's');
    el.style.setProperty('--float-y', floatY + 'px');
    el.style.setProperty('--float-delay', floatDelay + 's');

    const media = item.type === 'video'
      ? `<video src="${item.src}" muted playsinline preload="metadata"></video><span class="video-badge">▶</span>`
      : `<img src="${item.src}" alt="Precious memory" loading="lazy">`;

    // .item-float = lapisan dalam yang benar-benar melayang (transform)
    // .masonry-item (luar) hanya urus animasi masuk (fade+drift, sekali jalan)
    el.innerHTML = `
      <div class="item-float">
        ${media}
        ${item.caption ? `<div class="item-caption">${item.caption}</div>` : ''}
      </div>
    `;
    const floatEl = el.querySelector('.item-float');
    el.addEventListener('click', () => openLightbox(item, i));
    attachTilt(floatEl);
    masonryGrid.appendChild(el);
  });
}

// ── TILT 3D INTERAKTIF (mengikuti posisi mouse, hanya desktop) ──
let canHover = false;
try {
  canHover = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
} catch (e) {}
function attachTilt(el) {
  if (!canHover) return;
  el.addEventListener('mousemove', (e) => {
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;   // 0..1
    const py = (e.clientY - rect.top) / rect.height;   // 0..1
    const tiltX = (0.5 - py) * 14; // derajat
    const tiltY = (px - 0.5) * 14;
    el.style.setProperty('--tilt-x', tiltX.toFixed(2) + 'deg');
    el.style.setProperty('--tilt-y', tiltY.toFixed(2) + 'deg');
  });
  el.addEventListener('mouseleave', () => {
    el.style.setProperty('--tilt-x', '0deg');
    el.style.setProperty('--tilt-y', '0deg');
  });
}

// ── LIGHTBOX ───────────────────────────────────
const lightboxPrev    = document.getElementById('lightboxPrev');
const lightboxNext    = document.getElementById('lightboxNext');
const lightboxCounter = document.getElementById('lightboxCounter');
let currentLightboxIndex = 0;

function renderLightboxMedia(item) {
  const media = item.type === 'video'
    ? `<video src="${item.src}" controls autoplay playsinline></video>`
    : `<img src="${item.src}" alt="Precious memory">`;
  const caption = item.caption
    ? `<div class="lightbox-caption">${item.caption}</div>`
    : '';
  lightboxContent.innerHTML = media + caption;
  lightboxCounter.textContent = `${currentLightboxIndex + 1} / ${GALLERY_ITEMS.length}`;
}

function openLightbox(item, index) {
  currentLightboxIndex = index ?? GALLERY_ITEMS.indexOf(item);
  renderLightboxMedia(item);
  lightbox.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('open');
  // Kasih waktu animasi fade-out selesai dulu sebelum bongkar video/img,
  // supaya tidak ada "kedipan" konten kosong pas lightbox masih transisi.
  setTimeout(() => { lightboxContent.innerHTML = ''; }, 350);
}

function showLightboxAt(index) {
  const total = GALLERY_ITEMS.length;
  currentLightboxIndex = (index + total) % total;

  // Transisi halus: kartu foto lama "menyusut & kabur" dulu, baru foto
  // baru muncul dengan animasi masuk yang sama seperti buka pertama kali.
  lightboxContent.classList.add('switching');
  setTimeout(() => {
    renderLightboxMedia(GALLERY_ITEMS[currentLightboxIndex]);
    lightboxContent.classList.remove('switching');
  }, 190);
}

lightboxClose.addEventListener('click', closeLightbox);
lightboxPrev.addEventListener('click', (e) => { e.stopPropagation(); showLightboxAt(currentLightboxIndex - 1); });
lightboxNext.addEventListener('click', (e) => { e.stopPropagation(); showLightboxAt(currentLightboxIndex + 1); });
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox || e.target.classList.contains('lightbox-backdrop')) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  showLightboxAt(currentLightboxIndex - 1);
  if (e.key === 'ArrowRight') showLightboxAt(currentLightboxIndex + 1);
});

// Swipe kiri/kanan untuk pindah foto di mobile
let touchStartX = null;
lightboxContent.addEventListener('touchstart', (e) => {
  touchStartX = e.touches[0].clientX;
}, { passive: true });
lightboxContent.addEventListener('touchend', (e) => {
  if (touchStartX === null) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    showLightboxAt(currentLightboxIndex + (dx < 0 ? 1 : -1));
  }
  touchStartX = null;
});

// ── AMBIENT DUST GENERATOR ──────────────────────
// Partikel emas kecil yang mengambang naik perlahan di seluruh halaman,
// bikin suasana terasa hidup meski user cuma diam scroll galeri.
function createAmbientDust() {
  const dustEl = document.getElementById('ambientDust');
  if (!dustEl) return;
  const count = window.innerWidth < 480 ? 16 : 28;
  for (let i = 0; i < count; i++) {
    const mote = document.createElement('div');
    mote.className = 'dust-mote';
    const size = Math.random() * 3 + 1.5;
    const dur  = Math.random() * 10 + 12;
    const delay = Math.random() * 14;
    const sway = (Math.random() - 0.5) * 80;
    const op = (Math.random() * 0.4 + 0.3).toFixed(2);
    mote.style.cssText = `
      width:${size}px; height:${size}px;
      left:${Math.random() * 100}%;
      animation-duration:${dur.toFixed(1)}s;
      animation-delay:${delay.toFixed(1)}s;
      --dust-sway:${sway.toFixed(0)}px;
      --dust-op:${op};
    `;
    dustEl.appendChild(mote);
  }
}
createAmbientDust();

// ── INIT ───────────────────────────────────────
document.body.style.overflow = 'hidden'; // lock scroll selama tahap partikel
initParticles();
animate();

window.addEventListener('resize', () => {
  if (!exploded) {
    initParticles();
  }
});

// ── MUSIC (lanjut dari index.html, bukan mulai dari 0:00) ──────
// Posisi & status main disimpan di localStorage oleh index.html
// sebelum tombol "precious memories" diklik. Di sini kita baca lagi
// lalu lanjutkan dari detik yang sama.
const bgMusic    = document.getElementById('bgMusic');
const musicBtn   = document.getElementById('musicBtn');
const musicIcon  = document.getElementById('musicIcon');
const MUSIC_STATE_KEY = 'gaishaMusicState';
let musicPlaying = false;

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

  // Basi (>15 detik) → jangan dipakai, kemungkinan tab lama yang ditinggal.
  if (Date.now() - state.savedAt > 15000) return;

  const applyTime = () => {
    try { bgMusic.currentTime = state.time || 0; } catch (e) {}
  };
  if (bgMusic.readyState >= 1) applyTime();
  else bgMusic.addEventListener('loadedmetadata', applyTime, { once: true });

  if (state.playing) tryPlayMusic();
}

musicBtn.addEventListener('click', () => {
  if (musicPlaying) {
    bgMusic.pause(); musicPlaying = false; musicIcon.textContent = '▶';
  } else {
    tryPlayMusic();
  }
});

bgMusic.addEventListener('error', () => {
  document.querySelector('.music-label').textContent = 'Monokrom — Tulus (tambahkan music.mp3)';
});

// Simpan state pas mau pindah balik ke index.html / tutup tab
window.addEventListener('pagehide', saveMusicState);
window.addEventListener('beforeunload', saveMusicState);
document.querySelector('.back-link')?.addEventListener('click', saveMusicState);

restoreMusicState();