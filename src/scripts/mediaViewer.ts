const timeLabel = (seconds: number) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  return `${Math.floor(safe / 60)}:${String(Math.floor(safe % 60)).padStart(2, '0')}`;
};

/** Each gallery owns a viewer; media elements and listeners never cross instances. */
document.querySelectorAll<HTMLDialogElement>('.media-dialog').forEach((dialog) => {
  const get = <T extends HTMLElement = HTMLElement>(selector: string) =>
    dialog.querySelector<T>(selector)!;
  const viewer = get('.cinematic-viewer');
  const stage = get('.viewer-stage');
  const content = get('.media-dialog-content');
  const controls = get('.viewer-controls');
  const status = get('.viewer-status');
  const start = get<HTMLButtonElement>('.viewer-start');
  const retry = get<HTMLButtonElement>('.viewer-retry');
  const seek = get<HTMLInputElement>('.viewer-seek');
  const volume = get<HTMLInputElement>('.viewer-volume');
  const toggle = get<HTMLButtonElement>('.viewer-toggle');
  const mute = get<HTMLButtonElement>('.viewer-mute');
  const fullscreen = get<HTMLButtonElement>('.viewer-fullscreen');
  const previous = get<HTMLButtonElement>('.viewer-previous');
  const next = get<HTMLButtonElement>('.viewer-next');
  const grid = [...document.querySelectorAll<HTMLElement>('[data-media-modal]')].find(
    (element) => element.dataset.mediaModal === dialog.id,
  );
  const cards = [...(grid?.querySelectorAll<HTMLButtonElement>('.media-trigger') ?? [])];
  let activeCards = cards;
  let index = 0;
  let opener: HTMLButtonElement | undefined;
  let video: HTMLVideoElement | undefined;
  let mediaEvents = new AbortController();
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  let scrollY = 0;
  let oldOverflow = '';
  let touchStart: { x: number; y: number; time: number } | undefined;
  let rememberedVolume = 0.7;
  let scrubbing = false;
  let wasFullscreen = false;
  let requestedFullscreenExit = false;

  const announce = (message = '', busy = false) => {
    status.textContent = message;
    status.hidden = !message;
    stage.setAttribute('aria-busy', String(busy));
  };
  const revealControls = () => {
    clearTimeout(hideTimer);
    viewer.classList.remove('controls-idle');
    if (video && !video.paused && !scrubbing && !controls.contains(document.activeElement)) {
      hideTimer = setTimeout(() => viewer.classList.add('controls-idle'), 2600);
    }
  };
  const sync = () => {
    if (!video) return;
    const playing = !video.paused && !video.ended;
    get('[data-play-icon]').hidden = playing;
    get('[data-pause-icon]').hidden = !playing;
    toggle.setAttribute('aria-label', playing ? 'Паузирај видео (Space)' : 'Пушти видео (Space)');
    start.hidden = playing || !!video.error;
    const silent = video.muted || video.volume === 0;
    get('[data-volume-icon]').hidden = silent;
    get('[data-muted-icon]').hidden = !silent;
    mute.setAttribute('aria-pressed', String(silent));
    mute.setAttribute('aria-label', silent ? 'Вклучи звук (M)' : 'Исклучи звук (M)');
    volume.value = String(silent ? 0 : video.volume);
    volume.style.setProperty('--progress', `${Number(volume.value) * 100}%`);
    get('[data-current-time]').textContent = timeLabel(video.currentTime);
    get('[data-duration]').textContent = timeLabel(video.duration);
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    seek.disabled = duration <= 0;
    if (!scrubbing) seek.value = String(duration ? (video.currentTime / duration) * 100 : 0);
    seek.setAttribute(
      'aria-valuetext',
      `${timeLabel(video.currentTime)} од ${timeLabel(duration)}`,
    );
    seek.style.setProperty('--progress', `${seek.value}%`);
    let buffered = 0;
    if (duration && video.buffered.length)
      buffered = (video.buffered.end(video.buffered.length - 1) / duration) * 100;
    seek.style.setProperty('--buffered', `${buffered}%`);
    if (!playing) {
      clearTimeout(hideTimer);
      viewer.classList.remove('controls-idle');
    }
  };
  const playPause = async () => {
    const target = video;
    if (!target || target.error) return;
    revealControls();
    if (!target.paused) {
      target.pause();
      return;
    }
    try {
      await target.play();
    } catch (error) {
      if (
        target !== video ||
        !dialog.open ||
        (error instanceof DOMException && error.name === 'AbortError')
      )
        return;
      announce('Притисни Пушти за да го започнеш видеото.');
      sync();
    }
  };
  const changeFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        requestedFullscreenExit = true;
        await document.exitFullscreen();
      } else if (viewer.requestFullscreen) {
        requestedFullscreenExit = false;
        await viewer.requestFullscreen();
      } else {
        const nativeVideo = video as
          (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | undefined;
        if (nativeVideo?.webkitEnterFullscreen) nativeVideo.webkitEnterFullscreen();
        else announce('Цел екран не е достапен во овој прелистувач.');
      }
    } catch {
      announce('Цел екран не е достапен во овој прелистувач.');
    }
    revealControls();
  };
  const releaseMedia = () => {
    mediaEvents.abort();
    mediaEvents = new AbortController();
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }
    video = undefined;
    content.replaceChildren();
    clearTimeout(hideTimer);
    scrubbing = false;
  };
  const show = (newIndex: number) => {
    releaseMedia();
    index = (newIndex + activeCards.length) % activeCards.length;
    const card = activeCards[index];
    get('.media-dialog-title').textContent = card.dataset.title ?? '';
    get('[data-viewer-type]').textContent = card.dataset.kind === 'video' ? 'ВИДЕО' : 'ФОТОГРАФИЈА';
    get('.viewer-index').textContent =
      `${String(index + 1).padStart(2, '0')} / ${String(activeCards.length).padStart(2, '0')}`;
    get('.viewer-description').textContent = card.dataset.description ?? '';
    previous.disabled = next.disabled = activeCards.length < 2;
    viewer.classList.remove('controls-idle');
    controls.hidden = card.dataset.kind !== 'video';
    start.hidden = true;
    retry.hidden = true;
    announce('Се вчитува…', true);
    const options = { signal: mediaEvents.signal };
    if (card.dataset.kind === 'video') {
      const element = document.createElement('video');
      video = element;
      element.playsInline = true;
      element.muted = true;
      element.volume = rememberedVolume;
      element.preload = 'metadata';
      element.poster = card.dataset.poster ?? '';
      element.setAttribute('aria-label', card.dataset.title ?? 'Видео');
      element.setAttribute('aria-describedby', `${dialog.id}-shortcuts`);
      for (const event of [
        'play',
        'pause',
        'ended',
        'timeupdate',
        'durationchange',
        'loadedmetadata',
        'volumechange',
        'progress',
      ]) {
        element.addEventListener(event, sync, options);
      }
      element.addEventListener(
        'playing',
        () => {
          announce();
          revealControls();
        },
        options,
      );
      element.addEventListener(
        'canplay',
        () => {
          announce();
          sync();
        },
        options,
      );
      element.addEventListener('waiting', () => announce('Се вчитува…', true), options);
      element.addEventListener('seeking', () => announce('Се вчитува…', true), options);
      element.addEventListener('seeked', () => announce(), options);
      element.addEventListener(
        'error',
        () => {
          announce('Видеото не може да се вчита. Пробај повторно или избери друг проект.');
          start.hidden = true;
          seek.disabled = true;
          toggle.disabled = true;
          retry.hidden = false;
        },
        options,
      );
      element.addEventListener('click', () => void playPause(), options);
      toggle.disabled = false;
      element.src = card.dataset.src ?? '';
      content.append(element);
      sync();
      // Start muted; browsers that block playback leave an explicit play action.
      void playPause();
    } else {
      const image = document.createElement('img');
      image.alt = card.dataset.title ?? '';
      image.decoding = 'async';
      image.addEventListener('load', () => announce(), options);
      image.addEventListener(
        'error',
        () => {
          announce('Фотографијата не може да се вчита. Пробај повторно или избери друг проект.');
          retry.hidden = false;
        },
        options,
      );
      image.src = card.dataset.src ?? '';
      content.append(image);
    }
  };
  cards.forEach((card) =>
    card.addEventListener('click', () => {
      if (dialog.open) return;
      opener = card;
      activeCards = cards.filter((item) => !item.closest<HTMLElement>('.project-card')?.hidden);
      scrollY = window.scrollY;
      oldOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      dialog.showModal();
      show(activeCards.indexOf(card));
      viewer.focus({ preventScroll: true });
    }),
  );
  const close = async () => {
    if (document.fullscreenElement === viewer) {
      try {
        requestedFullscreenExit = true;
        await document.exitFullscreen();
      } catch {
        /* Closing remains available. */
      }
    }
    dialog.close();
  };
  get('.media-close').addEventListener('click', () => void close());
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    void close();
  });
  dialog.addEventListener('close', () => {
    releaseMedia();
    document.body.style.overflow = oldOverflow;
    window.scrollTo({ top: scrollY, behavior: 'instant' });
    opener?.focus({ preventScroll: true });
  });
  previous.addEventListener('click', () => show(index - 1));
  next.addEventListener('click', () => show(index + 1));
  toggle.addEventListener('click', () => void playPause());
  start.addEventListener('click', () => void playPause());
  retry.addEventListener('click', () => {
    show(index);
    viewer.focus({ preventScroll: true });
  });
  mute.addEventListener('click', () => {
    if (!video) return;
    video.muted = !(video.muted || video.volume === 0);
    if (!video.muted && video.volume === 0) video.volume = rememberedVolume || 0.7;
    revealControls();
  });
  volume.addEventListener('input', () => {
    if (!video) return;
    video.volume = Number(volume.value);
    video.muted = video.volume === 0;
    rememberedVolume = video.volume;
    revealControls();
  });
  seek.addEventListener('pointerdown', () => {
    scrubbing = true;
    revealControls();
  });
  const stopScrubbing = () => {
    scrubbing = false;
    sync();
    revealControls();
  };
  seek.addEventListener('pointerup', stopScrubbing);
  seek.addEventListener('pointercancel', stopScrubbing);
  seek.addEventListener('change', stopScrubbing);
  seek.addEventListener('input', () => {
    if (video && Number.isFinite(video.duration))
      video.currentTime = (Number(seek.value) / 100) * video.duration;
    seek.style.setProperty('--progress', `${seek.value}%`);
    revealControls();
  });
  fullscreen.addEventListener('click', () => void changeFullscreen());
  document.addEventListener('fullscreenchange', () => {
    const active = document.fullscreenElement === viewer;
    fullscreen.setAttribute('aria-pressed', String(active));
    // Browsers consume Escape before dispatching a key event in native fullscreen.
    // An explicit F/button exit keeps the viewer open; a native Escape closes it.
    if (wasFullscreen && !active && !requestedFullscreenExit && dialog.open) dialog.close();
    wasFullscreen = active;
    if (!active) requestedFullscreenExit = false;
  });
  viewer.addEventListener('pointermove', revealControls);
  viewer.addEventListener('pointerdown', revealControls);
  viewer.addEventListener('focusin', revealControls);
  viewer.addEventListener('focusout', () => setTimeout(revealControls, 0));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      void close();
      return;
    }
    // Range inputs retain their native arrow keys; buttons retain Space activation.
    if (event.target instanceof HTMLElement && event.target.matches('input,textarea,select'))
      return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(index + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.code === 'Space' && !(event.target instanceof HTMLButtonElement)) {
      event.preventDefault();
      void playPause();
    } else if (event.key.toLowerCase() === 'm' && video) {
      event.preventDefault();
      mute.click();
    } else if (event.key.toLowerCase() === 'f') {
      event.preventDefault();
      void changeFullscreen();
    }
  });
  stage.addEventListener(
    'touchstart',
    (event) => {
      if (
        event.touches.length !== 1 ||
        (event.target instanceof Element && event.target.closest('button'))
      )
        return;
      const touch = event.touches[0];
      touchStart = { x: touch.clientX, y: touch.clientY, time: Date.now() };
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchend',
    (event) => {
      if (!touchStart || !event.changedTouches.length) return;
      const touch = event.changedTouches[0];
      const dx = touch.clientX - touchStart.x,
        dy = touch.clientY - touchStart.y;
      if (
        Date.now() - touchStart.time < 800 &&
        Math.abs(dx) > 70 &&
        Math.abs(dx) > Math.abs(dy) * 1.5
      )
        show(index + (dx < 0 ? 1 : -1));
      touchStart = undefined;
    },
    { passive: true },
  );
  stage.addEventListener(
    'touchcancel',
    () => {
      touchStart = undefined;
    },
    { passive: true },
  );
});
