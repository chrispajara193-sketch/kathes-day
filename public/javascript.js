document.addEventListener('DOMContentLoaded', async () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  if (window.location.hash) {
    history.replaceState(null, '', window.location.pathname + window.location.search);
  }
  window.scrollTo(0, 0);

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
    backgroundSongs: [],
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

  populatePageContent(data);

  const videos = data.videos || (data.media || []).filter(m => m.type === 'video');
  const photos = data.photos || (data.media || []).filter(m => m.type === 'photo');

  renderSection('videos-grid', videos, 'video', music);
  renderSection('photos-grid', photos, 'photo', music);

  const rawSongs = data.backgroundSongs ?? data.backgroundSong;
  const songList = Array.isArray(rawSongs) ? rawSongs : (rawSongs ? [rawSongs] : []);
  music.setSongs(songList);
});

function extractYouTubeId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function setupMusic() {
  const toggleBtn = document.getElementById('music-toggle');
  const ytWrap = document.getElementById('yt-bg-wrap');

  const NORMAL_VOL = 45;
  const DUCKED_VOL = 8;
  const CROSSFADE_LEAD_SEC = 5.5; // Start fading in Song 2 this many seconds BEFORE Song 1 ends
  const CROSSFADE_MS = 4000;      // 4-second smooth overlap crossfade

  let playlist = [];
  let songIndex = 0;
  let activeIdx = 0;
  let isPlaying = false;
  let userMuted = false;
  let isDucked = false;
  let isCrossfading = false;
  let fadeTimer = null;
  let crossfadeTimer = null;

  // Queue for loading the YouTube IFrame API once for both decks
  let ytApiRequested = false;
  const ytReadyCallbacks = [];

  function ensureYouTubeAPI(cb) {
    if (window.YT && window.YT.Player) {
      cb();
      return;
    }
    ytReadyCallbacks.push(cb);
    if (!ytApiRequested) {
      ytApiRequested = true;
      window.onYouTubeIframeAPIReady = () => {
        while (ytReadyCallbacks.length > 0) {
          const fn = ytReadyCallbacks.shift();
          fn();
        }
      };
      const tag = document.createElement('script');
      tag.src = 'https://' + 'www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  function createDeck(suffix) {
    const audio = new Audio();
    audio.loop = false;
    audio.preload = 'auto';
    audio.volume = 0;

    return {
      suffix,
      containerId: 'yt-bg-player-' + suffix,
      audio,
      mode: null, // 'youtube' | 'audio'
      ytPlayer: null,
      ytReady: false,
      vol: 0,
      priming: false,
      primed: false,
      pendingPlay: false,
      pendingPrime: false
    };
  }

  const decks = [createDeck('a'), createDeck('b')];

  function targetVol() {
    return isDucked ? DUCKED_VOL : NORMAL_VOL;
  }

  function updateBtn() {
    if (playlist.length === 0) return;
    toggleBtn.textContent = isPlaying ? '🎵 Music: On' : '🔇 Music: Off';
  }

  function setDeckVol(deck, vol) {
    deck.vol = Math.max(0, Math.min(100, vol));
    deck.audio.volume = deck.vol / 100;
    if (deck.mode === 'youtube' && deck.ytReady && deck.ytPlayer && typeof deck.ytPlayer.setVolume === 'function') {
      deck.ytPlayer.setVolume(Math.round(deck.vol));
    }
  }

  function fadeActiveTo(goalVol, durationMs = 360) {
    if (fadeTimer) clearInterval(fadeTimer);
    const deck = decks[activeIdx];
    const startVol = deck.vol;
    const intervalMs = 40;
    const steps = Math.max(1, Math.round(durationMs / intervalMs));
    let step = 0;

    fadeTimer = setInterval(() => {
      if (isCrossfading) {
        clearInterval(fadeTimer);
        fadeTimer = null;
        return;
      }
      step++;
      setDeckVol(deck, startVol + ((goalVol - startVol) * (step / steps)));
      if (step >= steps) {
        clearInterval(fadeTimer);
        fadeTimer = null;
      }
    }, intervalMs);
  }

  function playDeck(deck) {
    if (deck.mode === 'audio') {
      deck.audio.play().catch(() => {});
    } else if (deck.mode === 'youtube') {
      if (deck.ytReady && deck.ytPlayer) {
        deck.ytPlayer.unMute();
        deck.ytPlayer.playVideo();
      } else {
        deck.pendingPlay = true;
      }
    }
  }

  function pauseDeck(deck) {
    if (deck.mode === 'audio') {
      deck.audio.pause();
    } else if (deck.mode === 'youtube' && deck.ytReady && deck.ytPlayer) {
      deck.pendingPlay = false;
      deck.ytPlayer.pauseVideo();
    }
  }

  // Silently prime the standby deck inside a real candle-tap so it starts instantly later
  function primeStandbyDeck() {
    if (playlist.length < 2) return;
    const standby = decks[1 - activeIdx];
    if (standby.primed || standby.priming) return;

    if (standby.mode === 'youtube') {
      if (standby.ytReady && standby.ytPlayer) {
        standby.priming = true;
        standby.ytPlayer.mute();
        standby.ytPlayer.setVolume(0);
        standby.ytPlayer.playVideo();
      } else {
        standby.pendingPrime = true;
      }
    } else if (standby.mode === 'audio') {
      standby.priming = true;
      standby.audio.muted = true;
      standby.audio.play().then(() => {
        standby.priming = false;
        standby.primed = true;
        standby.audio.pause();
        standby.audio.currentTime = 0;
        standby.audio.muted = false;
      }).catch(() => {
        standby.priming = false;
      });
    }
  }

  function cueDeckWithUrl(deck, url) {
    const ytId = extractYouTubeId(url);
    setDeckVol(deck, 0);

    if (ytId) {
      deck.audio.pause();
      deck.mode = 'youtube';

      if (deck.ytPlayer && deck.ytReady && typeof deck.ytPlayer.cueVideoById === 'function') {
        deck.ytPlayer.cueVideoById(ytId);
      } else if (!deck.ytPlayer) {
        ensureYouTubeAPI(() => {
          deck.ytPlayer = new YT.Player(deck.containerId, {
            height: '2',
            width: '2',
            videoId: ytId,
            playerVars: {
              autoplay: 0,
              controls: 0,
              disablekb: 1,
              fs: 0,
              playsinline: 1,
              enablejsapi: 1,
              origin: window.location.origin
            },
            events: {
              onReady: (e) => {
                deck.ytReady = true;
                e.target.setVolume(Math.round(deck.vol));
                if (deck.pendingPlay && !userMuted) {
                  deck.pendingPlay = false;
                  e.target.unMute();
                  e.target.playVideo();
                } else if (deck.pendingPrime) {
                  deck.pendingPrime = false;
                  deck.priming = true;
                  e.target.mute();
                  e.target.setVolume(0);
                  e.target.playVideo();
                }
              },
              onStateChange: (e) => {
                // Finish silent priming as soon as playback starts
                if (deck.priming && e.data === YT.PlayerState.PLAYING) {
                  deck.priming = false;
                  deck.primed = true;
                  e.target.pauseVideo();
                  e.target.seekTo(0, true);
                  e.target.unMute();
                  setDeckVol(deck, 0);
                  return;
                }

                // Only update main UI state for the currently active deck
                if (deck === decks[activeIdx] && !isCrossfading) {
                  if (e.data === YT.PlayerState.PLAYING) {
                    isPlaying = true;
                    updateBtn();
                  } else if (e.data === YT.PlayerState.PAUSED) {
                    isPlaying = false;
                    updateBtn();
                  } else if (e.data === YT.PlayerState.ENDED) {
                    if (playlist.length === 1) {
                      e.target.seekTo(0, true);
                      e.target.playVideo();
                    } else {
                      startCrossfade();
                    }
                  }
                }
              },
              onError: (e) => {
                console.warn('YouTube background song error:', e.data);
                if (deck === decks[activeIdx]) {
                  isPlaying = false;
                  updateBtn();
                }
              }
            }
          });
        });
      }
    } else {
      if (deck.ytPlayer && deck.ytReady) deck.ytPlayer.stopVideo();
      deck.mode = 'audio';
      deck.audio.src = url;
      deck.audio.load();
    }
  }

  decks.forEach(deck => {
    deck.audio.addEventListener('ended', () => {
      if (deck === decks[activeIdx] && deck.mode === 'audio' && !isCrossfading) {
        if (playlist.length === 1) {
          deck.audio.currentTime = 0;
          deck.audio.play().catch(() => {});
        } else {
          startCrossfade();
        }
      }
    });
  });

  function startCrossfade() {
    if (isCrossfading || playlist.length < 2 || userMuted) return;
    isCrossfading = true;
    if (fadeTimer) {
      clearInterval(fadeTimer);
      fadeTimer = null;
    }

    const outIdx = activeIdx;
    const inIdx = 1 - activeIdx;
    const outDeck = decks[outIdx];
    const inDeck = decks[inIdx];

    songIndex = (songIndex + 1) % playlist.length;

    // Start the incoming song silently right away while outgoing song is still playing
    inDeck.priming = false;
    setDeckVol(inDeck, 0);
    playDeck(inDeck);

    const startOutVol = outDeck.vol;
    const intervalMs = 50;
    const steps = Math.round(CROSSFADE_MS / intervalMs);
    let step = 0;

    if (crossfadeTimer) clearInterval(crossfadeTimer);
    crossfadeTimer = setInterval(() => {
      step++;
      const progress = Math.min(1, step / steps);

      setDeckVol(outDeck, startOutVol * (1 - progress));
      setDeckVol(inDeck, targetVol() * progress);

      if (progress >= 1) {
        clearInterval(crossfadeTimer);
        crossfadeTimer = null;
        pauseDeck(outDeck);
        setDeckVol(outDeck, 0);

        activeIdx = inIdx;
        isCrossfading = false;

        // Pre-cue the NEXT song on the now-idle deck so it's ready for the next crossfade
        const upcomingUrl = playlist[(songIndex + 1) % playlist.length];
        cueDeckWithUrl(outDeck, upcomingUrl);
      }
    }, intervalMs);
  }

  // Watch playback progress to trigger crossfade 5.5 seconds BEFORE current song ends
  setInterval(() => {
    if (!isPlaying || userMuted || isCrossfading || playlist.length < 2) return;
    const deck = decks[activeIdx];

    if (deck.mode === 'youtube' && deck.ytReady && deck.ytPlayer && typeof deck.ytPlayer.getDuration === 'function') {
      const dur = deck.ytPlayer.getDuration();
      const cur = deck.ytPlayer.getCurrentTime();
      if (dur > 12 && cur > 3 && (dur - cur) <= CROSSFADE_LEAD_SEC) {
        startCrossfade();
      }
    } else if (deck.mode === 'audio' && deck.audio.duration > 12 && deck.audio.currentTime > 3) {
      if ((deck.audio.duration - deck.audio.currentTime) <= CROSSFADE_LEAD_SEC) {
        startCrossfade();
      }
    }
  }, 350);

  toggleBtn.addEventListener('click', () => {
    if (playlist.length === 0) return;
    if (isPlaying) {
      userMuted = true;
      isPlaying = false;
      if (crossfadeTimer) {
        clearInterval(crossfadeTimer);
        crossfadeTimer = null;
        isCrossfading = false;
      }
      pauseDeck(decks[0]);
      pauseDeck(decks[1]);
      updateBtn();
    } else {
      userMuted = false;
      isPlaying = true;
      setDeckVol(decks[activeIdx], targetVol());
      playDeck(decks[activeIdx]);
      primeStandbyDeck();
      updateBtn();
    }
  });

  return {
    setSongs(urls) {
      playlist = (urls || [])
        .filter(u => typeof u === 'string')
        .map(u => u.trim())
        .filter(Boolean);
      if (playlist.length === 0) return;

      // Build the two hidden YouTube player slots automatically
      ytWrap.innerHTML = `<div id="${decks[0].containerId}"></div><div id="${decks[1].containerId}"></div>`;

      songIndex = 0;
      activeIdx = 0;
      toggleBtn.classList.remove('hidden');

      cueDeckWithUrl(decks[0], playlist[0]);
      if (playlist.length > 1) {
        cueDeckWithUrl(decks[1], playlist[1]);
      }
      updateBtn();
    },
    prepareNext() {
      primeStandbyDeck();
    },
    startIfEnabled() {
      if (playlist.length === 0 || userMuted) return;
      isPlaying = true;
      setDeckVol(decks[activeIdx], targetVol());
      playDeck(decks[activeIdx]);
      primeStandbyDeck();
      updateBtn();
    },
    duckForVideo() {
      isDucked = true;
      if (playlist.length > 0 && isPlaying && !userMuted && !isCrossfading) {
        fadeActiveTo(DUCKED_VOL, 360);
      }
    },
    restoreAfterVideo() {
      if (isDucked) {
        isDucked = false;
        if (playlist.length > 0 && isPlaying && !userMuted && !isCrossfading) {
          fadeActiveTo(NORMAL_VOL, 360);
        }
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

  function scrollToTopNow() {
    const html = document.documentElement;
    const prev = html.style.scrollBehavior;
    html.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    html.scrollTop = 0;
    document.body.scrollTop = 0;
    html.style.scrollBehavior = prev;
  }

  function finishUnlock() {
    overlay.classList.add('unlocked');
    document.body.classList.remove('locked');
    scrollToTopNow();
    requestAnimationFrame(scrollToTopNow);
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

    setTimeout(finishUnlock, 15050);
  }

  introCandles.forEach(candle => {
    candle.addEventListener('click', () => {
      if (candle.classList.contains('blown') || unlocked) return;
      candle.classList.add('blown');

      // Silently pre-warm Song 2 on the very first candle tap!
      music.prepareNext();

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
