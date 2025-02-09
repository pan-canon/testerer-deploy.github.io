// /js/visualEffectsManager.js
export class VisualEffectsManager {
  triggerMirrorEffect() {
    // Эффект затемнения фона
    document.body.style.transition = "background 1s";
    document.body.style.background = "black";
    setTimeout(() => {
      document.body.style.background = "";
    }, 1000);

    // Эффект статического шума (например, звук звонка)
    const staticNoise = new Audio('audio/phone_ringtone.mp3');
    staticNoise.play();
    setTimeout(() => staticNoise.pause(), 3000);
  }

  triggerGhostAppearanceEffect() {
    // Призрачное появление (заглушка)
    const ghostEffect = document.createElement("div");
    ghostEffect.style.position = "absolute";
    ghostEffect.style.top = "50%";
    ghostEffect.style.left = "50%";
    ghostEffect.style.transform = "translate(-50%, -50%)";
    ghostEffect.style.width = "200px";
    ghostEffect.style.height = "200px";
    ghostEffect.style.background = "url('images/ghost.png') no-repeat center center";
    ghostEffect.style.backgroundSize = "contain";
    ghostEffect.style.opacity = "0.7";
    document.body.appendChild(ghostEffect);

    setTimeout(() => {
      ghostEffect.style.opacity = "0";
    }, 3000);
  }

  triggerWhisperEffect() {
    // Шёпот (заглушка)
    const whisperSound = new Audio('audio/whisper.mp3');
    whisperSound.play();
    setTimeout(() => whisperSound.pause(), 5000);
  }
}