/* White-Collar Horse — article audio player
 * Progressive enhancement over a native <audio> element.
 * When data-audio is empty (no narration yet) the player shows a
 * "Coming soon" state and the controls are inert. When an MP3 URL is
 * set on #listen-player[data-audio], the player becomes fully live:
 * play/pause, scrub, time, speed cycling, and chapter jumps.
 *
 * Chapter jumps use a data-attribute map of section-id -> start seconds.
 * Until the real narration exists these are placeholders; once the MP3
 * is generated we set CHAPTER_TIMES with the true timestamps.
 */
(function () {
  var root = document.getElementById('listen-player');
  if (!root) return;

  var audioEl   = root.querySelector('.lp-audio');
  var playBtn   = root.querySelector('.lp-play');
  var scrub     = root.querySelector('.lp-scrub');
  var curEl     = root.querySelector('.lp-current');
  var totEl     = root.querySelector('.lp-total');
  var speedBtn  = root.querySelector('.lp-speed');
  var chapSel   = root.querySelector('.lp-chapters');
  var badge     = root.querySelector('.lp-badge');

  var src = (root.getAttribute('data-audio') || '').trim();
  var hasAudio = src.length > 0;

  // Chapter start times (seconds). Filled in when the real narration exists.
  // Format: { 'section-id': seconds }. Empty => chapter jump scrolls the page instead.
  var CHAPTER_TIMES = {};
  try {
    if (root.getAttribute('data-chapters')) {
      CHAPTER_TIMES = JSON.parse(root.getAttribute('data-chapters'));
    }
  } catch (e) { CHAPTER_TIMES = {}; }

  var SPEEDS = [1, 1.25, 1.5, 1.75, 2, 0.75];
  var speedIdx = 0;

  function fmt(t) {
    if (!isFinite(t) || t < 0) t = 0;
    var m = Math.floor(t / 60);
    var s = Math.floor(t % 60);
    return m + ':' + (s < 10 ? '0' : '') + s;
  }

  function trackEvent(name, params) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', name, params || {});
    }
  }

  // ---- Placeholder mode: no narration yet ----
  if (!hasAudio) {
    playBtn.setAttribute('disabled', 'disabled');
    playBtn.style.opacity = '0.55';
    playBtn.style.cursor = 'not-allowed';
    scrub.setAttribute('disabled', 'disabled');
    speedBtn.setAttribute('disabled', 'disabled');
    speedBtn.style.opacity = '0.55';

    // Chapters still work as page navigation even without audio.
    chapSel.addEventListener('change', function () {
      var id = chapSel.value;
      if (id) {
        var target = document.getElementById(id);
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        chapSel.value = '';
      }
    });
    return;
  }

  // ---- Live mode: narration present ----
  if (badge) badge.style.display = 'none';
  audioEl.src = src;

  function setPlaying(p) {
    playBtn.classList.toggle('is-playing', p);
    playBtn.setAttribute('aria-label', p ? 'Pause narration' : 'Play narration');
  }

  playBtn.addEventListener('click', function () {
    if (audioEl.paused) {
      audioEl.play();
    } else {
      audioEl.pause();
    }
  });

  audioEl.addEventListener('play', function () {
    setPlaying(true);
    trackEvent('wch_audio_play', { article: 'white-collar-horse' });
  });
  audioEl.addEventListener('pause', function () { setPlaying(false); });
  audioEl.addEventListener('ended', function () {
    setPlaying(false);
    trackEvent('wch_audio_complete', { article: 'white-collar-horse' });
  });

  audioEl.addEventListener('loadedmetadata', function () {
    totEl.textContent = fmt(audioEl.duration);
    scrub.max = audioEl.duration;
  });

  var scrubbing = false;
  audioEl.addEventListener('timeupdate', function () {
    if (scrubbing) return;
    curEl.textContent = fmt(audioEl.currentTime);
    scrub.value = audioEl.currentTime;
  });

  scrub.addEventListener('input', function () {
    scrubbing = true;
    curEl.textContent = fmt(parseFloat(scrub.value));
  });
  scrub.addEventListener('change', function () {
    audioEl.currentTime = parseFloat(scrub.value);
    scrubbing = false;
  });

  speedBtn.addEventListener('click', function () {
    speedIdx = (speedIdx + 1) % SPEEDS.length;
    var rate = SPEEDS[speedIdx];
    audioEl.playbackRate = rate;
    speedBtn.innerHTML = (rate % 1 === 0 ? rate : rate) + '&times;';
  });

  chapSel.addEventListener('change', function () {
    var id = chapSel.value;
    if (!id) return;
    if (CHAPTER_TIMES.hasOwnProperty(id)) {
      audioEl.currentTime = CHAPTER_TIMES[id];
      if (audioEl.paused) audioEl.play();
      trackEvent('wch_audio_chapter', { chapter: id });
    } else {
      // No timestamp map yet: fall back to scrolling the page.
      var target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    chapSel.value = '';
  });
})();
