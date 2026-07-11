(function(){
  function initPersonavilleHeader(root){
    const scope = root || document;
    const button = scope.querySelector("#personavilleMusicToggle");
    const music = scope.querySelector("#personavilleMusic");
    const status = scope.querySelector("#personavilleMusicStatus");

    if(!button || !music || button.dataset.initialized === "true") return;
    button.dataset.initialized = "true";

    function setStatus(message){
      if(status) status.textContent = message || "";
    }

    function showStoppedState(message){
      button.textContent = "Play";
      button.classList.remove("is-playing");
      button.setAttribute("aria-pressed", "false");
      button.setAttribute("aria-label", "Play Personaville music");
      button.title = "Play music";
      setStatus(message || "");
    }

    function showPlayingState(){
      button.textContent = "Stop";
      button.classList.add("is-playing");
      button.classList.remove("has-error");
      button.setAttribute("aria-pressed", "true");
      button.setAttribute("aria-label", "Stop Personaville music");
      button.title = "Stop music";
      setStatus("Music playing");
    }

    button.addEventListener("click", async () => {
      if(!music.paused){
        music.pause();
        showStoppedState("Music stopped");
        return;
      }

      try{
        await music.play();
        showPlayingState();
      }catch(error){
        showStoppedState("Music unavailable");
        button.classList.add("has-error");
        button.title = "The audio file could not be played";
        console.warn("Personaville audio could not play:", error);
      }
    });

    music.addEventListener("play", showPlayingState);
    music.addEventListener("pause", () => showStoppedState(music.currentTime ? "Music stopped" : ""));
    music.addEventListener("error", () => {
      showStoppedState("Music unavailable");
      button.classList.add("has-error");
      button.title = "Audio file not found or unsupported";
      console.warn("Personaville audio file could not be loaded.");
    });
  }

  window.initPersonavilleHeader = initPersonavilleHeader;
})();
