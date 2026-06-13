const tracks = Array.isArray(window.ZM_TRACKS) ? window.ZM_TRACKS : [];
const audio = document.getElementById("audioPlayer");
const playButton = document.getElementById("playButton");
const previousButton = document.getElementById("previousTrack");
const nextButton = document.getElementById("nextTrack");
const vinyl = document.getElementById("vinyl");
const tonearm = document.getElementById("tonearm");
const playerStatus = document.getElementById("playerStatus");
const favoriteTrack = document.getElementById("favoriteTrack");
const trackList = document.getElementById("trackList");
const trackSeek = document.getElementById("trackSeek");
const trackProgress = document.getElementById("trackProgress");
const syncedLyrics = document.getElementById("syncedLyrics");
const lyricsPlaceholder = document.getElementById("lyricsPlaceholder");
const lyricsEmpty = document.getElementById("lyricsEmpty");
const trackMood = document.getElementById("trackMood");
const trackPosition = document.getElementById("trackPosition");
let currentTrack = 0;
let currentLyric = -1;
let sourceCandidates = [];
let sourceIndex = 0;
let shouldAutoplay = false;
let audioSourceReady = false;
let favoriteTracks = new Set();
const reduceMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

try {
  const savedFavorites = JSON.parse(localStorage.getItem("zm-favorite-tracks") || "[]");
  if (Array.isArray(savedFavorites)) favoriteTracks = new Set(savedFavorites);
} catch {
  favoriteTracks = new Set();
}

function trackId(track) {
  return `${track.title || "track"}::${track.artist || "ZM"}`;
}

function updateFavoriteButton() {
  if (!tracks.length) return;
  const active = favoriteTracks.has(trackId(tracks[currentTrack]));
  favoriteTrack.setAttribute("aria-pressed", String(active));
  favoriteTrack.setAttribute("aria-label", active ? "Mahnını sevimlilərdən çıxar" : "Mahnını sevimli et");
  favoriteTrack.textContent = active ? "♥" : "♡";
}

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function desktopTrackSource(track) {
  if (window.location.protocol !== "file:" || !track.fileName) return null;
  try {
    return new URL(
      `../../Desktop/${encodeURIComponent(track.fileName)}`,
      window.location.href,
    ).href;
  } catch {
    return null;
  }
}

function getTrackSources(track) {
  const localPageSources =
    window.location.protocol === "file:"
      ? [desktopTrackSource(track), track.src, track.portableSrc]
      : [track.portableSrc];
  return [...new Set([track.attachedSrc, ...localPageSources].filter(Boolean))];
}

function setPlaying(playing) {
  vinyl.classList.toggle("playing", playing);
  tonearm.classList.toggle("playing", playing);
  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute(
    "aria-label",
    playing ? "Mahnını dayandır" : "Mahnını səsləndir",
  );
}

async function startPlayback() {
  try {
    await audio.play();
  } catch (error) {
    console.warn("Audio playback failed", error?.name, error?.message);
    playerStatus.textContent = audio.currentSrc
      ? "Mahnı hazırlanır. Oynat düyməsinə bir dəfə də toxun."
      : "Bu mahnının audio faylı tapılmadı.";
  }
}

function renderTrackList() {
  if (!tracks.length) return;
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const slot = document.createElement("button");
    slot.className = `track-slot${index === currentTrack ? " active" : ""}`;
    slot.type = "button";
    if (index === currentTrack) slot.setAttribute("aria-current", "true");
    slot.dataset.slot = String(index + 1);
    slot.style.setProperty("--slot-accent", track.accent || "#20a9b5");
    slot.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><i></i><b></b><small></small><em>›</em>`;
    slot.querySelector("b").textContent = track.title;
    slot.querySelector("small").textContent =
      `${track.artist || "Naməlum ifaçı"} · ${track.duration || "--:--"}`;
    slot.addEventListener("click", () => loadTrack(index, true));
    trackList.appendChild(slot);
  });
  document.querySelector(".panel-title>span").textContent =
    `${String(tracks.length).padStart(2, "0")} TRACKS`;
  const statValues = document.querySelectorAll(".music-stats b");
  const totalDuration = tracks.reduce(
    (total, track) => total + (track.durationSeconds || 0),
    0,
  );
  if (statValues[0])
    statValues[0].textContent = String(tracks.length).padStart(2, "0");
  if (statValues[1]) statValues[1].textContent = formatTime(totalDuration);
}

function renderLyrics(track) {
  const lyrics = Array.isArray(track.lyrics) ? track.lyrics : [];
  syncedLyrics.innerHTML = "";
  syncedLyrics.scrollTop = 0;
  currentLyric = -1;
  const hasLyrics = lyrics.length > 0;
  // Show the empty explanatory message when there are no lyrics; hide the decorative placeholder.
  lyricsPlaceholder.hidden = true;
  lyricsEmpty.hidden = hasLyrics;
  document.getElementById("lyricsIndex").textContent = hasLyrics
    ? `LYRICS // ${String(lyrics.length).padStart(2, "0")} LINES`
    : "LYRICS // EMPTY";

  lyrics.forEach((line) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = "lyric-line";
    row.innerHTML = `<time>${formatTime(line.time)}</time><span></span>`;
    row.querySelector("span").textContent = line.text;
    row.addEventListener("click", () => {
      audio.currentTime = line.time;
      audio.play().catch(() => {});
    });
    syncedLyrics.appendChild(row);
  });

  document.getElementById("favoriteLineTime").textContent =
    `FAVORITE LINE // ${formatTime(track.favoriteAt || 0)}`;
  document.getElementById("favoriteLineText").textContent = track.favoriteLine
    ? `“${track.favoriteLine}”`
    : "“Bizi ən yaxşı izah edən misra hələ seçilməyib.”";
  document.getElementById("favoriteLineNote").textContent =
    track.favoriteNote || "Sevdiyiniz cümləni ayrıca vurğulayacağıq.";
  document.getElementById("meaningTitle").textContent =
    track.meaningTitle ||
    "Bu mahnının sizə nəyi xatırlatdığı burada yaşayacaq.";
  document.getElementById("meaningText").textContent =
    track.meaning ||
    "Tarix, yer, həmin günün əhvalı və mahnının niyə sizə aid olduğu üçün geniş qeyd sahəsi hazırdır.";
}

function loadTrack(index, autoplay = false) {
  if (!tracks.length) return;
  currentTrack = (index + tracks.length) % tracks.length;
  const track = tracks[currentTrack];
  sourceCandidates = getTrackSources(track);
  sourceIndex = 0;
  shouldAutoplay = autoplay;
  audioSourceReady = false;
  if (sourceCandidates.length) {
    audio.src = sourceCandidates[sourceIndex];
    audio.load();
  } else {
    audio.removeAttribute("src");
    audio.load();
  }
  document.getElementById("trackNumber").textContent =
    `MAHNI // ${String(currentTrack + 1).padStart(2, "0")}`;
  document.getElementById("trackTitle").textContent = track.title;
  document.getElementById("trackArtist").textContent =
    track.artist || "Naməlum ifaçı";
  trackMood.textContent = track.mood || "Bizim mahnımız";
  trackPosition.textContent = `${String(currentTrack + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
  document.documentElement.style.setProperty(
    "--track-accent",
    track.accent || "#20a9b5",
  );
  document.documentElement.style.setProperty(
    "--track-accent-soft",
    track.accentSoft || "#6a2b20",
  );
  document.querySelector(".vinyl-label small").textContent =
    `TRACK ${String(currentTrack + 1).padStart(2, "0")}`;
  document
    .querySelectorAll(".track-slot")
    .forEach((slot, slotIndex) => {
      const active = slotIndex === currentTrack;
      slot.classList.toggle("active", active);
      if (active) slot.setAttribute("aria-current", "true");
      else slot.removeAttribute("aria-current");
    });
  updateFavoriteButton();
  renderLyrics(track);
  playerStatus.textContent = autoplay
    ? "Mahnı hazırlanır..."
    : "Mahnı seçildi.";
  if (autoplay && sourceCandidates.length) {
    audio.play().catch(() => {
      playerStatus.textContent =
        "Səs hazır deyil. Oynat düyməsinə yenidən toxun.";
    });
  }

  if ("mediaSession" in navigator && "MediaMetadata" in window) {
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist || "ZM",
      album: "Bizim mahnılarımız",
    });
  }
}

function updateLyrics() {
  if (!tracks.length) return;
  const lyrics = tracks[currentTrack].lyrics || [];
  let active = -1;
  for (let index = 0; index < lyrics.length; index += 1) {
    if (audio.currentTime >= lyrics[index].time) active = index;
    else break;
  }
  if (active === currentLyric) return;
  currentLyric = active;
  const lines = [...syncedLyrics.querySelectorAll(".lyric-line")];
  lines.forEach((line, index) => {
    const isCurrent = index === active;
    line.classList.toggle("current", isCurrent);
    line.classList.toggle("past", index < active);
    if (isCurrent) line.setAttribute("aria-current", "true");
    else line.removeAttribute("aria-current");
  });
  const activeLine = lines[active];
  if (activeLine) {
    const maxScroll = Math.max(
      0,
      syncedLyrics.scrollHeight - syncedLyrics.clientHeight,
    );
    const target = Math.min(
      maxScroll,
      Math.max(
        0,
        activeLine.offsetTop -
          (syncedLyrics.clientHeight - activeLine.offsetHeight) / 2,
      ),
    );

    if (Math.abs(syncedLyrics.scrollTop - target) > 12) {
      syncedLyrics.scrollTo({
        top: Math.round(target),
        behavior: reduceMotion ? "auto" : "smooth",
      });
    }
  }
}

playButton.addEventListener("click", () => {
  if (!tracks.length) {
    playerStatus.textContent = "Playlist boşdur.";
    return;
  }
  if (audio.paused) startPlayback();
  else audio.pause();
});

previousButton.addEventListener("click", () =>
  loadTrack(currentTrack - 1, true),
);
nextButton.addEventListener("click", () => loadTrack(currentTrack + 1, true));
audio.addEventListener("play", () => {
  shouldAutoplay = false;
  audioSourceReady = true;
  setPlaying(true);
  playerStatus.textContent = "İndi səslənir.";
});
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("loadedmetadata", () => {
  audioSourceReady = true;
  document.getElementById("totalTime").textContent = formatTime(audio.duration);
  trackSeek.setAttribute("aria-valuemax", String(Math.round(audio.duration || 0)));
});
audio.addEventListener("canplay", () => {
  audioSourceReady = true;
  if (!shouldAutoplay) return;
  audio.play().catch(() => {
    playerStatus.textContent = "Oynat düyməsinə toxun.";
  });
});
audio.addEventListener("timeupdate", () => {
  document.getElementById("currentTime").textContent = formatTime(
    audio.currentTime,
  );
  trackProgress.style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
  trackSeek.setAttribute("aria-valuenow", String(Math.round(audio.currentTime)));
  trackSeek.setAttribute("aria-valuetext", `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`);
  updateLyrics();
});
audio.addEventListener("ended", () => loadTrack(currentTrack + 1, true));
audio.addEventListener("error", () => {
  if (sourceIndex < sourceCandidates.length - 1) {
    sourceIndex += 1;
    audio.src = sourceCandidates[sourceIndex];
    audio.load();
    if (shouldAutoplay) audio.play().catch(() => {});
    return;
  }
  audioSourceReady = false;
  playerStatus.textContent = "Bu mahnının audio faylı tapılmadı.";
  setPlaying(false);
});

trackSeek.addEventListener("click", (event) => {
  if (!audio.duration || event.detail === 0) return;
  const rect = trackSeek.getBoundingClientRect();
  audio.currentTime =
    ((event.clientX - rect.left) / rect.width) * audio.duration;
});
trackSeek.setAttribute("role", "slider");
trackSeek.setAttribute("aria-valuemin", "0");
trackSeek.setAttribute("aria-valuemax", "0");
trackSeek.setAttribute("aria-valuenow", "0");
trackSeek.addEventListener("keydown", (event) => {
  if (!audio.duration) return;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();
  if (event.key === "Home") audio.currentTime = 0;
  else if (event.key === "End") audio.currentTime = audio.duration;
  else audio.currentTime = Math.min(
    audio.duration,
    Math.max(0, audio.currentTime + (event.key === "ArrowRight" ? 5 : -5)),
  );
});

favoriteTrack.addEventListener("click", () => {
  if (!tracks.length) return;
  const id = trackId(tracks[currentTrack]);
  const active = !favoriteTracks.has(id);
  if (active) favoriteTracks.add(id);
  else favoriteTracks.delete(id);
  try {
    localStorage.setItem("zm-favorite-tracks", JSON.stringify([...favoriteTracks]));
  } catch {
    // Favorites still work for this visit when storage is unavailable.
  }
  updateFavoriteButton();
  playerStatus.textContent = active
    ? "Bu mahnı sevimlilərə əlavə edildi."
    : "Sevimli işarəsi götürüldü.";
});

const lyricsTabs = [...document.querySelectorAll("[data-lyrics-tab]")];

function activateLyricsTab(tab, moveFocus = false) {
  lyricsTabs.forEach((item) => {
    const active = item === tab;
    item.classList.toggle("active", active);
    item.setAttribute("aria-selected", String(active));
    item.tabIndex = active ? 0 : -1;
  });
  document.querySelectorAll("[data-lyrics-panel]").forEach((panel) => {
    const active = panel.dataset.lyricsPanel === tab.dataset.lyricsTab;
    panel.classList.toggle("active", active);
    panel.setAttribute("aria-hidden", String(!active));
  });
  if (moveFocus) tab.focus();
}

lyricsTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => activateLyricsTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    let nextIndex = index;
    if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = lyricsTabs.length - 1;
    else nextIndex = (index + (event.key === "ArrowRight" ? 1 : -1) + lyricsTabs.length) % lyricsTabs.length;
    activateLyricsTab(lyricsTabs[nextIndex], true);
  });
});

if (lyricsTabs[0]) activateLyricsTab(lyricsTabs[0]);

renderTrackList();
if (tracks.length) loadTrack(0);
