const titles = ["Saluton, Mondo!", "你好，世界！", "Hello, World!", "こんにちは、世界！"]
const maxChars = Math.max(...titles.map(t => t.length))

let titleIdx = 0;

// Wrap every letter in a span
const titleWrapper = document.querySelector('.landing-title .letters');
titleWrapper.innerHTML = "<span class='letter'></span>".repeat(maxChars);

let letters = document.querySelectorAll('.landing-title .letter');

letters.forEach((letter, i) => {
  letter.innerHTML = i < titles[titleIdx].length ? titles[titleIdx][i] : "&nbsp;";
})

const targets = {
  titleWidth: document.querySelector('.landing-title .letters').getBoundingClientRect().width + 10,
}

const titleTL = anime.timeline({
  loop: true,
  loopComplete: (anim) => {
    titleIdx = (titleIdx + 1) % titles.length;

    // Wrap every letter in a span
    letters.forEach((letter, i) => {
      letter.innerHTML = i < titles[titleIdx].length ? titles[titleIdx][i] : "&nbsp;";
    })

    targets.titleWidth = document.querySelector('.landing-title .letters').getBoundingClientRect().width + 10;
  }
})
  .add({
    targets: '.landing-title .letter',
    opacity: [0,1],
    easing: "easeOutExpo",
    duration: 1200,
    delay: (el, i) => 21 * (i+1)
  })
  .add({
    targets: Array.from(document.querySelectorAll('.landing-title .letter')).toReversed(),
    opacity: [1,0],
    easing: "easeOutExpo",
    duration: 900,
    delay: (el, i) => 3500 + 21 * (i+1)
  }, '-=975');
