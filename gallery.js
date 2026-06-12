const GALLERY_CODE = "2006";
const galleryBody = document.body;
const vaultLock = document.getElementById("vaultLock");
const vaultPanel = document.querySelector(".vault-panel");
const galleryWorld = document.getElementById("galleryWorld");
const galleryPin = document.getElementById("galleryPin");
const vaultDots = [...document.querySelectorAll(".vault-dots i")];
const vaultError = document.getElementById("vaultError");
let vaultValue = "";

function renderVault(clearError = true) {
  galleryPin.value = vaultValue;
  vaultDots.forEach((dot, index) => dot.classList.toggle("on", index < vaultValue.length));
  if (clearError) vaultError.textContent = "";
}

function openGallery() {
  vaultLock.classList.add("open");
  galleryWorld.classList.add("visible");
  galleryWorld.setAttribute("aria-hidden", "false");
  galleryBody.classList.remove("gallery-locked");
  sessionStorage.setItem("zm-gallery-open", "yes");
}

function checkGalleryCode() {
  if (vaultValue === GALLERY_CODE) {
    openGallery();
    return;
  }
  vaultError.textContent = "Arxiv bu rəqəmi tanımadı. Şansını yenə sına.";
  vaultPanel.classList.remove("shake");
  void vaultPanel.offsetWidth;
  vaultPanel.classList.add("shake");
  vaultValue = "";
  setTimeout(() => renderVault(false), 350);
}

document.querySelectorAll("[data-vault-key]").forEach((button) => button.addEventListener("click", () => {
  if (vaultValue.length >= 4) return;
  vaultValue += button.dataset.vaultKey;
  renderVault();
  if (vaultValue.length === 4) setTimeout(checkGalleryCode, 160);
}));
document.querySelector("[data-vault-clear]").addEventListener("click", () => { vaultValue = vaultValue.slice(0, -1); renderVault(); });
document.getElementById("galleryPinForm").addEventListener("submit", (event) => { event.preventDefault(); checkGalleryCode(); });
document.addEventListener("keydown", (event) => {
  if (!galleryBody.classList.contains("gallery-locked")) return;
  if (/^[0-9]$/.test(event.key) && vaultValue.length < 4) { vaultValue += event.key; renderVault(); if (vaultValue.length === 4) setTimeout(checkGalleryCode, 160); }
  if (event.key === "Backspace") { vaultValue = vaultValue.slice(0, -1); renderVault(); }
});

if (sessionStorage.getItem("zm-gallery-open") === "yes") openGallery();

const photos = [...document.querySelectorAll("[data-photo-view]")];
const photoViewer = document.getElementById("photoViewer");
const viewerImage = document.getElementById("viewerImage");
const viewerTitle = document.getElementById("viewerTitle");
const viewerCode = document.getElementById("viewerCode");
const viewerCount = document.getElementById("viewerCount");
let currentPhoto = 0;

function showPhoto(index) {
  currentPhoto = (index + photos.length) % photos.length;
  const photo = photos[currentPhoto];
  const photoClass = [...photo.classList].find((name) => /^photo-\d+$/.test(name));
  viewerImage.className = `viewer-image archive-card ${photoClass || ""}`;
  viewerTitle.textContent = photo.dataset.photoTitle;
  viewerCode.textContent = photo.dataset.photoCode;
  viewerCount.textContent = `${String(currentPhoto + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
  photoViewer.hidden = false;
  document.body.style.overflow = "hidden";
  document.getElementById("viewerClose").focus();
}

function closeViewer() {
  photoViewer.hidden = true;
  document.body.style.overflow = "";
  photos[currentPhoto]?.focus();
}

document.addEventListener("click", (event) => {
  const photo = event.target.closest("[data-photo-view]");
  if (!photo) return;
  const index = photos.indexOf(photo);
  if (index !== -1) showPhoto(index);
});
document.getElementById("viewerClose").addEventListener("click", closeViewer);
document.getElementById("viewerPrev").addEventListener("click", () => showPhoto(currentPhoto - 1));
document.getElementById("viewerNext").addEventListener("click", () => showPhoto(currentPhoto + 1));
document.addEventListener("keydown", (event) => {
  if (photoViewer.hidden) return;
  if (event.key === "Escape") closeViewer();
  if (event.key === "ArrowLeft") showPhoto(currentPhoto - 1);
  if (event.key === "ArrowRight") showPhoto(currentPhoto + 1);
});
