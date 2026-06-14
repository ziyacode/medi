(() => {
  const body = document.body;
  let scrollFrame = 0;
  let scrollEndTimer = 0;

  function markScrolling() {
    if (!scrollFrame) {
      scrollFrame = requestAnimationFrame(() => {
        body.classList.add("is-scrolling");
        scrollFrame = 0;
      });
    }
    clearTimeout(scrollEndTimer);
    scrollEndTimer = setTimeout(() => body.classList.remove("is-scrolling"), 140);
  }

  window.addEventListener("scroll", markScrolling, { passive: true });

  if (!("IntersectionObserver" in window)) return;
  const sections = document.querySelectorAll(
    "main > section, .gallery-hero, .photo-archive, .game-shell, .question-stage, .answer-reveal",
  );
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("perf-offscreen", !entry.isIntersecting);
    });
  }, { rootMargin: "180px 0px", threshold: 0 });

  sections.forEach((section) => observer.observe(section));
})();
