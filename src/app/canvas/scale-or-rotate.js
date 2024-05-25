import * as THREE from 'three'
import { getIntersection } from "../three/get-intersections";
import { selectImage } from "./select-image";

export function scaleOrRotateOrMove (
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
    cursorXRatio,
    cursorYRatio, 
    objectRotation, 
    updateTexture,
    orbit,
    selectImageResult,
    minScaleAllowed,
    canvasSize
    ) {

    if (!isDragging) return;

    const isHandleSelected = selectImageResult.selectedHandle;
    const selectedHandle = selectImageResult.selectedHandle;
    const isImageSelected = selectImageResult.isImageSelected;

    //const minScaleAllowed = 100;

    orbit.enabled = false;
    currentMouse.x = (x / window.innerWidth) * 2 - 1;
    currentMouse.y = -(y / window.innerHeight) * 2 + 1;

    let intersection = null;
    if (editingComponent.current)
      intersection = getIntersection(
        raycaster,
        camera,
        editingComponent.current,
        currentMouse
      )[0];

    const deltaMouseXForRatio = (currentMouse.x - initialMouseForReal.x) * window.innerWidth;
    const deltaMouseYForRatio = (currentMouse.y - initialMouseForReal.y) * window.innerHeight;

    const deltaMouseX = (currentMouse.x - initialMouse.x);
    const deltaMouseY = (currentMouse.y - initialMouse.y);

    if (intersection != null) {

        if (isMouseOutsideModel.current) {
            initialUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
            initialUVCursor.y = intersection.uv.y * fabricCanvas.current.height;
        }
        isMouseOutsideModel.current = false;

        currentUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
        currentUVCursor.y = intersection.uv.y * fabricCanvas.current.height;

        if (selectImageResult.isImageSelected) {
            const activeObject = fabricCanvas.current.getActiveObject();

            if (activeObject) {

                objectRotation.current = activeObject.angle;

                let deltaX = currentUVCursor.x - initialUVCursor.x;
                let deltaY = currentUVCursor.y - initialUVCursor.y;
  
                let deltaXForRatio = (currentUVCursor.x - initialUVRotationCursor.x);
                let deltaYForRatio = (currentUVCursor.y - initialUVRotationCursor.y);

                if (!cursorXRatio.current && !cursorYRatio.current) {
                  cursorXRatio.current = deltaXForRatio / deltaMouseXForRatio;
                  cursorYRatio.current = deltaYForRatio / deltaMouseYForRatio;
                }
  
                console.log('sexo',cursorXRatio.current);

                const width = activeObject.width,
                height = activeObject.height;
              const aspectRatio =
                (activeObject.scaleX * width) / (activeObject.scaleY * height);

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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          activeObject.scaleY * activeObject.height <=
                            minScaleAllowed &&
                          aCoords.tl.distanceFrom(aCoords.bl) / height <
                            activeObject.scaleY
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          activeObject.scaleY * activeObject.height <=
                            minScaleAllowed &&
                          aCoords.tl.distanceFrom(aCoords.bl) / height <
                            activeObject.scaleY
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
    
                        if (activeObject instanceof fabric.Image) {
                          if (
                            activeObject.scaleX * activeObject.width <=
                              minScaleAllowed &&
                            aCoords.tl.distanceFrom(aCoords.tr) / width <
                              activeObject.scaleX
                          ) {
                            break;
                          }
    
    
                          activeObject.set({
                            left: aCoords.tl.lerp(aCoords.br).x,
                            top: aCoords.tl.lerp(aCoords.br).y,
                            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                            originX: "center",
                            originY: "center",
                          });
                        } else {
                          if (activeObject.textLines.length == 1 && aCoords.tl.distanceFrom(aCoords.tr) > activeObject.width) {
                            break;
                          } else {
                            activeObject.set({
                              width: aCoords.tl.distanceFrom(aCoords.tr),
                              originX: "center",
                              originY: "center",
                            });

                          }

                        }
    
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
    
                        if (activeObject instanceof fabric.Image) {
                          if (
                            activeObject.scaleX * activeObject.width <=
                              minScaleAllowed &&
                            aCoords.tl.distanceFrom(aCoords.tr) / width <
                              activeObject.scaleX
                          ) {
                            break;
                          }
    
                          activeObject.set({
                            left: aCoords.tl.lerp(aCoords.br).x,
                            top: aCoords.tl.lerp(aCoords.br).y,
                            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                            originX: "center",
                            originY: "center",
                          });
                        } else {
                          if (activeObject.textLines.length == 1 && aCoords.tl.distanceFrom(aCoords.tr) > activeObject.width) {
                            break;
                          } else {
                            activeObject.set({
                              width: aCoords.tl.distanceFrom(aCoords.tr),
                              originX: "center",
                              originY: "center",
                            });
                          }
                        }
    
                        break;
    
                      case "mtr":
                        objectRotation.current += calculateAngle(
                          new THREE.Vector2(activeObject.left, activeObject.top),
                          initialUVCursor,
                          currentUVCursor
                        );
    
                        activeObject.set({
                          angle: objectRotation.current,
                        });
                        break;
                    }
                  } else if (
                    isImageSelected &&
                    activeObject.containsPoint(initialUVCursor)
                  ) {
                    activeObject.set({
                      left: activeObject.left + deltaX,
                      top: activeObject.top + deltaY,
                    });
                    fabricCanvas.current.renderAll();
                    updateTexture();
                  }
            }
        }

    } else {
        if (!cursorXRatio.current && !cursorYRatio.current) return
            
            isMouseOutsideModel.current = true;

            if (selectImageResult.isImageSelected) {
                const activeObject = fabricCanvas.current.getActiveObject();

                if (activeObject) {
                    objectRotation.current = activeObject.angle;

                    if (cursorXRatio.current == 0) cursorXRatio.current = 1;
                    if (cursorYRatio.current == 0) cursorYRatio.current = 1;

                    if(cursorXRatio.current < 0) cursorXRatio.current *= -1;
                    if(cursorYRatio.current < 0) cursorYRatio.current *= -1;
    
                    if (Math.abs(cursorXRatio.current) >= 5 ) {
                      if (cursorXRatio.current < 0) cursorXRatio.current = - 5;
                      else cursorXRatio.current = 5;
                    }

                    if (Math.abs(cursorYRatio.current) >= 5 ) {
                      if (cursorYRatio.current < 0) cursorYRatio.current = - 5;
                      else cursorYRatio.current = 5;
                    }
    
                    let deltaX = deltaMouseX * window.innerWidth * cursorXRatio.current * fabricCanvas.current.width;
                    let deltaY = deltaMouseY * window.innerHeight * cursorYRatio.current * fabricCanvas.current.height;
                    console.log(deltaX)

                    const width = activeObject.width,
                    height = activeObject.height;
                  const aspectRatio =
                    (activeObject.scaleX * width) / (activeObject.scaleY * height);
    
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          (activeObject.scaleX * activeObject.width <=
                            minScaleAllowed ||
                            activeObject.scaleY * activeObject.height <=
                              minScaleAllowed) &&
                          (aCoords.tl.distanceFrom(aCoords.tr) / width <
                            activeObject.scaleX ||
                            aCoords.tl.distanceFrom(aCoords.bl) / height <
                              activeObject.scaleY)
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          activeObject.scaleY * activeObject.height <=
                            minScaleAllowed &&
                          aCoords.tl.distanceFrom(aCoords.bl) / height <
                            activeObject.scaleY
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
                        if (
                          activeObject.scaleY * activeObject.height <=
                            minScaleAllowed &&
                          aCoords.tl.distanceFrom(aCoords.bl) / height <
                            activeObject.scaleY
                        ) {
                          break;
                        }
    
                        activeObject.set({
                          left: aCoords.tl.lerp(aCoords.br).x,
                          top: aCoords.tl.lerp(aCoords.br).y,
                          scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                          scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                          originX: "center",
                          originY: "center",
                        });
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
    
                        if (activeObject instanceof fabric.Image) {
                          if (
                            activeObject.scaleX * activeObject.width <=
                              minScaleAllowed &&
                            aCoords.tl.distanceFrom(aCoords.tr) / width <
                              activeObject.scaleX
                          ) {
                            break;
                          }
    
    
                          activeObject.set({
                            left: aCoords.tl.lerp(aCoords.br).x,
                            top: aCoords.tl.lerp(aCoords.br).y,
                            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                            originX: "center",
                            originY: "center",
                          });
                        } else {
                          if (activeObject.textLines.length == 1 && aCoords.tl.distanceFrom(aCoords.tr) > activeObject.width) {
                            break;
                          } else {
                            activeObject.set({
                              width: aCoords.tl.distanceFrom(aCoords.tr),
                              originX: "center",
                              originY: "center",
                            });
                          }
                        }
    
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
    
                        if (activeObject instanceof fabric.Image) {
                          if (
                            activeObject.scaleX * activeObject.width <=
                              minScaleAllowed &&
                            aCoords.tl.distanceFrom(aCoords.tr) / width <
                              activeObject.scaleX
                          ) {
                            break;
                          }
    
                          activeObject.set({
                            left: aCoords.tl.lerp(aCoords.br).x,
                            top: aCoords.tl.lerp(aCoords.br).y,
                            scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                            scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                            originX: "center",
                            originY: "center",
                          });
                        } else {
                          if (activeObject.textLines.length == 1 && aCoords.tl.distanceFrom(aCoords.tr) > activeObject.width) {
                            break;
                          } else {
                            activeObject.set({
                              width: aCoords.tl.distanceFrom(aCoords.tr),
                              originX: "center",
                              originY: "center",
                            });
                          }
                        }
    
                        break;
    
                      case "mtr":
                        objectRotation.current += calculateAngle(
                          new THREE.Vector2(activeObject.left, activeObject.top),
                          initialUVCursor,
                          currentUVCursor
                        );
    
                        activeObject.set({
                          angle: objectRotation.current,
                        });
                        break;
                    }
                  } else if (
                    isImageSelected &&
                    activeObject.containsPoint(initialUVCursor)
                  ) {
                    activeObject.set({
                      left: activeObject.left + deltaX,
                      top: activeObject.top + deltaY,
                    });
                    fabricCanvas.current.renderAll();
                    updateTexture();
                  }
                }
            }
        

    }

    initialUVCursor.x = currentUVCursor.x;
    initialUVCursor.y = currentUVCursor.y;
    initialMouse.x = currentMouse.x;
    initialMouse.y = currentMouse.y;
    if (fabricCanvas.current.getActiveObject()) {
      const obj = fabricCanvas.current.getActiveObject();

      if (obj instanceof fabric.Image) {
        const minSide = Math.min((obj.width * obj.scaleX), (obj.height * obj.scaleY));
        let tolerance = minSide / 10;
        if (tolerance < canvasSize/100) tolerance = canvasSize/100;
        obj.set({
          cornerSize: tolerance,
          rotatingPointOffset: ((obj.height * obj.scaleY) / 2) + tolerance,
        })
        const originalControl = fabric.Object.prototype.controls.mtr;
        fabric.Object.prototype.controls.mtr = new fabric.Control({
          x: 0,
          y: 0,
          offsetY: - ((obj.height * obj.scaleY) / 2) - ((obj.width * obj.scaleX) + (obj.height * obj.scaleY)) / 20,
          actionHandler: originalControl.actionHandler,
          withConnection: true,
          actionName: 'rotate',
          
        })
      }


    }
    fabricCanvas.current.renderAll();
    updateTexture();

}

function calculateAngle(centralPoint, initialCursor, currentCursor) {

    const vetorInicial = {
      x: initialCursor.x - centralPoint.x,
      y: initialCursor.y - centralPoint.y
    };
  
    const vetorAtual = {
      x: currentCursor.x - centralPoint.x,
      y: currentCursor.y - centralPoint.y
    };
  
    const anguloInicial = Math.atan2(vetorInicial.y, vetorInicial.x);
    const anguloAtual = Math.atan2(vetorAtual.y, vetorAtual.x);
  
    let anguloRotacao = anguloAtual - anguloInicial;
  
    anguloRotacao *= (180 / Math.PI);

    anguloRotacao = (anguloRotacao + 360) % 360;

    initialCursor.x = currentCursor.x;
    initialCursor.y = currentCursor.y;
  
    return anguloRotacao;
}