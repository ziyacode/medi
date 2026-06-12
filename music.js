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
let currentTrack = 0;
let currentLyric = -1;

function formatTime(value) {
  if (!Number.isFinite(value)) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function setPlaying(playing) {
  vinyl.classList.toggle("playing", playing);
  tonearm.classList.toggle("playing", playing);
  playButton.textContent = playing ? "Ⅱ" : "▶";
  playButton.setAttribute("aria-label", playing ? "Mahnını dayandır" : "Mahnını səsləndir");
}

function renderTrackList() {
  if (!tracks.length) return;
  trackList.innerHTML = "";
  tracks.forEach((track, index) => {
    const slot = document.createElement("button");
    slot.className = `track-slot${index === currentTrack ? " active" : ""}`;
    slot.type = "button";
    slot.dataset.slot = String(index + 1);
    slot.innerHTML = `<span>${String(index + 1).padStart(2, "0")}</span><i></i><b></b><small></small><em>›</em>`;
    slot.querySelector("b").textContent = track.title;
    slot.querySelector("small").textContent = `${track.artist || "Naməlum ifaçı"} · ${track.duration || "--:--"}`;
    slot.addEventListener("click", () => loadTrack(index, true));
    trackList.appendChild(slot);
  });
  document.querySelector(".panel-title>span").textContent = `${String(tracks.length).padStart(2, "0")} TRACKS`;
  document.querySelector(".music-stats b").textContent = String(tracks.length).padStart(2, "0");
}

function renderLyrics(track) {
  const lyrics = Array.isArray(track.lyrics) ? track.lyrics : [];
  syncedLyrics.innerHTML = "";
  currentLyric = -1;
  lyricsPlaceholder.hidden = lyrics.length > 0;
  lyricsEmpty.hidden = lyrics.length > 0;
  document.getElementById("lyricsIndex").textContent = lyrics.length ? `LYRICS // ${String(lyrics.length).padStart(2, "0")} LINES` : "LYRICS // EMPTY";

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

  document.getElementById("favoriteLineTime").textContent = `FAVORITE LINE // ${formatTime(track.favoriteAt || 0)}`;
  document.getElementById("favoriteLineText").textContent = track.favoriteLine ? `“${track.favoriteLine}”` : "“Bizi ən yaxşı izah edən misra hələ seçilməyib.”";
  document.getElementById("favoriteLineNote").textContent = track.favoriteNote || "Sevdiyiniz cümləni ayrıca vurğulayacağıq.";
  document.getElementById("meaningTitle").textContent = track.meaningTitle || "Bu mahnının sizə nəyi xatırlatdığı burada yaşayacaq.";
  document.getElementById("meaningText").textContent = track.meaning || "Tarix, yer, həmin günün əhvalı və mahnının niyə sizə aid olduğu üçün geniş qeyd sahəsi hazırdır.";
}

function loadTrack(index, autoplay = false) {
  if (!tracks.length) return;
  currentTrack = (index + tracks.length) % tracks.length;
  const track = tracks[currentTrack];
  audio.src = track.src;
  audio.load();
  document.getElementById("trackNumber").textContent = `MAHNI // ${String(currentTrack + 1).padStart(2, "0")}`;
  document.getElementById("trackTitle").textContent = track.title;
  document.getElementById("trackArtist").textContent = track.artist || "Naməlum ifaçı";
  document.querySelector(".vinyl-label small").textContent = `TRACK ${String(currentTrack + 1).padStart(2, "0")}`;
  document.querySelectorAll(".track-slot").forEach((slot, slotIndex) => slot.classList.toggle("active", slotIndex === currentTrack));
  renderLyrics(track);
  playerStatus.textContent = autoplay ? "Mahnı hazırlanır..." : "Mahnı seçildi.";
  if (autoplay) audio.play().catch(() => { playerStatus.textContent = "Səsləndirmək üçün oynat düyməsinə toxun."; });
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
    line.classList.toggle("current", index === active);
    line.classList.toggle("past", index < active);
  });
  lines[active]?.scrollIntoView({ behavior: "smooth", block: "center" });
}

playButton.addEventListener("click", () => {
  if (!tracks.length) {
    playerStatus.textContent = "Əvvəlcə mahnı fayllarını əlavə etmək lazımdır.";
    return;
  }
  if (audio.paused) audio.play().catch(() => { playerStatus.textContent = "Audio faylı açıla bilmədi."; });
  else audio.pause();
});

previousButton.addEventListener("click", () => loadTrack(currentTrack - 1, true));
nextButton.addEventListener("click", () => loadTrack(currentTrack + 1, true));
audio.addEventListener("play", () => { setPlaying(true); playerStatus.textContent = "İndi səslənir."; });
audio.addEventListener("pause", () => setPlaying(false));
audio.addEventListener("loadedmetadata", () => { document.getElementById("totalTime").textContent = formatTime(audio.duration); });
audio.addEventListener("timeupdate", () => {
  document.getElementById("currentTime").textContent = formatTime(audio.currentTime);
  trackProgress.style.width = `${audio.duration ? (audio.currentTime / audio.duration) * 100 : 0}%`;
  updateLyrics();
});
audio.addEventListener("ended", () => loadTrack(currentTrack + 1, true));
audio.addEventListener("error", () => { playerStatus.textContent = "Bu audio faylı tapılmadı və ya açıla bilmədi."; setPlaying(false); });

trackSeek.addEventListener("click", (event) => {
  if (!audio.duration) return;
  const rect = trackSeek.getBoundingClientRect();
  audio.currentTime = ((event.clientX - rect.left) / rect.width) * audio.duration;
});

favoriteTrack.addEventListener("click", () => {
  const active = favoriteTrack.getAttribute("aria-pressed") !== "true";
  favoriteTrack.setAttribute("aria-pressed", String(active));
  favoriteTrack.textContent = active ? "♥" : "♡";
  playerStatus.textContent = active ? "Bu mahnı sevimlilərə əlavə edildi." : "Sevimli işarəsi götürüldü.";
});

document.querySelectorAll("[data-lyrics-tab]").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll("[data-lyrics-tab]").forEach((item) => {
      const active = item === tab;
      item.classList.toggle("active", active);
      item.setAttribute("aria-selected", String(active));
    });
    document.querySelectorAll("[data-lyrics-panel]").forEach((panel) => panel.classList.toggle("active", panel.dataset.lyricsPanel === tab.dataset.lyricsTab));
  });
});

renderTrackList();
if (tracks.length) loadTrack(0);
