import { fabric } from "fabric";
import { calculateAverageUV, getUVDimensions } from "../three/get-uv-data";

export const uploadImage = (
  e,
  editingComponent,
  fabricCanvas,
  updateTexture,
  canvasSize
) => {
  let position = calculateAverageUV(editingComponent.current);
  let scaleF = getUVDimensions(editingComponent.current).smallerSide * 0.5;

  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const imgObj = new Image();
    imgObj.src = e.target.result;
    imgObj.onload = function () {
      const fabricImage = new fabric.Image(imgObj);
      const scale =
        Math.min(
          fabricCanvas.current.width / fabricImage.width,
          fabricCanvas.current.height / fabricImage.height
        ) * scaleF;
      fabricImage.set({
        selectable: true,
        left: position.averageU * fabricCanvas.current.width,
        top: (position.averageV - 0.05) * fabricCanvas.current.height,
        originX: "center",
        originY: "center",
        scaleX: scale * 0.5,
        scaleY: scale * 0.5,
        cornerSize:
          fabricImage.width < fabricImage.height
            ? (fabricImage.width * scale) / 10
            : (fabricImage.height * scale) / 10,
        cornerStyle: "circle",
        transparentCorners: false,
        cornerColor:
          fabricCanvas.current.backgroundColor == "#000000"
            ? "rgba(255, 255, 255, 0.4)"
            : "rgba(0, 0, 0, 0.4)",
        borderColor: "transparent",
      });

      const minSide = Math.min(
        fabricImage.width * fabricImage.scaleX,
        fabricImage.height * fabricImage.scaleY
      );
      let tolerance = minSide / 10;
      if (tolerance < canvasSize / 100) tolerance = canvasSize / 100;
      fabricImage.set({
        cornerSize: tolerance,
        rotatingPointOffset:
          (fabricImage.height * fabricImage.scaleY) / 2 + tolerance,
      });
      const originalControl = fabric.Object.prototype.controls.mtr;
      fabric.Object.prototype.controls.mtr = new fabric.Control({
        x: 0,
        y: 0,
        offsetY:
          -((fabricImage.height * fabricImage.scaleY) / 2) -
          (fabricImage.width * fabricImage.scaleX +
            fabricImage.height * fabricImage.scaleY) /
            20,
        actionHandler: originalControl.actionHandler,
        withConnection: true,
        actionName: "rotate",
      });
      fabricCanvas.current.add(fabricImage);
      fabricCanvas.current.setActiveObject(fabricImage);
      fabricCanvas.current.renderAll();
      updateTexture();
    };
  };

  reader.readAsDataURL(file);
};
