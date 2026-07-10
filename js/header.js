(() => {
  const button = document.getElementById("playButton");
  const music = document.getElementById("bgMusic");

  if (!button || !music) return;

  function showStoppedState() {
    button.textContent = "PLAY";
    button.classList.remove("is-playing");
    button.setAttribute("aria-pressed", "false");
    button.setAttribute("aria-label", "Play Personaville music");
    button.title = "Play music";
  }

  function showPlayingState() {
    button.textContent = "STOP";
    button.classList.add("is-playing");
    button.classList.remove("has-error");
    button.setAttribute("aria-pressed", "true");
    button.setAttribute("aria-label", "Stop Personaville music");
    button.title = "Stop music";
  }

  button.addEventListener("click", async () => {
    if (!music.paused) {
      music.pause();
      music.currentTime = 0;
      showStoppedState();
      return;
    }

    try {
      await music.play();
      showPlayingState();
    } catch (error) {
      showStoppedState();
      button.classList.add("has-error");
      button.title = "The audio file could not be played";
      console.error("Personaville audio could not play:", error);
    }
  });

  music.addEventListener("error", () => {
    showStoppedState();
    button.classList.add("has-error");
    button.title = "Audio file not found or unsupported";
  });
})();
