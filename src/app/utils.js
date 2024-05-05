import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { fabric } from "fabric";
import TWEEN from "@tweenjs/tween.js";
import { TextureLoader } from "three";

const loadGLBModel = (path, scenario, setIsLoading, onNamesLoaded) => {
  const loader = new GLTFLoader();
  const textureLoader = new TextureLoader();

  const objectNames = []; // Array para armazenar os nomes dos objetos

  // Load normal and roughness maps
  const normalMap = textureLoader.load("/normal.png");
  const roughnessMap = textureLoader.load("/roughness.png");

  loader.load(
    path,
    function (gltf) {
      // Ajuste da posição inicial da cena do modelo
      gltf.scene.position.set(0, -1, 0);
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          child.material.normalMap = normalMap;
          child.material.roughnessMap = roughnessMap;
          child.material.needsUpdate = true;
          child.castShadow = true;
          child.receiveShadow = true;
          objectNames.push(child.name); // Adiciona o nome ao array
        }
      });

      // Adiciona a cena completa ao cenário
      scenario.add(gltf.scene);

      // Inicia a animação da escala da cena completa
      new TWEEN.Tween({ x: 0, y: 0, z: 0 })
        .to({ x: 1.1, y: 1.1, z: 1.1 }, 1610)
        .easing(TWEEN.Easing.Cubic.Out)
        .onUpdate((scale) => {
          gltf.scene.scale.set(scale.x, scale.y, scale.z);
        })
        .start();

      setIsLoading(false);

      if (onNamesLoaded) {
        onNamesLoaded(objectNames); // Chama o callback passando o array de nomes
      }
    },
    undefined,
    function (error) {
      setIsLoading(false);
      console.log(error);
    }
  );
};

function getIntersections(raycaster, camera, scene, mouse) {
  raycaster.setFromCamera(mouse, camera);
  let intersections = raycaster.intersectObjects(scene.children, true);
  return intersections;
}

function getIntersection(raycaster, camera, object, mouse) {
  raycaster.setFromCamera(mouse, camera);
  let intersection = raycaster.intersectObject(object, false);
  return intersection;
}

function selectImage(
  initialUVCursor,
  fabricCanvas,
  isImageSelected,
  rotated,
  selectedHandle,
  isHandleSelected
) {
  let isSelected = false;
  const point = new fabric.Point(initialUVCursor.x, initialUVCursor.y);
  let imageSelectedContainsPoint = false;

  //itera o canvas e verifica se algum objeto contém o ponto
  fabricCanvas.current.forEachObject(function (obj) {
    if (
      obj.containsPoint(point) &&
      fabricCanvas.current.getActiveObject() == obj
    ) {
      isSelected = true;
      fabricCanvas.current.bringToFront(obj);
    } else if (obj.containsPoint(point) && !imageSelectedContainsPoint) {
      rotated = obj.angle;
      isSelected = true;
      fabricCanvas.current.setActiveObject(obj).bringToFront(obj).renderAll();
      updateTexture();
    }

    let tolerance = (obj.scaleX * obj.width) / 10;
    rotated = obj.angle;
    for (let i in obj.oCoords) {
      let supLimX = obj.oCoords[i].x + tolerance;
      let supLimY = obj.oCoords[i].y + tolerance;
      let infLimX = obj.oCoords[i].x - tolerance;
      let infLimY = obj.oCoords[i].y - tolerance;
      if (
        initialUVCursor.x <= supLimX &&
        initialUVCursor.x >= infLimX &&
        initialUVCursor.y >= infLimY &&
        initialUVCursor.y <= supLimY
      ) {
        selectedHandle = i;
        isHandleSelected = true;
        isImageSelected = true;
        isSelected = true;
      }
    }
  });

  if (!isSelected) {
    fabricCanvas.current.discardActiveObject().renderAll();
    isImageSelected = false;
    updateTexture();
  }
  return isSelected;
}

function copyCanvas(origin, destination) {
  destination.clear();
  destination.backgroundColor = origin.backgroundColor;
  origin.forEachObject(function (i) {
    destination.add(i);
  });
}

const updateTexture = (fabricTexture) => {
  if (fabricTexture) fabricTexture.needsUpdate = true;
};

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
        // scaleX: scale * 0.65,
        // scaleY: scale * 0.65,
        cornerSize: (fabricImage.width * fabricImage.scaleX) / 100,
        transparentCorners: false,
        cornerColor: "rgb(255,0,0)",
      });
      fabricCanvas.current.add(fabricImage);
      fabricCanvas.current.renderAll();
      updateTexture();
    };
  };
  reader.readAsDataURL(file);
};

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

function toHexString(color) {
  // Check if isColor is true before proceeding

  // Convert each color component to an integer in the range 0-255
  const red = Math.round(color.r * 255);
  const green = Math.round(color.g * 255);
  const blue = Math.round(color.b * 255);

  // Convert each component to a hexadecimal string and pad with zeros
  const redHex = red.toString(16).padStart(2, "0");
  const greenHex = green.toString(16).padStart(2, "0");
  const blueHex = blue.toString(16).padStart(2, "0");

  // Concatenate the hex strings with a '#' prefix
  return `#${redHex}${greenHex}${blueHex}`;
}

export {
  loadGLBModel,
  getIntersections,
  getIntersection,
  selectImage,
  copyCanvas,
  updateTexture,
  handleImage,
  calculateAngle,
  toHexString,
};
