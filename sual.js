const stage = document.getElementById("questionStage");
const answerZone = document.getElementById("answerZone");
const noButton = document.getElementById("noButton");
const yesButton = document.getElementById("yesButton");
const tryMessage = document.getElementById("tryMessage");
const answerReveal = document.getElementById("answerReveal");
const scanner = document.getElementById("scanner");
const scanText = document.getElementById("scanText");
const scanBar = document.getElementById("scanBar");
const revealContent = document.getElementById("revealContent");

const retryMessages = [
  "Şansınızı bir daha sınayın. 'Yox' bu gün işləmir.",
  "Sistem xətası: bu cavab ürək tərəfindən rədd edildi.",
  "Yox düyməsi də cavabına inanmadı və qaçdı.",
  "Bu qədər asan olacağını düşündün? Maraqlı cəhd idi.",
  "Yanlış istiqamət. Düzgün cavab qırmızı düymədədir.",
  "Yox sözü yerini dəyişdi, fikrini dəyişmək növbəsi sənindir.",
  "404: 'Yox' cavabı tapılmadı."
];
let escapeCount = 0;

function moveNoButton() {
  const zone = answerZone.getBoundingClientRect();
  const button = noButton.getBoundingClientRect();
  const maxX = Math.max(0, zone.width - button.width - 8);
  const maxY = Math.max(0, zone.height - button.height - 8);
  noButton.style.left = `${Math.random() * maxX}px`;
  noButton.style.top = `${Math.random() * maxY}px`;
  noButton.style.transform = `rotate(${-8 + Math.random() * 16}deg)`;
  tryMessage.textContent = retryMessages[escapeCount % retryMessages.length];
  escapeCount += 1;
}

noButton.addEventListener("pointerenter", moveNoButton);
noButton.addEventListener("click", (event) => { event.preventDefault(); moveNoButton(); });
noButton.addEventListener("focus", () => { if (escapeCount > 0) moveNoButton(); });

yesButton.addEventListener("click", () => {
  stage.classList.add("leave");
  answerReveal.classList.add("open");
  answerReveal.setAttribute("aria-hidden", "false");
  setTimeout(() => { scanBar.style.width = "100%"; }, 100);
  setTimeout(() => { scanText.textContent = "Səmimiyyət yoxlanılır..."; }, 900);
  setTimeout(() => { scanText.textContent = "13.04 və 28.05 xətti birləşdirilir..."; }, 1800);
  setTimeout(() => {
    scanner.hidden = true;
    revealContent.hidden = false;
    createWordBurst(["Ziya", "Mədinə", "13.04", "28.05", "ən yaxın", "sonsuz", "♡"]);
  }, 3200);
});

function createWordBurst(words) {
  words.forEach((word, index) => {
    const node = document.createElement("span");
    node.className = "burst-word";
    node.textContent = word;
    const angle = (Math.PI * 2 * index) / words.length;
    const distance = 170 + Math.random() * 180;
    node.style.setProperty("--x", `${Math.cos(angle) * distance}px`);
    node.style.setProperty("--y", `${Math.sin(angle) * distance}px`);
    node.style.setProperty("--r", `${-40 + Math.random() * 80}deg`);
    node.style.setProperty("--size", `${13 + Math.random() * 18}px`);
    node.style.setProperty("--color", index % 2 ? "#1aa4b0" : "#d01e35");
    document.body.appendChild(node);
    node.addEventListener("animationend", () => node.remove());
  });
}

const questionStars = document.getElementById("questionStars");
const starCount = window.matchMedia("(max-width: 700px), (pointer: coarse)").matches ? 32 : 85;
for (let index = 0; index < starCount; index += 1) {
  const star = document.createElement("i");
  star.style.left = `${Math.random() * 100}%`;
  star.style.top = `${Math.random() * 100}%`;
  star.style.setProperty("--speed", `${1.5 + Math.random() * 4}s`);
  star.style.setProperty("--color", index % 4 === 0 ? "#d01e35" : "#8fd5da");
  star.style.animationDelay = `${-Math.random() * 5}s`;
  questionStars.appendChild(star);
}

let promiseClicks = 0;
document.getElementById("promiseHeart").addEventListener("click", () => {
  promiseClicks += 1;
  const whispers = [
    "İlk toxunuş: bəzi insanlar təsadüf deyil.",
    "İkinci toxunuş: ən yaxın məsafə kilometrlə ölçülmür.",
    "Üçüncü toxunuş: bu cavab artıq dəyişdirilə bilməz. Yaxşı ki də belədir. ♡"
  ];
  document.getElementById("finalWhisper").textContent = whispers[Math.min(promiseClicks - 1, whispers.length - 1)];
  createWordBurst(["♡", "Z", "M", "∞"]);
});
