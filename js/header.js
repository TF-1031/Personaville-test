(function(){
  function initPersonavilleHeader(root){
    const scope = root || document;
    const button = scope.querySelector("#playButton");
    const music = scope.querySelector("#bgMusic");
    const image = scope.querySelector(".personaville-hero__image");

    if(image && image.dataset.initialized !== "true"){
      image.dataset.initialized = "true";
      image.addEventListener("error", () => {
        image.classList.add("is-hidden");
        image.removeAttribute("src");
        console.warn("Personaville hero image could not be loaded; hiding the hero artwork.");
      }, {once:true});
    }

    if(!button || !music || button.dataset.initialized === "true") return;
    button.dataset.initialized = "true";

    function showStoppedState(){
      button.textContent = "Play";
      button.classList.remove("is-playing");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Play Personaville music");
      button.title = "Play music";
    }

    function showPlayingState(){
      button.textContent = "Stop";
      button.classList.add("is-playing");
      button.classList.remove("has-error");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Stop Personaville music");
      button.title = "Stop music";
    }

    button.addEventListener("click", async () => {
      if(!music.paused){
        music.pause();
        showStoppedState();
        return;
      }

      try{
        await music.play();
        showPlayingState();
      }catch(error){
        showStoppedState();
        button.classList.add("has-error");
        button.title = "The audio file could not be played";
        console.warn("Personaville audio could not play:", error);
      }
    });

    music.addEventListener("play", showPlayingState);
    music.addEventListener("pause", showStoppedState);
    music.addEventListener("error", () => {
      showStoppedState();
      button.classList.add("has-error");
      button.title = "Audio file not found or unsupported";
      console.warn("Personaville audio file could not be loaded.");
    });
  }

  window.initPersonavilleHeader = initPersonavilleHeader;
})();
