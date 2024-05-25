import * as THREE from "three";
import { getIntersection, getIntersections } from "../three/get-intersections";
import { calculateAverageUV, getUVDimensions } from "../three/get-uv-data";
import { windowCoords } from "@/src/app/actions/misc/findWindowCoords";

export function scaleOrRotateOrMove2(
  x,
  y,
  isDragging,
  currentMouse,
  initialMouse,
  initialMouseForReal,
  currentUVCursor,
  initialUVCursor,
  initialUVRotationCursor,
  editingComponent,
  raycaster,
  camera,
  isMouseOutsideModel,
  fabricCanvas,
  objectRotation,
  updateTexture,
  orbit,
  selectImageResult,
  minScaleAllowed,
  canvasSize,
  cursorXRatio,
  cursorYRatio,
  scene
) {
  if (!isDragging) return;
  currentMouse.x = (x / window.innerWidth) * 2 - 1;
  currentMouse.y = -(y / window.innerHeight) * 2 + 1;

  const isHandleSelected = selectImageResult.selectedHandle;
  const selectedHandle = selectImageResult.selectedHandle;
  const isImageSelected = selectImageResult.isImageSelected;

  const maxScaleAllowed = canvasSize / 1.5;

  let intersection = null;
  let intersections = null;
  if (editingComponent.current) {
    intersection = getIntersection(
      raycaster,
      camera,
      editingComponent.current,
      currentMouse
    )[0];
  }

  if (
    intersection &&
    intersections &&
    intersection.object != intersections.object
  ) {
    intersection = null;
  }

  const deltaMouseXForRatio =
    (currentMouse.x - initialMouseForReal.x) * window.innerWidth;
  const deltaMouseYForRatio =
    (currentMouse.y - initialMouseForReal.y) * window.innerHeight;

  const deltaMouseX = currentMouse.x - initialMouse.x;
  const deltaMouseY = currentMouse.y - initialMouse.y;

  if (isImageSelected) {
    const activeObject = fabricCanvas.current.getActiveObject();

    let deltaX, deltaY;

    objectRotation.current = activeObject.angle;

    const width = activeObject.width;
    const height = activeObject.height;
    const aspectRatio =
      (activeObject.scaleX * width) / (activeObject.scaleY * height);

    if (intersection != null) {
      if (isMouseOutsideModel.current) {
        initialUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
        initialUVCursor.y = intersection.uv.y * fabricCanvas.current.height;
      }
      isMouseOutsideModel.current = false;

      currentUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
      currentUVCursor.y = intersection.uv.y * fabricCanvas.current.height;

      let deltaXForRatio = currentUVCursor.x - initialUVRotationCursor.x;
      let deltaYForRatio = currentUVCursor.y - initialUVRotationCursor.y;

      //if (!cursorXRatio.current && !cursorYRatio.current) {
      cursorXRatio.current = deltaXForRatio / deltaMouseXForRatio;
      cursorYRatio.current = deltaYForRatio / deltaMouseYForRatio;
      //}

      deltaX = currentUVCursor.x - initialUVCursor.x;
      deltaY = currentUVCursor.y - initialUVCursor.y;
    } else {
      if (!cursorXRatio.current && !cursorYRatio.current) return;
      isMouseOutsideModel.current = true;

      if (cursorXRatio.current == 0) cursorXRatio.current = 1;
      if (cursorYRatio.current == 0) cursorYRatio.current = 1;

      if (cursorXRatio.current < 0) cursorXRatio.current *= -1;
      if (cursorYRatio.current < 0) cursorYRatio.current *= -1;

      if (Math.abs(cursorXRatio.current) >= 5) {
        if (cursorXRatio.current < 0) cursorXRatio.current = -5;
        else cursorXRatio.current = 5;
      }

      if (Math.abs(cursorYRatio.current) >= 5) {
        if (cursorYRatio.current < 0) cursorYRatio.current = -5;
        else cursorYRatio.current = 5;
      }

      deltaX =
        deltaMouseX *
        window.innerWidth *
        cursorXRatio.current *
        fabricCanvas.current.width;
      deltaY =
        deltaMouseY *
        window.innerHeight *
        cursorYRatio.current *
        fabricCanvas.current.height;
    }

    if (isHandleSelected) {
      //handle selecionado
      let sin = Math.sin((activeObject.angle * Math.PI) / 180),
        cos = Math.cos((activeObject.angle * Math.PI) / 180);
      let deltaXI = deltaX * cos + deltaY * sin,
        deltaYI = -deltaX * sin + deltaY * cos;
      let deltaMin = Math.min(Math.abs(deltaXI), Math.abs(deltaYI));
      let newDX, newDY;
      let corner1DX, corner1DY, corner2DX, corner2DY;
      let aCoords;
      activeObject.set({ angle: objectRotation.current });

      switch (selectedHandle) {
        case "tr":
          if (deltaMin == Math.abs(deltaXI)) {
            deltaYI = -deltaXI / aspectRatio;
          } else deltaXI = -deltaYI * aspectRatio;
          newDX = cos * deltaXI - sin * deltaYI;
          newDY = sin * deltaXI + cos * deltaYI;
          corner1DX = -sin * deltaYI;
          corner1DY = cos * deltaYI;
          corner2DX = cos * deltaXI;
          corner2DY = sin * deltaXI;
          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x + corner1DX,
              activeObject.aCoords.tl.y + corner1DY
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x + newDX,
              activeObject.aCoords.tr.y + newDY
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x + corner2DX,
              activeObject.aCoords.br.y + corner2DY
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x,
              activeObject.aCoords.bl.y
            ),
          };
          break;

        case "tl":
          if (deltaMin == Math.abs(deltaXI)) {
            deltaYI = deltaXI / aspectRatio;
          } else deltaXI = deltaYI * aspectRatio;
          newDX = cos * deltaXI - sin * deltaYI;
          newDY = sin * deltaXI + cos * deltaYI;
          corner1DX = -sin * deltaYI;
          corner1DY = cos * deltaYI;
          corner2DX = cos * deltaXI;
          corner2DY = sin * deltaXI;
          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x + newDX,
              activeObject.aCoords.tl.y + newDY
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x + corner1DX,
              activeObject.aCoords.tr.y + corner1DY
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x,
              activeObject.aCoords.br.y
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x + corner2DX,
              activeObject.aCoords.bl.y + corner2DY
            ),
          };
          break;

        case "bl":
          if (deltaMin == Math.abs(deltaXI)) {
            deltaYI = -deltaXI / aspectRatio;
          } else deltaXI = -deltaYI * aspectRatio;
          newDX = cos * deltaXI - sin * deltaYI;
          newDY = sin * deltaXI + cos * deltaYI;
          corner1DX = -sin * deltaYI;
          corner1DY = cos * deltaYI;
          corner2DX = cos * deltaXI;
          corner2DY = sin * deltaXI;
          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x + corner2DX,
              activeObject.aCoords.tl.y + corner2DY
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x,
              activeObject.aCoords.tr.y
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x + corner1DX,
              activeObject.aCoords.br.y + corner1DY
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x + newDX,
              activeObject.aCoords.bl.y + newDY
            ),
          };
          break;

        case "br":
          if (deltaMin == Math.abs(deltaXI)) {
            deltaYI = deltaXI / aspectRatio;
          } else deltaXI = deltaYI * aspectRatio;
          newDX = cos * deltaXI - sin * deltaYI;
          newDY = sin * deltaXI + cos * deltaYI;
          corner1DX = -sin * deltaYI;
          corner1DY = cos * deltaYI;
          corner2DX = cos * deltaXI;
          corner2DY = sin * deltaXI;
          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x,
              activeObject.aCoords.tl.y
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x + corner2DX,
              activeObject.aCoords.tr.y + corner2DY
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x + newDX,
              activeObject.aCoords.br.y + newDY
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x + corner1DX,
              activeObject.aCoords.bl.y + corner1DY
            ),
          };
          break;

        case "mb":
          newDX = -sin * (-deltaX * sin + deltaY * cos);
          newDY = cos * (-deltaX * sin + deltaY * cos);

          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x,
              activeObject.aCoords.tl.y
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x,
              activeObject.aCoords.tr.y
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x + newDX,
              activeObject.aCoords.br.y + newDY
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x + newDX,
              activeObject.aCoords.bl.y + newDY
            ),
          };

          break;

        case "mt":
          newDX = -sin * (-deltaX * sin + deltaY * cos);
          newDY = cos * (-deltaX * sin + deltaY * cos);

          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x + newDX,
              activeObject.aCoords.tl.y + newDY
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x + newDX,
              activeObject.aCoords.tr.y + newDY
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x,
              activeObject.aCoords.br.y
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x,
              activeObject.aCoords.bl.y
            ),
          };

          break;

        case "mr":
          newDX = cos * (deltaX * cos + deltaY * sin);
          newDY = sin * (deltaX * cos + deltaY * sin);

          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x,
              activeObject.aCoords.tl.y
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x + newDX,
              activeObject.aCoords.tr.y + newDY
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x + newDX,
              activeObject.aCoords.br.y + newDY
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x,
              activeObject.aCoords.bl.y
            ),
          };

          break;

        case "ml":
          newDX = cos * (deltaX * cos + deltaY * sin);
          newDY = sin * (deltaX * cos + deltaY * sin);

          aCoords = {
            tl: new fabric.Point(
              activeObject.aCoords.tl.x + newDX,
              activeObject.aCoords.tl.y + newDY
            ),
            tr: new fabric.Point(
              activeObject.aCoords.tr.x,
              activeObject.aCoords.tr.y
            ),
            br: new fabric.Point(
              activeObject.aCoords.br.x,
              activeObject.aCoords.br.y
            ),
            bl: new fabric.Point(
              activeObject.aCoords.bl.x + newDX,
              activeObject.aCoords.bl.y + newDY
            ),
          };

          break;

        case "mtr":
          const center = new THREE.Vector2(
            activeObject.left / fabricCanvas.current.width,
            activeObject.top / fabricCanvas.current.height
          );
          const worlCoordsCenter = windowCoords(
            center,
            editingComponent.current,
            camera
          );
          objectRotation.current += calculateAngle(
            worlCoordsCenter,
            initialMouse,
            currentMouse
          );

          activeObject.set({
            angle: objectRotation.current,
          });
          break;
      }

      if (
        selectedHandle == "tr" ||
        selectedHandle == "tl" ||
        selectedHandle == "br" ||
        selectedHandle == "bl"
      ) {
        if (
          !(
            ((activeObject.scaleX * activeObject.width <= minScaleAllowed ||
              activeObject.scaleY * activeObject.height <= minScaleAllowed) &&
              (aCoords.tl.distanceFrom(aCoords.tr) / width <
                activeObject.scaleX ||
                aCoords.tl.distanceFrom(aCoords.bl) / height <
                  activeObject.scaleY)) ||
            aCoords.tl.distanceFrom(aCoords.tr) > maxScaleAllowed ||
            aCoords.tl.distanceFrom(aCoords.bl) > maxScaleAllowed
          )
        ) {
          activeObject.set({
            left: aCoords.tl.lerp(aCoords.br).x,
            top: aCoords.tl.lerp(aCoords.br).y,
            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
            originX: "center",
            originY: "center",
          });
        }
      } else if (selectedHandle == "mr" || selectedHandle == "ml") {
        if (activeObject instanceof fabric.Image) {
          if (
            !(
              (activeObject.scaleX * activeObject.width <= minScaleAllowed &&
                aCoords.tl.distanceFrom(aCoords.tr) / width <
                  activeObject.scaleX) ||
              aCoords.tl.distanceFrom(aCoords.tr) > maxScaleAllowed
            )
          ) {
            activeObject.set({
              left: aCoords.tl.lerp(aCoords.br).x,
              top: aCoords.tl.lerp(aCoords.br).y,
              scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
              scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
              originX: "center",
              originY: "center",
            });
          }
        } else {
          if (
            !(
              activeObject.textLines.length == 1 &&
              activeObject.width + newDX > activeObject.getLineWidth(0) + 100
            )
          ) {
            activeObject.set({
              width:
                activeObject.width + 2 * cos * (deltaXI * cos + deltaYI * sin),
              //left: activeObject.left + newDX / 2,
              //originX: "center",
              //originY: "center",
            });
          }
        }
      } else if (selectedHandle == "mt" || selectedHandle == "mb") {
        if (
          !(
            (activeObject.scaleY * activeObject.height <= minScaleAllowed &&
              aCoords.tl.distanceFrom(aCoords.bl) / height <
                activeObject.scaleY) ||
            aCoords.tl.distanceFrom(aCoords.bl) > maxScaleAllowed
          )
        ) {
          activeObject.set({
            left: aCoords.tl.lerp(aCoords.br).x,
            top: aCoords.tl.lerp(aCoords.br).y,
            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
            originX: "center",
            originY: "center",
          });
        }
      }
    } else if (isImageSelected && activeObject.containsPoint(initialUVCursor)) {
      let addGuides = true;
      fabricCanvas.current.forEachObject((obj, index) => {
        if (obj instanceof fabric.Line) {
          addGuides = false;
        }
      });

      const center = fabricCanvas.current.width / 2;
      const uvCenter = calculateAverageUV(editingComponent.current);

      if (addGuides) {
        let lineV = new fabric.Line(
          [
            uvCenter.averageU * fabricCanvas.current.width,
            0,
            uvCenter.averageU * fabricCanvas.current.width,
            fabricCanvas.current.width * 2,
          ],
          {
            stroke: "#00bfff81",
            strokeWidth: 2,
            selectable: false,
          }
        );
        let lineH = new fabric.Line(
          [
            0,
            (uvCenter.averageV - 0.05) * fabricCanvas.current.height,
            fabricCanvas.current.height * 2,
            (uvCenter.averageV - 0.05) * fabricCanvas.current.height,
          ],
          {
            stroke: "#00bfff81",
            strokeWidth: 2,
            selectable: false,
          }
        );
        fabricCanvas.current.add(lineV);
        fabricCanvas.current.add(lineH);
      }

      const uvDimensions = getUVDimensions(editingComponent.current);

      let xCoord = activeObject.left + deltaX;
      let yCoord = activeObject.top + deltaY;

      const tolerance = center / 500;

      const supLimU =
        uvCenter.averageU * fabricCanvas.current.width + tolerance;
      const infLimU =
        uvCenter.averageU * fabricCanvas.current.width - tolerance;

      const supLimV =
        uvCenter.averageV * fabricCanvas.current.height + tolerance;
      const infLimV =
        uvCenter.averageV * fabricCanvas.current.height - tolerance;

      if (xCoord < supLimU && xCoord > infLimU) {
        console.log("pila");
        xCoord = uvCenter.averageU;
      }
      if (yCoord < supLimV && yCoord > infLimV) {
        yCoord = uvCenter.averageV;
      }

      if (
        xCoord <
          (uvCenter.averageU + uvDimensions.width / 2) *
            fabricCanvas.current.width &&
        xCoord >
          (uvCenter.averageU - uvDimensions.width / 2) *
            fabricCanvas.current.width
      ) {
        activeObject.set({
          left: xCoord,
        });
      }
      if (
        yCoord <
          (uvCenter.averageV + uvDimensions.height / 2) *
            fabricCanvas.current.height &&
        yCoord >
          (uvCenter.averageV - uvDimensions.height / 2) *
            fabricCanvas.current.height
      ) {
        activeObject.set({
          top: yCoord,
        });
      }

      fabricCanvas.current.renderAll();
      updateTexture();
    }
  }

  initialUVCursor.x = currentUVCursor.x;
  initialUVCursor.y = currentUVCursor.y;
  initialMouse.x = currentMouse.x;
  initialMouse.y = currentMouse.y;
  if (fabricCanvas.current.getActiveObject()) {
    const obj = fabricCanvas.current.getActiveObject();

    if (obj instanceof fabric.Image) {
      const minSide = Math.min(obj.width * obj.scaleX, obj.height * obj.scaleY);
      let tolerance = minSide / 10;
      if (tolerance < canvasSize / 100) tolerance = canvasSize / 100;
      obj.set({
        cornerSize: tolerance,
        rotatingPointOffset: (obj.height * obj.scaleY) / 2 + tolerance,
      });
      const originalControl = fabric.Object.prototype.controls.mtr;
      fabric.Object.prototype.controls.mtr = new fabric.Control({
        x: 0,
        y: 0,
        offsetY:
          -((obj.height * obj.scaleY) / 2) -
          (obj.width * obj.scaleX + obj.height * obj.scaleY) / 20,
        actionHandler: originalControl.actionHandler,
        withConnection: true,
        actionName: "rotate",
      });
    }
  }
  fabricCanvas.current.renderAll();
  updateTexture();
}

function calculateAngle(centralPoint, initialCursor, currentCursor) {
  const vetorInicial = {
    x: initialCursor.x - centralPoint.x,
    y: initialCursor.y - centralPoint.y,
  };

  const vetorAtual = {
    x: currentCursor.x - centralPoint.x,
    y: currentCursor.y - centralPoint.y,
  };

  const anguloInicial = Math.atan2(vetorInicial.y, vetorInicial.x);
  const anguloAtual = Math.atan2(vetorAtual.y, vetorAtual.x);

  let anguloRotacao = anguloAtual - anguloInicial;

  anguloRotacao *= 180 / Math.PI;

  anguloRotacao = (anguloRotacao + 360) % 360;

  initialCursor.x = currentCursor.x;
  initialCursor.y = currentCursor.y;

  return anguloRotacao;
}
