const ACCESS_CODE = "2610";
const compactDevice = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches;

const body = document.body;
const lockScreen = document.getElementById("lockScreen");
const lockCard = document.querySelector(".lock-card");
const pinForm = document.getElementById("pinForm");
const pinInput = document.getElementById("pinInput");
const pinDots = [...document.querySelectorAll(".pin-dots span")];
const lockError = document.getElementById("lockError");
const site = document.getElementById("site");
let pin = "";
let pinCheckTimer;

function renderPin(clearError = true) {
  pinInput.value = pin;
  pinDots.forEach((dot, index) => dot.classList.toggle("filled", index < pin.length));
  if (clearError) lockError.textContent = "";
}

function addDigit(digit) {
  if (pin.length >= 4) return;
  pin += digit;
  renderPin();
  schedulePinCheck();
}

function schedulePinCheck() {
  clearTimeout(pinCheckTimer);
  if (pin.length === 4) pinCheckTimer = setTimeout(checkPin, 180);
}

function unlockSite() {
  lockScreen.classList.add("unlocked");
  site.classList.add("visible");
  site.setAttribute("aria-hidden", "false");
  body.classList.remove("locked");
  sessionStorage.setItem("zm-unlocked", "yes");
  createHeartBurst(window.innerWidth / 2, window.innerHeight / 2, compactDevice ? 10 : 22);
  setTimeout(() => document.querySelector(".hero .reveal")?.classList.add("in-view"), 400);
}

function checkPin() {
  clearTimeout(pinCheckTimer);
  if (pin === ACCESS_CODE) {
    unlockSite();
    return;
  }
  lockError.textContent = "Bu kod bizim sirrimiz deyil. Bir də düşün ♡";
  lockCard.classList.remove("shake");
  void lockCard.offsetWidth;
  lockCard.classList.add("shake");
  pin = "";
  setTimeout(() => renderPin(false), 400);
  setTimeout(() => { lockError.textContent = ""; }, 2600);
}

document.querySelectorAll("[data-key]").forEach((button) => {
  button.addEventListener("click", () => addDigit(button.dataset.key));
});
document.querySelector("[data-clear]").addEventListener("click", () => {
  pin = pin.slice(0, -1);
  renderPin();
});
pinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  pin = pinInput.value.replace(/\D/g, "").slice(0, 4);
  checkPin();
});
pinInput.addEventListener("input", () => {
  pin = pinInput.value.replace(/\D/g, "").slice(0, 4);
  renderPin();
  schedulePinCheck();
});
document.addEventListener("keydown", (event) => {
  if (!body.classList.contains("locked")) return;
  if (event.target === pinInput) {
    if (event.key === "Enter") {
      event.preventDefault();
      pinForm.requestSubmit();
    }
    return;
  }
  if (/^[0-9]$/.test(event.key)) addDigit(event.key);
  if (event.key === "Backspace") {
    pin = pin.slice(0, -1);
    renderPin();
  }
  if (event.key === "Enter") checkPin();
});

if (sessionStorage.getItem("zm-unlocked") === "yes") unlockSite();

function daysSince(dateString) {
  const [startYear, startMonth, startDay] = dateString.split("-").map(Number);
  const bakuParts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Baku",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(new Date());
  const part = (type) => Number(bakuParts.find((item) => item.type === type).value);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const today = Date.UTC(part("year"), part("month") - 1, part("day"));
  return Math.max(0, Math.floor((today - start) / 86400000));
}

const knownDays = document.getElementById("knownDays");
const closeDays = document.getElementById("closeDays");
if (knownDays) knownDays.textContent = daysSince("2024-04-13");
if (closeDays) closeDays.textContent = daysSince("2026-05-28");

const topbar = document.getElementById("topbar");
const nav = document.getElementById("nav");
const menuButton = document.getElementById("menuButton");
window.addEventListener("scroll", () => topbar.classList.toggle("scrolled", window.scrollY > 40), { passive: true });

function closeMenu() {
  nav.classList.remove("open");
  menuButton.classList.remove("open");
  menuButton.setAttribute("aria-expanded", "false");
  menuButton.setAttribute("aria-label", "Menyunu aç");
  body.classList.remove("menu-open");
}

menuButton.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  menuButton.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
  menuButton.setAttribute("aria-label", open ? "Menyunu bağla" : "Menyunu aç");
  body.classList.toggle("menu-open", open);
});
nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("click", (event) => {
  if (!nav.classList.contains("open")) return;
  if (!nav.contains(event.target) && !menuButton.contains(event.target)) closeMenu();
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("in-view");
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: "0px 0px -30px" });
document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));

const sections = [...document.querySelectorAll("main section[id]")];
const navLinks = [...nav.querySelectorAll("a")];
const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${entry.target.id}`));
  });
}, { rootMargin: "-40% 0px -50%" });
sections.forEach((section) => sectionObserver.observe(section));

const floatingHearts = document.getElementById("floatingHearts");
function createFloatingHeart(x = Math.random() * window.innerWidth, y = window.innerHeight + 20) {
  const heart = document.createElement("span");
  heart.className = "float-heart";
  heart.textContent = Math.random() > 0.3 ? "♡" : "♥";
  heart.style.left = `${x}px`;
  heart.style.bottom = `${Math.max(0, window.innerHeight - y)}px`;
  heart.style.fontSize = `${12 + Math.random() * 24}px`;
  heart.style.setProperty("--duration", `${4 + Math.random() * 4}s`);
  heart.style.setProperty("--drift", `${-80 + Math.random() * 160}px`);
  heart.style.setProperty("--rotate", `${-90 + Math.random() * 180}deg`);
  floatingHearts.appendChild(heart);
  heart.addEventListener("animationend", () => heart.remove());
}

function createHeartBurst(x, y, count = 15) {
  for (let i = 0; i < count; i += 1) {
    setTimeout(() => createFloatingHeart(x + (Math.random() - 0.5) * 180, y + (Math.random() - 0.5) * 90), i * 45);
  }
}

let heartRainTimer;
const heartMode = document.getElementById("heartMode");
heartMode.addEventListener("click", () => {
  const active = heartMode.getAttribute("aria-pressed") !== "true";
  heartMode.setAttribute("aria-pressed", String(active));
  clearInterval(heartRainTimer);
  if (active) {
    createHeartBurst(window.innerWidth / 2, window.innerHeight * 0.8, compactDevice ? 9 : 18);
    heartRainTimer = setInterval(() => createFloatingHeart(), compactDevice ? 900 : 520);
  }
});
document.getElementById("replayHearts").addEventListener("click", (event) => {
  const rect = event.currentTarget.getBoundingClientRect();
  createHeartBurst(rect.left + rect.width / 2, rect.top, compactDevice ? 14 : 28);
});

let heartClicks = 0;
let easterTimeout;
const mainHeart = document.getElementById("mainHeart");
const easterMessage = document.getElementById("easterMessage");
mainHeart.addEventListener("click", (event) => {
  heartClicks += 1;
  createHeartBurst(event.clientX, event.clientY, compactDevice ? 5 : 9);
  mainHeart.animate([
    { transform: "scale(1)" },
    { transform: "scale(1.12)" },
    { transform: "scale(1)" }
  ], { duration: 430, easing: "ease-out" });
  if (heartClicks >= 5) {
    easterMessage.classList.add("show");
    clearTimeout(easterTimeout);
    easterTimeout = setTimeout(() => easterMessage.classList.remove("show"), 5200);
    heartClicks = 0;
  }
});

const noteModal = document.getElementById("noteModal");
const noteModalText = document.getElementById("noteModalText");
let lastModalTrigger;
function openNote(text) {
  lastModalTrigger = document.activeElement;
  noteModalText.textContent = text;
  noteModal.hidden = false;
  body.style.overflow = "hidden";
  noteModal.querySelector(".modal-close").focus();
}
function closeNote() {
  noteModal.hidden = true;
  body.style.overflow = "";
  if (lastModalTrigger instanceof HTMLElement) lastModalTrigger.focus();
}
document.querySelectorAll("[data-note]").forEach((note) => note.addEventListener("click", () => openNote(note.dataset.note)));
document.getElementById("openFirstNote").addEventListener("click", () => openNote("Səninlə aramızdakı şeyin adını bilmirəm. Bəlkə də ad qoysaq, onu kiçiltmiş olarıq. Bildiyim budur: çox insanla tanış olursan, amma yalnız bir neçəsi düşüncələrinin səsini dəyişir. Sən mənim üçün elə birisən."));
document.querySelectorAll("[data-secret]").forEach((door) => {
  door.addEventListener("click", () => {
    door.classList.add("opened");
    const hint = door.querySelector("small");
    if (hint) hint.textContent = "Qapı açıldı";
    openNote(door.dataset.secret);
    const rect = door.getBoundingClientRect();
    createHeartBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 12);
  });
});
document.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", closeNote));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !noteModal.hidden) closeNote();
  else if (event.key === "Escape" && nav.classList.contains("open")) closeMenu();
  if (event.key !== "Tab" || noteModal.hidden) return;
  const focusable = [...noteModal.querySelectorAll("button, [href], input, [tabindex]:not([tabindex='-1'])")]
    .filter((element) => !element.hidden && !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

document.querySelectorAll("[data-photo-slot]").forEach((slot) => {
  const input = slot.querySelector("input");
  slot.addEventListener("click", (event) => {
    if (event.target !== input) input.click();
  });
  input.addEventListener("change", () => {
    const [file] = input.files;
    if (!file) return;
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const shape = slot.querySelector(".photo-shape");
      shape.style.backgroundImage = `url("${reader.result}")`;
      slot.classList.add("has-photo");
      slot.querySelector("small").textContent = "dəyişmək üçün yenə toxun";
    });
    reader.readAsDataURL(file);
  });
});

const cursorGlow = document.querySelector(".cursor-glow");
if (window.matchMedia("(pointer: fine)").matches) {
  document.addEventListener("mousemove", (event) => {
    cursorGlow.style.left = `${event.clientX}px`;
    cursorGlow.style.top = `${event.clientY}px`;
    cursorGlow.style.opacity = "1";

    const heroArt = document.querySelector(".hero-art");
    if (heroArt && window.scrollY < window.innerHeight) {
      const x = (event.clientX / window.innerWidth - 0.5) * 12;
      const y = (event.clientY / window.innerHeight - 0.5) * 12;
      heroArt.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    }
  });
  document.addEventListener("mouseleave", () => { cursorGlow.style.opacity = "0"; });
}

const particleField = document.getElementById("particleField");
if (particleField) {
  const particleCount = compactDevice ? 16 : 42;
  for (let index = 0; index < particleCount; index += 1) {
    const particle = document.createElement("i");
    particle.className = "mystery-particle";
    particle.style.left = `${Math.random() * 100}%`;
    particle.style.setProperty("--particle-speed", `${8 + Math.random() * 13}s`);
    particle.style.setProperty("--particle-delay", `${-Math.random() * 18}s`);
    particle.style.setProperty("--particle-drift", `${-90 + Math.random() * 180}px`);
    particle.style.setProperty("--particle-color", index % 3 === 0 ? "#cf1f32" : index % 3 === 1 ? "#1ca3af" : "#773527");
    particleField.appendChild(particle);
  }
}

document.addEventListener("visibilitychange", () => {
  if (!document.hidden) return;
  clearInterval(heartRainTimer);
  heartMode.setAttribute("aria-pressed", "false");
});
