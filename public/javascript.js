document.addEventListener('DOMContentLoaded', async () => {
  // 1. Start Midnight Sparkles & Rose-Gold Confetti Engine right away
  const fx = initSparkleAndConfettiEngine();
  fx.burstConfetti(70);

  document.getElementById('confetti-btn').addEventListener('click', () => {
    fx.burstConfetti(120);
  });
  window.triggerBirthdayConfetti = () => fx.burstConfetti(130);

  // 2. Setup Interactive Birthday Candles & Lightbox
  setupCandles();
  setupLightbox();

  // 3. Load Birthday Content & Media from /api/code
  let data = {
    celebrantName: "Kathe",
    tagline: "✨ Celebrating Another Year of Magic ✨",
    birthdayDate: "Happy Birthday!",
    heroSubtitle: "Wishing you a sparkling birthday filled with love!",
    letterTitle: "A Special Note For You",
    letterBody: ["Happy Birthday!"],
    letterSignature: "With love ♡",
    media: []
  };

  try {
    const response = await fetch('/api/code');
    if (response.ok) {
      data = await response.json();
    }
  } catch (err) {
    console.warn('Could not fetch /api/code (normal if previewing offline via file://):', err);
  }

  populatePageContent(data);
  renderGallery(data.media || [], 'all');
  setupFilterButtons(data.media || []);
});

function populatePageContent(data) {
  const name = data.celebrantName || 'Birthday Girl';
  document.title = `Happy Birthday ${name}! ✨`;
  document.getElementById('nav-name').textContent = '♡ ' + name;
  document.getElementById('hero-name').textContent = name;
  document.getElementById('footer-name').textContent = name;
  document.getElementById('hero-tagline').textContent = data.tagline || '';
  document.getElementById('hero-date').textContent = data.birthdayDate || '';
  document.getElementById('hero-subtitle').textContent = data.heroSubtitle || '';
  document.getElementById('letter-title').textContent = data.letterTitle || 'Happy Birthday';
  document.getElementById('letter-signature').textContent = data.letterSignature || '';

  const letterBody = document.getElementById('letter-body');
  letterBody.innerHTML = '';
  (data.letterBody || []).forEach(paragraph => {
    const p = document.createElement('p');
    p.textContent = paragraph;
    letterBody.appendChild(p);
  });
}

/**
 * Smart URL converter:
 * Supports local /media/ files, direct URLs, Google Drive share links, and YouTube links.
 */
function parseMediaUrl(item) {
  const url = (item.url || '').trim();

  // Google Drive share link
  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && driveMatch) {
    const fileId = driveMatch[1];
    if (item.type === 'photo') {
      return {
        kind: 'image',
        src: `https://lh3.googleusercontent.com/d/${fileId}`,
        thumb: `https://lh3.googleusercontent.com/d/${fileId}`
      };
    } else {
      return {
        kind: 'iframe',
        src: `https://drive.google.com/file/d/${fileId}/preview`,
        thumb: null
      };
    }
  }

  // YouTube link
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && item.type === 'video') {
    const ytId = ytMatch[1];
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${ytId}?autoplay=1`,
      thumb: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    };
  }

  // Local file (/media/...) or direct image/MP4 URL
  if (item.type === 'photo') {
    return { kind: 'image', src: url, thumb: url };
  }
  return { kind: 'video', src: url, thumb: url };
}

function renderGallery(mediaList, filter) {
  const grid = document.getElementById('gallery-grid');
  grid.innerHTML = '';

  const filtered = mediaList.filter(item => filter === 'all' || item.type === filter);

  if (filtered.length === 0) {
    grid.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">No memories added in this category yet.</p>';
    return;
  }

  filtered.forEach(item => {
    const parsed = parseMediaUrl(item);
    const card = document.createElement('div');
    card.className = 'media-card';

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'media-thumb-wrap';

    if (parsed.kind === 'image') {
      const img = document.createElement('img');
      img.src = parsed.thumb;
      img.alt = item.caption || 'Birthday memory';
      img.loading = 'lazy';
      thumbWrap.appendChild(img);
    } else if (parsed.kind === 'video') {
      const vid = document.createElement('video');
      vid.src = parsed.src + '#t=0.5';
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      thumbWrap.appendChild(vid);
    } else if (parsed.thumb) {
      const img = document.createElement('img');
      img.src = parsed.thumb;
      img.alt = item.caption || 'Video memory';
      thumbWrap.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.innerHTML = '<span>✨ Video Memory ✨</span>';
      thumbWrap.appendChild(placeholder);
    }

    if (item.type === 'video') {
      const playBadge = document.createElement('div');
      playBadge.className = 'play-badge';
      playBadge.innerHTML = '▶';
      thumbWrap.appendChild(playBadge);
    }

    const typeTag = document.createElement('span');
    typeTag.className = 'media-badge-type';
    typeTag.textContent = item.type === 'video' ? '🎥 Video' : '📸 Photo';
    thumbWrap.appendChild(typeTag);

    const info = document.createElement('div');
    info.className = 'media-info';
    info.innerHTML = `
      <p class="media-caption">${escapeHtml(item.caption || '')}</p>
      <span class="media-date">${escapeHtml(item.date || '')}</span>
    `;

    card.appendChild(thumbWrap);
    card.appendChild(info);

    card.addEventListener('click', () => openLightbox(parsed, item));
    grid.appendChild(card);
  });
}

function setupFilterButtons(mediaList) {
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderGallery(mediaList, btn.dataset.filter);
    });
  });
}

function setupCandles() {
  const candles = document.querySelectorAll('.candle');
  const wishResult = document.getElementById('wish-result');
  const relightBtn = document.getElementById('relight-btn');
  const instruction = document.getElementById('wish-instruction');

  candles.forEach(candle => {
    candle.addEventListener('click', () => {
      candle.classList.add('blown');
      const allBlown = Array.from(candles).every(c => c.classList.contains('blown'));
      if (allBlown) {
        wishResult.classList.remove('hidden');
        relightBtn.classList.remove('hidden');
        instruction.textContent = 'All candles blown out!';
        if (window.triggerBirthdayConfetti) window.triggerBirthdayConfetti();
      }
    });
  });

  relightBtn.addEventListener('click', () => {
    candles.forEach(c => c.classList.remove('blown'));
    wishResult.classList.add('hidden');
    relightBtn.classList.add('hidden');
    instruction.textContent = 'Tap the glowing candles to blow them out & reveal a sparkle surprise!';
  });
}

function setupLightbox() {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');

  const close = () => {
    lightbox.classList.add('hidden');
    document.getElementById('lightbox-media-container').innerHTML = '';
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) close();
  });
}

function openLightbox(parsed, item) {
  const lightbox = document.getElementById('lightbox');
  const container = document.getElementById('lightbox-media-container');
  container.innerHTML = '';

  if (parsed.kind === 'image') {
    const img = document.createElement('img');
    img.src = parsed.src;
    img.alt = item.caption || '';
    container.appendChild(img);
  } else if (parsed.kind === 'video') {
    const video = document.createElement('video');
    video.src = parsed.src;
    video.controls = true;
    video.autoplay = true;
    video.playsInline = true;
    container.appendChild(video);
  } else if (parsed.kind === 'iframe') {
    const iframe = document.createElement('iframe');
    iframe.src = parsed.src;
    iframe.allow = 'autoplay; fullscreen';
    iframe.allowFullscreen = true;
    container.appendChild(iframe);
  }

  document.getElementById('lightbox-text').textContent = item.caption || '';
  document.getElementById('lightbox-date').textContent = item.date || '';
  lightbox.classList.remove('hidden');
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Midnight Blue Stars + Rose Gold Confetti Particle Engine
 */
function initSparkleAndConfettiEngine() {
  const canvas = document.getElementById('sparkle-canvas');
  const ctx = canvas.getContext('2d');
  let width, height;

  const resize = () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  };
  window.addEventListener('resize', resize);
  resize();

  const stars = Array.from({ length: 75 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    r: Math.random() * 1.8 + 0.4,
    alpha: Math.random(),
    speed: (Math.random() * 0.015) + 0.005
  }));

  let confetti = [];
  const colors = ['#e4a9ad', '#fadadd', '#b36b73', '#ffffff', '#7a8ce0', '#f6d365'];

  function burstConfetti(count) {
    for (let i = 0; i < count; i++) {
      confetti.push({
        x: width / 2 + (Math.random() - 0.5) * (width * 0.45),
        y: height * 0.35 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() * -10) - 3,
        size: Math.random() * 7 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }
  }

  function animate() {
    ctx.clearRect(0, 0, width, height);

    stars.forEach(s => {
      s.alpha += s.speed;
      if (s.alpha > 1 || s.alpha < 0.15) s.speed *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 218, 221, ${s.alpha})`;
      ctx.fill();
    });

    confetti = confetti.filter(c => c.alpha > 0.02 && c.y < height + 30);
    confetti.forEach(c => {
      c.x += c.vx;
      c.y += c.vy;
      c.vy += 0.22;
      c.vx *= 0.99;
      c.rotation += c.rotSpeed;
      c.alpha -= 0.005;

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.globalAlpha = c.alpha;
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 0.6);
      ctx.restore();
    });

    requestAnimationFrame(animate);
  }

  animate();
  return { burstConfetti };
}