const intro = document.getElementById("gameIntro");
const board = document.getElementById("gameBoard");
const result = document.getElementById("gameResult");
const arena = document.getElementById("messageArena");
const scoreValue = document.getElementById("scoreValue");
const timeValue = document.getElementById("timeValue");
const comboValue = document.getElementById("comboValue");
const gameStatus = document.getElementById("gameStatus");

const goodMessages = [
  "Gəldim, sənə yazıram",
  "Bitirdim, buradayam",
  "Telefon əlimdədir",
  "Səni gözlətmədim",
  "Qrupdan çıxdım",
  "Son mesaj həqiqətən son idi"
];

const delayMessages = [
  "Bir dənə də mesaj",
  "İndi bitirirəm",
  "Qrupda qaldım",
  "Stiker seçirdim",
  "Bu lap son mesajdır",
  "5 dəqiqə nə tez keçdi?"
];

const roundSeconds = 25;
let score = 0;
let combo = 0;
let timeLeft = roundSeconds;
let running = false;
let spawnTimer;
let clockTimer;

function updateHud() {
  scoreValue.textContent = score;
  timeValue.textContent = timeLeft;
  comboValue.textContent = `x${Math.max(1, Math.min(5, combo))}`;
}

function showScore(text, x, y, negative = false) {
  const pop = document.createElement("span");
  pop.className = `score-pop${negative ? " negative" : ""}`;
  pop.textContent = text;
  pop.style.left = `${x}px`;
  pop.style.top = `${y}px`;
  arena.appendChild(pop);
  pop.addEventListener("animationend", () => pop.remove());
}

function handleBubble(event) {
  if (!running) return;
  const bubble = event.currentTarget;
  if (bubble.dataset.used === "true") return;
  bubble.dataset.used = "true";

  const good = bubble.dataset.good === "true";
  const rect = bubble.getBoundingClientRect();
  const arenaRect = arena.getBoundingClientRect();
  const x = rect.left - arenaRect.left + rect.width / 2;
  const y = rect.top - arenaRect.top;

  if (good) {
    combo += 1;
    const gain = 10 + Math.min(8, Math.max(0, combo - 1) * 2);
    score += gain;
    bubble.classList.add("caught");
    showScore(`+${gain}`, x, y);
    gameStatus.textContent = combo >= 3 ? "Əla! Mədinə birbaşa sənə yazır." : "Vaxtında gələn mesaj tutuldu.";
  } else {
    combo = 0;
    score = Math.max(0, score - 5);
    bubble.classList.add("wrong");
    showScore("-5", x, y, true);
    gameStatus.textContent = "Vaxt uzandı. Bu, həqiqi son mesaj deyildi.";
  }
  updateHud();
  setTimeout(() => bubble.remove(), 460);
}

function spawnBubble() {
  if (!running) return;
  const existing = arena.querySelectorAll(".message-bubble").length;
  if (existing > 11) return;

  const good = Math.random() > .44;
  const list = good ? goodMessages : delayMessages;
  const bubble = document.createElement("button");
  bubble.type = "button";
  bubble.className = `message-bubble${good ? "" : " bad"}`;
  bubble.dataset.good = String(good);
  bubble.textContent = list[Math.floor(Math.random() * list.length)];
  bubble.style.setProperty("--x", `${4 + Math.random() * 70}%`);
  bubble.style.setProperty("--drift", `${-45 + Math.random() * 90}px`);
  bubble.style.setProperty("--turn", `${-7 + Math.random() * 14}deg`);
  bubble.style.setProperty("--fall", `${4.2 + Math.random() * 1.7}s`);
  bubble.addEventListener("click", handleBubble);
  bubble.addEventListener("animationend", () => {
    if (!running || bubble.dataset.used === "true") return bubble.remove();
    if (good) {
      combo = 0;
      score = Math.max(0, score - 2);
      gameStatus.textContent = "Yaxşı mesaj qaçdı. Telefonu bir az yuxarı tut.";
      updateHud();
    }
    bubble.remove();
  });
  arena.appendChild(bubble);
}

function finishGame() {
  running = false;
  clearInterval(spawnTimer);
  clearInterval(clockTimer);
  arena.querySelectorAll(".message-bubble,.score-pop").forEach((item) => item.remove());
  board.hidden = true;
  board.setAttribute("aria-hidden", "true");
  result.hidden = false;
  result.setAttribute("aria-hidden", "false");
  document.getElementById("finalScore").textContent = score;

  const title = document.getElementById("resultTitle");
  const copy = document.getElementById("resultCopy");
  if (score >= 125) {
    title.textContent = "5 dəqiqə doğrudan da 5 dəqiqə oldu!";
    copy.textContent = "Mümkünsüz görünən hadisə baş verdi. Bütün düzgün mesajları tutdun, vaxt maşını düzəldi və Ziya gözləmə rejimindən çıxdı.";
  } else if (score >= 70) {
    title.textContent = "Mədinə gəlir... demək olar.";
    copy.textContent = "Nəticə yaxşıdır. Sadəcə yolda bir stiker seçildi və iki dənə “son mesaj” əlavə olundu. Bir cəhd də etsən, vaxtı ram edə bilərsən.";
  } else {
    title.textContent = "5 dəqiqə yenə bir az uzandı.";
    copy.textContent = "Bəhanələr vaxt maşınına girdi. Narahat olma, bu sistemdə “indi bitirirəm” ifadəsi həmişə gözlənilməz işləyir.";
  }
}

function startGame() {
  score = 0;
  combo = 0;
  timeLeft = roundSeconds;
  running = true;
  intro.hidden = true;
  result.hidden = true;
  result.setAttribute("aria-hidden", "true");
  board.hidden = false;
  board.setAttribute("aria-hidden", "false");
  gameStatus.textContent = "Düzgün mesajı gözlə...";
  updateHud();

  const spawnDelay = window.matchMedia("(max-width: 700px)").matches ? 760 : 620;
  spawnBubble();
  spawnTimer = setInterval(spawnBubble, spawnDelay);
  clockTimer = setInterval(() => {
    timeLeft -= 1;
    updateHud();
    if (timeLeft <= 0) finishGame();
  }, 1000);
}

document.getElementById("startGame").addEventListener("click", startGame);
document.getElementById("playAgain").addEventListener("click", startGame);
