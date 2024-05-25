import * as THREE from "three";

export function setBGColor(
  hexColor,
  editingComponentRef,
  canvasRef,
  updateTexture,
  isChangingColor
) {
  isChangingColor.current = true;
  setTimeout(() => {
    isChangingColor.current = false;
  }, 400);
  const color = hexColor.trim(); // Clean the input
  if (color[0] !== "#" || color.length !== 7) return; // Ensure valid color
  editingComponentRef.current.material.emissive.setHex(0x000000); // Reset emissive color

  const canvas = canvasRef.current;
  if (!canvas) return;

  const startColor = new THREE.Color(canvas.backgroundColor); // Current color
  const endColor = new THREE.Color(color); // New color from input

  let progress = 0; // Initialize progress
  const duration = 100; // Duration of the transition in milliseconds
  const stepTime = 4; // Time each step takes

  function step() {
    progress += stepTime;
    const lerpFactor = progress / duration;
    if (lerpFactor < 1) {
      // Continue interpolation
      const interpolatedColor = startColor.lerpColors(
        startColor,
        endColor,
        lerpFactor
      );
      const cssColor = "#" + interpolatedColor.getHexString();
      canvas.setBackgroundColor(cssColor, canvas.renderAll.bind(canvas));
      requestAnimationFrame(step); // Request the next animation frame
    } else {
      // Final color set after the animation ends
      canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
    }
    updateTexture(); // Update texture if needed
  }
  step();

  if (hexColor == "#000000") {
    canvas.forEachObject(function (i) {
      console.log(i);
      i.set({
        cornerColor: "rgb(255,255,255,0.4)",
      });
    });
  } else {
    canvas.forEachObject(function (i) {
      i.set({
        cornerColor: "rgb(0,0,0,0.4)",
      });
    });
  }
}
