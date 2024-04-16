import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { fabric } from 'fabric';

const loadGLBModel = (path, scenario) => {
    const loader = new GLTFLoader();
    loader.load(path, function (gltf) {
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          let ownCanva = new fabric.Canvas('temp', {
            width: 1024,
            height:1024,
            backgroundColor: '#555555',
          });
          child.castShadow = true;
          child.receiveShadow = true;
        ownCanva.renderAll();
          const initialTexture = new THREE.CanvasTexture(ownCanva.getElement());
          initialTexture.repeat.y = -1;
          initialTexture.offset.y = 1;
          child.userData.canva = ownCanva;
          child.material.map = initialTexture;
        }
      });
      scenario.add(gltf.scene);
    }, undefined, function (error) {
      console.log(error);
    });
  };

  function getIntersections ( raycaster, camera, scene, mouse ) {
    raycaster.setFromCamera( mouse, camera );
    let intersections = raycaster.intersectObjects( scene.children, true );
    return intersections;
  };

  function getIntersection (raycaster, camera, object, mouse) {
    raycaster.setFromCamera( mouse, camera );
    let intersection = raycaster.intersectObject( object, false );
    return intersection;
  };

  function selectImage(initialUVCursor, fabricCanvas, isImageSelected, rotated, selectedHandle, isHandleSelected) {
    let isSelected = false;
    const point = new fabric.Point(initialUVCursor.x, initialUVCursor.y);
    let imageSelectedContainsPoint = false;

    //itera o canvas e verifica se algum objeto contém o ponto
    fabricCanvas.current.forEachObject(function(obj) {
      if (obj.containsPoint(point) && fabricCanvas.current.getActiveObject() == obj) {
        isSelected = true;
        fabricCanvas.current.bringToFront(obj);
      } else if (obj.containsPoint(point) && !imageSelectedContainsPoint) {
        rotated = obj.angle;
        isSelected = true;
        fabricCanvas.current.setActiveObject(obj).bringToFront(obj).renderAll();
        updateTexture();
      }

      let tolerance = obj.scaleX * obj.width / 10;
      rotated = obj.angle;
      for (let i in obj.oCoords) {
        let supLimX = obj.oCoords[i].x + tolerance;
        let supLimY = obj.oCoords[i].y + tolerance;
        let infLimX = obj.oCoords[i].x - tolerance;
        let infLimY = obj.oCoords[i].y - tolerance;
        if (initialUVCursor.x <= supLimX &&
          initialUVCursor.x >= infLimX &&
          initialUVCursor.y >= infLimY &&
          initialUVCursor.y <= supLimY) {

          selectedHandle = i;
          isHandleSelected = true;
          isImageSelected = true;
          isSelected = true;
        };
      };
    });

    if (!isSelected) {
      fabricCanvas.current.discardActiveObject().renderAll();
      isImageSelected = false;
      updateTexture();
    }
    return isSelected;
  }

  function copyCanvas (origin, destination) {
    destination.clear();
    destination.backgroundColor = origin.backgroundColor;
    origin.forEachObject(function (i) {
      destination.add(i)
    });
  };

  const updateTexture = (fabricTexture) => {
    if (fabricTexture) fabricTexture.needsUpdate = true;
  }

  const handleImage = (e, fabricCanvas) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const imgObj = new Image();
      imgObj.src = e.target.result;
      imgObj.onload = function () {
        const fabricImage = new fabric.Image(imgObj);
        const scale = Math.min(
          fabricCanvas.current.width / fabricImage.width,
          fabricCanvas.current.height / fabricImage.height
        );
        fabricImage.set({
          selectable: true,
          left: fabricCanvas.current.width / 2,
          top: fabricCanvas.current.height / 2,
          originX: "center",
          originY: "center",
          scaleX: scale * 0.65,
          scaleY: scale * 0.65,
          cornerSize: scale * 0.65 * fabricCanvas.current.width / 5,
        });
        fabricCanvas.current.add(fabricImage);
        fabricCanvas.current.renderAll();
        updateTexture();
      }
    }
    reader.readAsDataURL(file);
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

  export { loadGLBModel, getIntersections, getIntersection, selectImage, copyCanvas, updateTexture, handleImage, calculateAngle }