// VisualEffectsManager.js
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
}