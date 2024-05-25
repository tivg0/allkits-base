export function selectImage(
  intersectionResult,
  initialUVCursor,
  canvasRef,
  objectRotation,
  initialUVRotationCursor,
  updateTexture,
  canvasSize
) {
  let selectedHandle = null;
  let isImageSelected = false;

  initialUVCursor.x = intersectionResult.uv.x * canvasRef.current.width;
  initialUVCursor.y = intersectionResult.uv.y * canvasRef.current.height;

  initialUVRotationCursor.x = initialUVCursor.x;
  initialUVRotationCursor.y = initialUVCursor.y;

  const point = new fabric.Point(initialUVCursor.x, initialUVCursor.y);

  canvasRef.current.forEachObject((obj) => {
    if (obj.containsPoint(point)) {
      canvasRef.current.setActiveObject(obj);
      isImageSelected = true;
      objectRotation.current = obj.angle;
    }

    let tolerance;
    if (obj instanceof fabric.Image) {
      const minSide = Math.min(obj.width * obj.scaleX, obj.height * obj.scaleY);
      tolerance = minSide / 10;
    } else {
      tolerance = obj.fontSize / 2;
    }

    if (tolerance < canvasSize / 100) tolerance = canvasSize / 100;

    const supLimX = initialUVCursor.x + tolerance / 2,
      infLimX = initialUVCursor.x - tolerance / 2;

    const supLimY = initialUVCursor.y + tolerance / 2,
      infLimY = initialUVCursor.y - tolerance / 2;

    for (let i in obj.oCoords) {
      let handleCoords = obj.oCoords[i];

      if (
        handleCoords.x < supLimX &&
        handleCoords.x > infLimX &&
        handleCoords.y < supLimY &&
        handleCoords.y > infLimY
      ) {
        selectedHandle = i;
        canvasRef.current.setActiveObject(obj);
        isImageSelected = true;
        objectRotation.current = obj.angle;
      }
    }
  });
  const selectedObject = canvasRef.current.getActiveObject();

  if (!isImageSelected) {
    if (selectedObject) {
      canvasRef.current.bringForward(selectedObject);
    }
    canvasRef.current.discardActiveObject();
  } else {
    if (selectedObject instanceof fabric.Image) {
      const minSide = Math.min(
        selectedObject.width * selectedObject.scaleX,
        selectedObject.height * selectedObject.scaleY
      );
      let tolerance = minSide / 10;
      if (tolerance < canvasSize / 100) tolerance = canvasSize / 100;
      selectedObject.set({
        cornerSize: tolerance,
        rotatingPointOffset:
          (selectedObject.height * selectedObject.scaleY) / 2 + tolerance,
      });
      const originalControl = fabric.Object.prototype.controls.mtr;
      fabric.Object.prototype.controls.mtr = new fabric.Control({
        x: 0,
        y: 0,
        offsetY:
          -((selectedObject.height * selectedObject.scaleY) / 2) -
          (selectedObject.width * selectedObject.scaleX +
            selectedObject.height * selectedObject.scaleY) /
            20,
        actionHandler: originalControl.actionHandler,
        withConnection: true,
        actionName: "rotate",
      });
    }
  }

  canvasRef.current.renderAll();
  updateTexture();

  return {
    selectedHandle: selectedHandle,
    isImageSelected: isImageSelected,
    activeObject: selectedObject,
  };
}
