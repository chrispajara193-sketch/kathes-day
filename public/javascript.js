document.addEventListener('DOMContentLoaded', async () => {
  const fx = initSparkleAndConfettiEngine();
  window.triggerBirthdayConfetti = (count = 130) => fx.burstConfetti(count);

  const music = setupMusic();
  setupIntroOverlay(fx, music);
  setupLightbox(music);

  document.getElementById('confetti-btn').addEventListener('click', () => {
    fx.burstConfetti(120);
  });

  let data = {
    celebrantName: "Kathe",
    tagline: "✨ Celebrating Another Year of Magic ✨",
    birthdayDate: "November 22, 2026",
    backgroundSong: "",
    heroSubtitle: "Wishing you a sparkling birthday filled with love!",
    letterTitle: "A Special Note For You",
    letterBody: ["Happy Birthday!"],
    letterSignature: "With love ♡",
    videos: [],
    photos: []
  };

  try {
    const response = await fetch('/api/code');
    if (response.ok) {
      data = await response.json();
    }
  } catch (err) {
    console.warn('Could not fetch /api/code (normal if previewing offline via file://):', err);
  }

  music.setSong(data.backgroundSong);
  populatePageContent(data);

  const videos = data.videos || (data.media || []).filter(m => m.type === 'video');
  const photos = data.photos || (data.media || []).filter(m => m.type === 'photo');

  renderSection('videos-grid', videos, 'video', music);
  renderSection('photos-grid', photos, 'photo', music);
});

function extractYouTubeId(url) {
  const match = (url || '').match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function setupMusic() {
  const audio = document.getElementById('bg-music');
  const toggleBtn = document.getElementById('music-toggle');

  const NORMAL_VOL = 45;
  const DUCKED_VOL = 8;

  let mode = null;
  let ytPlayer = null;
  let ytReady = false;
  let pendingPlay = false;
  let isPlaying = false;
  let userMuted = false;
  let isDucked = false;
  let currentVol = NORMAL_VOL;
  let fadeTimer = null;

  audio.volume = NORMAL_VOL / 100;

  function updateBtn() {
    if (!mode) return;
    toggleBtn.textContent = isPlaying ? '🎵 Music: On' : '🔇 Music: Off';
  }

  function applyVolume(vol) {
    currentVol = Math.max(0, Math.min(100, vol));
    audio.volume = currentVol / 100;
    if (mode === 'youtube' && ytReady && ytPlayer && typeof ytPlayer.setVolume === 'function') {
      ytPlayer.setVolume(Math.round(currentVol));
    }
  }

  function fadeTo(targetVol) {
    if (fadeTimer) clearInterval(fadeTimer);
    const startVol = currentVol;
    const steps = 12;
    let step = 0;

    fadeTimer = setInterval(() => {
      step++;
      const nextVol = startVol + ((targetVol - startVol) * (step / steps));
      applyVolume(nextVol);
      if (step >= steps) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
    }, 30);
  }

  function playMusic() {
    if (!mode || userMuted) return;
    const target = isDucked ? DUCKED_VOL : NORMAL_VOL;
    applyVolume(target);

    if (mode === 'audio') {
      audio.play().then(() => {
        isPlaying = true;
        updateBtn();
      }).catch(() => {});
    } else if (mode === 'youtube') {
      if (ytReady && ytPlayer) {
        ytPlayer.playVideo();
      } else {
        pendingPlay = true;
      }
    }
  }

  function pauseMusic() {
    if (!mode) return;
    if (mode === 'audio') {
      audio.pause();
      isPlaying = false;
      updateBtn();
    } else if (mode === 'youtube' && ytReady && ytPlayer) {
      pendingPlay = false;
      ytPlayer.pauseVideo();
      isPlaying = false;
      updateBtn();
    }
  }

  function initYouTubePlayer(videoId) {
    const createPlayer = () => {
      ytPlayer = new YT.Player('yt-bg-player', {
        height: '2',
        width: '2',
        videoId: videoId,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          loop: 1,
          playlist: videoId,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin
        },
        events: {
          onReady: (e) => {
            ytReady = true;
            e.target.setVolume(isDucked ? DUCKED_VOL : NORMAL_VOL);
            if (pendingPlay && !userMuted) {
              pendingPlay = false;
              e.target.playVideo();
            }
          },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING) {
              isPlaying = true;
              updateBtn();
            } else if (e.data === YT.PlayerState.PAUSED) {
              isPlaying = false;
              updateBtn();
            } else if (e.data === YT.PlayerState.ENDED) {
              e.target.seekTo(0);
              e.target.playVideo();
            }
          },
          onError: (e) => {
            console.warn('YouTube background song error (some official music videos block embedding):', e.data);
            isPlaying = false;
            updateBtn();
          }
        }
      });
    };

    if (window.YT && window.YT.Player) {
      createPlayer();
    } else {
      window.onYouTubeIframeAPIReady = createPlayer;
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  toggleBtn.addEventListener('click', () => {
    if (!mode) return;
    if (isPlaying) {
      userMuted = true;
      pauseMusic();
    } else {
      userMuted = false;
      playMusic();
    }
  });

  return {
    setSong(url) {
      const cleanUrl = (url || '').trim();
      if (!cleanUrl) return;

      const ytId = extractYouTubeId(cleanUrl);
      toggleBtn.classList.remove('hidden');

      if (ytId) {
        mode = 'youtube';
        initYouTubePlayer(ytId);
      } else {
        mode = 'audio';
        audio.src = cleanUrl;
      }
      updateBtn();
    },
    startIfEnabled() {
      playMusic();
    },
    duckForVideo() {
      if (mode && isPlaying && !userMuted) {
        isDucked = true;
        fadeTo(DUCKED_VOL);
      }
    },
    restoreAfterVideo() {
      if (isDucked) {
        isDucked = false;
        fadeTo(NORMAL_VOL);
      }
    }
  };
}

function setupIntroOverlay(fx, music) {
  const overlay = document.getElementById('intro-overlay');
  const introCard = overlay.querySelector('.intro-card');
  const msgScreen = document.getElementById('intro-message-screen');
  const introCandles = document.querySelectorAll('#intro-candles-row .intro-candle');
  const statusEl = document.getElementById('intro-status');
  let unlocked = false;
  let revealTimer = null;

  function finishUnlock() {
    if (revealTimer) clearTimeout(revealTimer);
    overlay.classList.add('unlocked');
    document.body.classList.remove('locked');
  }

  function unlockSite() {
    if (unlocked) return;
    unlocked = true;

    music.startIfEnabled();

    statusEl.textContent = '✨ Wish granted! ✨';
    fx.burstConfetti(160);

    setTimeout(() => {
      introCard.classList.add('fade-out');
    }, 650);

    setTimeout(() => {
      msgScreen.classList.add('show');
    }, 1050);

    revealTimer = setTimeout(finishUnlock, 7550);
  }

  msgScreen.addEventListener('click', () => {
    if (msgScreen.classList.contains('show')) {
      finishUnlock();
    }
  });

  introCandles.forEach(candle => {
    candle.addEventListener('click', () => {
      if (candle.classList.contains('blown') || unlocked) return;
      candle.classList.add('blown');

      const remaining = Array.from(introCandles).filter(c => !c.classList.contains('blown')).length;
      if (remaining === 0) {
        unlockSite();
      } else {
        statusEl.textContent = `Tap each glowing flame to blow it out ✨ (${remaining} left)`;
      }
    });
  });
}

function populatePageContent(data) {
  const name = data.celebrantName || 'Birthday Girl';
  document.title = `Happy Birthday ${name}! ✨`;
  document.getElementById('intro-name').textContent = name;
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

function parseMediaUrl(item, mediaType) {
  const url = (item.url || '').trim();

  const driveMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (url.includes('drive.google.com') && driveMatch) {
    const fileId = driveMatch[1];
    if (mediaType === 'photo') {
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

  const ytId = extractYouTubeId(url);
  if (ytId && mediaType === 'video') {
    return {
      kind: 'iframe',
      src: `https://www.youtube.com/embed/${ytId}?autoplay=1`,
      thumb: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
    };
  }

  if (mediaType === 'photo') {
    return { kind: 'image', src: url, thumb: url };
  }
  return { kind: 'video', src: url, thumb: url };
}

function renderSection(gridId, items, mediaType, music) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';

  const validItems = items.filter(item => item && item.url && item.url.trim() !== '');

  if (validItems.length === 0) {
    const emptyText = mediaType === 'video' ? 'No birthday greetings added yet.' : 'No photos added yet.';
    grid.innerHTML = `<p style="grid-column: 1/-1; text-align:center; color: var(--text-muted);">${emptyText}</p>`;
    return;
  }

  validItems.forEach(item => {
    const parsed = parseMediaUrl(item, mediaType);
    const card = document.createElement('div');
    card.className = mediaType === 'video' ? 'media-card video-card' : 'media-card photo-card';

    const thumbWrap = document.createElement('div');
    thumbWrap.className = 'media-thumb-wrap';

    if (parsed.kind === 'image') {
      const img = document.createElement('img');
      img.src = parsed.thumb;
      img.alt = item.caption || 'Birthday photo';
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
      img.alt = item.caption || 'Birthday greeting';
      thumbWrap.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'video-placeholder';
      placeholder.innerHTML = '<span>✨ Birthday Greeting ✨</span>';
      thumbWrap.appendChild(placeholder);
    }

    if (mediaType === 'video') {
      const playBadge = document.createElement('div');
      playBadge.className = 'play-badge';
      playBadge.innerHTML = '▶';
      thumbWrap.appendChild(playBadge);
    }

    const typeTag = document.createElement('span');
    typeTag.className = 'media-badge-type';
    typeTag.textContent = mediaType === 'video' ? '🎥 Greeting' : '📸 Photo';
    thumbWrap.appendChild(typeTag);

    const info = document.createElement('div');
    info.className = 'media-info';
    info.innerHTML = `
      <p class="media-caption">${escapeHtml(item.caption || '')}</p>
      <span class="media-date">${escapeHtml(item.date || '')}</span>
    `;

    card.appendChild(thumbWrap);
    card.appendChild(info);

    card.addEventListener('click', () => openLightbox(parsed, item, mediaType, music));
    grid.appendChild(card);
  });
}

function setupLightbox(music) {
  const lightbox = document.getElementById('lightbox');
  const closeBtn = document.getElementById('lightbox-close');
  const backdrop = lightbox.querySelector('.lightbox-backdrop');

  const close = () => {
    lightbox.classList.add('hidden');
    document.getElementById('lightbox-media-container').innerHTML = '';
    music.restoreAfterVideo();
  };

  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', close);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) close();
  });
}

function openLightbox(parsed, item, mediaType, music) {
  if (mediaType === 'video') {
    music.duckForVideo();
  }

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
