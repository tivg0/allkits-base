import { animatePrice } from "./animations/animate-price";
import { copyCanvasWOBG } from "./canvas/copy-canvas";
import { calculateUVArea } from "@/app/get-uv-data";
import * as THREE from "three";

export function calculateArea(fabricCanvases, sceneRef, setAnimatedPrice) {
  console.log("start");
  let totalPrice = 13.25;
  console.log(totalPrice);
  let realPartArea;

  fabricCanvases.forEach((canvas) => {
    let percentageOccupiedByUV;
    let meshGeometry;
    sceneRef.current.children.forEach((child) => {
      if (child instanceof THREE.Group) {
        child.children.forEach((mesh) => {
          if (mesh.name == canvas.part) {
            percentageOccupiedByUV = calculateUVArea(mesh.geometry);
            meshGeometry = mesh.geometry;
          }
        });
      }
    });

    if (canvas.part.includes("body")) {
      realPartArea = 63 * 54; //cm^2
    } else if (canvas.part.includes("manga")) {
      realPartArea = 61 * 48; //cm^2
    } else {
      //pocket
      realPartArea = 36 * 18; //cm^2
    }

    // realPartAreaCm----------------percentageOccupiedByUV
    // canvasAreaCm------------------1

    const canvasAreaCm = realPartArea / percentageOccupiedByUV;

    let finalPrintCanvas = new fabric.Canvas("temp", {
      width: canvas.width,
      height: canvas.height,
      backgroundColor: "transparent",
    });
    copyCanvasWOBG(canvas, finalPrintCanvas);

    let finalPrintPngData = finalPrintCanvas.toDataURL({ format: "png" });

    // let finalPrintImage = new Image();
    // finalPrintImage.src = finalPrintPngData;*/

    let ctx = finalPrintCanvas.getContext("2d");
    let imageData = ctx.getImageData(
      0,
      0,
      finalPrintCanvas.width,
      finalPrintCanvas.height
    );
    let data = imageData.data;
    console.log("data", finalPrintPngData);
    let pixelsWithPrint = 0;

    for (let i = 0; i < data.length; i += 4) {
      /*let index = i / 4;
      let x = index % finalPrintCanvas.width;
      let y = Math.floor(index / finalPrintCanvas.width);*/

      //const pointInUV = isPointInUV(x, y, meshGeometry);

      if (data[i + 3] > 10 /*&& pointInUV*/) {
        pixelsWithPrint += 1;
      }
    }

    const canvasAreaPixels = canvas.width * canvas.height;

    const percentageOfPrint = pixelsWithPrint / canvasAreaPixels;

    const areaOfPrintingCm = canvasAreaCm * percentageOfPrint;

    const tenCm2Blocks = Math.ceil(areaOfPrintingCm) / 100;

    const aditionalCost = tenCm2Blocks * 1.6;

    totalPrice += aditionalCost;
    console.log(totalPrice);
  });

  console.log("total", totalPrice);

  animatePrice(0, totalPrice, 1000, setAnimatedPrice);
}
