import TWEEN from "@tweenjs/tween.js";
import * as THREE from "three";

function animateEmissiveColorOnce(object, startColor, endColor, duration) {
  object.material.emissiveIntensity = 0.8;
    const start = { r: startColor.r, g: startColor.g, b: startColor.b };
    const end = { r: endColor.r, g: endColor.g, b: endColor.b };

  new TWEEN.Tween(start)
    .to(end, duration)
    .onUpdate(() => {
      object.material.emissive.setRGB(start.r, start.g, start.b);
    })
    .start();
}

export function animateEmissiveColor(mesh, duration) {
  const currentEmissive = mesh.material.emissive;

  animateEmissiveColorOnce(
    mesh,
    currentEmissive,
    new THREE.Color(0x00bfff),
    duration
  );
  animateEmissiveColorOnce(
    mesh,
    new THREE.Color(0x00bfff),
    currentEmissive,
    duration
  );
}
