import translations from "./translations.js";

// Pages
const story = document.getElementById("js-story");
const pages = document.querySelectorAll(".js-story-page");
const totalPages = pages?.length;
const settings = {
  width: 500,
  height: 500,
  minWidth: 250,
  maxWidth: 1000,
  minHeight: 200,
  maxHeight: 1350,
  size: "stretch",
  maxShadowOpacity: "0.3",
};
let pageFlip;
let currentPageId = 0;
let isPortrait = false;

// Controls
const previousButton = document.getElementById("js-btn-prev");
const nextButton = document.getElementById("js-btn-next");

// Audio
const audios = document.querySelectorAll(".js-story-audio");
const audioControlButton = document.getElementById("js-btn-audio-control");
const audioRestartButton = document.getElementById("js-btn-audio-restart");
let audioIsPlaying = false;
let isAudioPaused = false;

// Language
const languageButtons = document.querySelectorAll(".js-btn-language");
let language = "nl";

const events = () => {
  init();

  // PageFlip events
  pageFlip.on("flip", (e) => onPageFlip(e));
  pageFlip.on("changeOrientation", (e) => onPageChangeOrientation(e));

  // Control buttons events
  previousButton.addEventListener("click", () => pageFlip.flipPrev());
  nextButton.addEventListener("click", () => pageFlip.flipNext());

  // Audio buttons events
  audioControlButton.addEventListener("click", onClickAudioControlButton);
  audioRestartButton.addEventListener("click", () =>
    playAudioCurrentPage(true)
  );

  // Language buttons events
  languageButtons.forEach((btn) => {
    btn.addEventListener("click", () => onClickLanguageButton(btn));
  });
};

const init = () => {
  pageFlip = new St.PageFlip(story, settings);
  pageFlip.loadFromHTML(pages);
  loadPageContent();
  checkOrientation();
};

// Load page content in the selected language
const loadPageContent = () => {
  pages.forEach((page) => {
    const pageId = page.id;
    const translationId = page.dataset.translationId;
    if (!pageId || !translationId) return;

    const title = page.querySelector(".page-title");
    const subtitle = page.querySelector(".page-subtitle");
    const text = page.querySelector(".page-text");

    // Left page has a title
    if (pageId.includes("left")) {
      title.innerHTML = translations[language][translationId].titel;
    }

    // Right page has a subtitle and text
    if (pageId.includes("right")) {
      subtitle.innerHTML = translations[language][translationId].subtitel;
      text.innerHTML = translations[language][translationId].text;

      // Fallback if there is no subtitle available
      if (!subtitle.innerHTML) {
        title.innerHTML = translations[language][translationId].titel;
      }
    }
  });
};

const checkOrientation = () => {
  // The pageflip library change orientation on width 561px
  if (screen.width <= 561) return (isPortrait = true);
  isPortrait = false;
};

const onPageFlip = (event) => {
  currentPageId = event.data;

  // On landscape mode, id of left page is saved, but we need id of right page
  if (!isPortrait) currentPageId += 1;

  pauseAllAudio();
  playAudioCurrentPage(true);
  setDisabilityControlButtons();
};

const onPageChangeOrientation = (event) => {
  if (event.data === "portrait") return (isPortrait = true);
  isPortrait = false;
};

const pauseAllAudio = () => {
  audios.forEach((audio) => audio.pause());
  audioIsPlaying = false;
  setAudioControlButton();
};

const playAudioCurrentPage = (restart = false) => {
  const currentPage = pages[currentPageId];
  if (!currentPage) return;

  const audio = currentPage.querySelector(".js-story-audio");
  if (!audio) return setDisabilityAudioControlButtons(true);

  if (restart) audio.currentTime = 0;

  if (isAudioPaused) return;

  playAudio(audio)
    .then(() => {
      audioIsPlaying = true;
      setAudioControlButton();
      setDisabilityAudioControlButtons(false);
    })
    .catch(() => {
      audioIsPlaying = false;
      setAudioControlButton();
      setDisabilityAudioControlButtons(false);
    });
};

const playAudio = (audio) => {
  return audio.play();
};

const onClickAudioControlButton = () => {
  if (audioIsPlaying) {
    isAudioPaused = true;
    audioRestartButton.disabled = true;
    pauseAllAudio();
  } else {
    isAudioPaused = false;
    audioRestartButton.disabled = false;
    playAudioCurrentPage();
  }
};

const setAudioControlButton = () => {
  if (audioIsPlaying) {
    audioControlButton.ariaLabel = "Pauzeer audio";
    audioControlButton.innerHTML =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="#ffffff" d="M48 64C21.5 64 0 85.5 0 112V400c0 26.5 21.5 48 48 48H80c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H48zm192 0c-26.5 0-48 21.5-48 48V400c0 26.5 21.5 48 48 48h32c26.5 0 48-21.5 48-48V112c0-26.5-21.5-48-48-48H240z"/></svg>';
    return;
  }

  audioControlButton.ariaLabel = "Start audio";
  audioControlButton.innerHTML =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512"><path fill="#ffffff" d="M73 39c-14.8-9.1-33.4-9.4-48.5-.9S0 62.6 0 80V432c0 17.4 9.4 33.4 24.5 41.9s33.7 8.1 48.5-.9L361 297c14.3-8.7 23-24.2 23-41s-8.7-32.2-23-41L73 39z" /></svg>';
};

const setDisabilityAudioControlButtons = (disabled = true) => {
  audioControlButton.disabled = disabled;
  audioRestartButton.disabled = disabled;
};

const onClickLanguageButton = (button) => {
  language = button.dataset.language ?? "nl";
  loadPageContent();
  setActiveLanguageButton(button);

  if (language === "ar") {
    story.classList.add("is-arabic");
  } else {
    story.classList.remove("is-arabic");
  }
};

const setActiveLanguageButton = (activeButton) => {
  languageButtons.forEach((btn) => (btn.dataset.active = false));
  activeButton.dataset.active = true;
};

const setDisabilityControlButtons = () => {
  if (
    (isPortrait && currentPageId === 0) ||
    (!isPortrait && currentPageId === 1)
  ) {
    previousButton.disabled = true;
    nextButton.disabled = false;
    return;
  }

  if (currentPageId === totalPages - 1) {
    previousButton.disabled = false;
    nextButton.disabled = true;
    return;
  }

  audioControlButton.disabled = false;
  previousButton.disabled = false;
  nextButton.disabled = false;
};

events();
