import * as THREE from "three";
import { copyCanvas } from "./copy-canvas";

export function storeCanvasAndTexture(
  mesh,
  canvas,
  canvasSize,
  setFabricCanvases,
  fabricCanvases
) {
  const staticCanvas = new fabric.Canvas("staticCanvas", {
    width: canvasSize,
    height: canvasSize,
  });
  copyCanvas(canvas, staticCanvas);
  const texture = new THREE.CanvasTexture(staticCanvas.getElement());
  texture.repeat.y = -1;
  texture.offset.y = 1;

  mesh.current.userData.canvas = staticCanvas;
  mesh.current.material.map = texture;

  let canvases = fabricCanvases;

  if (canvases) {
    canvases.forEach((canvas, index) => {
      console.log(canvas);
      if (canvas.part == mesh.current.name) {
        canvases.splice(index, 1);
        console.log("merda");
      }
    });
  }

  console.log(canvases);

  canvases.push(staticCanvas);

  setFabricCanvases(canvases);
}
