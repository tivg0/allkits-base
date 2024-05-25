function copyCanvas(originCanvas, destinationCanvas) {
  destinationCanvas.clear();
  destinationCanvas.backgroundColor = originCanvas.backgroundColor;
  destinationCanvas.part = originCanvas.part;
  originCanvas.forEachObject(function (i) {
    destinationCanvas.add(i);
  });
  destinationCanvas.renderAll();
}

function copyCanvasWOBG(originCanvas, destinationCanvas) {
  destinationCanvas.clear();
  destinationCanvas.backgroundColor = "transparent";
  originCanvas.forEachObject(function (i) {
    destinationCanvas.add(i);
  });
  destinationCanvas.renderAll();
}
export { copyCanvas, copyCanvasWOBG };
