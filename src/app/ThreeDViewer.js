"use client";
import * as THREE from "three";
import { fabric } from "fabric";
import { use, useEffect, useRef, useState } from "react";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import {
  getIntersections,
  loadGLBModel,
  selectImage,
  copyCanvas,
  getIntersection,
  calculateAngle,
  toHexString,
  handleImage,
} from "./utils";
import { color } from "three/examples/jsm/nodes/shadernode/ShaderNode";
import NextImage from "next/image";
import styles from "@/styles/page.module.css";
import galeryIcon from "../imgs/galeryBlack.png";
import textIcon from "@/imgs/textIcon.png";
import colorIcon from "@/imgs/colorIcon.webp";
import model1 from "@/imgs/model1.png";
import model2 from "@/imgs/model2.png";
import model3 from "@/imgs/model3.png";
import model4 from "@/imgs/model4.png";
import model5 from "@/imgs/model5.png";
import ColorEditor from "./ColorEditor";
import ImageEditor from "./ImageEditor";

const ThreeDViewer = () => {
  //qunado da select image fica tudo azul do componente preciso fazer um if ou tirar o azul por enquanto

  //zonas que deixa de dar para pegar na imagem de novo tem a ver com a area de intersecao e preciso fazer alguma diretamente prop. entre a tolerancia

  //meio lento a tocar em imagens ate aparecer os quadrados de scale

  //qunado se mete a imagem pequena deixa de se ter acesso

  //limitar scales
  //tolerance proporcional a scale DONE
  //raycaster layers

  //three variables-----------------------------------------------------------------------------------------------
  let editingComponent = useRef(null);
  const fabricCanvasRef = useRef(null);
  const containerRef = useRef();
  const raycaster = new THREE.Raycaster();
  let initialMouse = new THREE.Vector2();
  let currentMouse = new THREE.Vector2();
  let initialUVCursor = new THREE.Vector2();
  let currentUVCursor = new THREE.Vector2();
  let initialUVRotationCursor = new THREE.Vector2();
  let orbit;
  const [editingComponentHTML, setEditingComponentHTML] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageSrc, setImageSrc] = useState("");

  const [model, setModel] = useState("1");
  const [escolheBtn, setEscolheBtn] = useState(false);

  const [canvasSize, setCanvasSize] = useState(1024); // Default to larger size

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isChrome =
      /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(userAgent) && !isChrome;

    if (isSafari) {
      setCanvasSize(250); // Supondo que você quer um tamanho menor para Safari
    } else {
      setCanvasSize(1024); // Tamanho padrão para outros navegadores
    }
  }, []);

  //fabric variables----------------------------------------------------------------------------------------------
  let fabricCanvas = useRef(null);
  const [fabricTexture, setFabricTexture] = useState(null);
  let isDragging = false;
  let selectedHandle;
  let isHandleSelected = false;
  let isImageSelected = false;
  let rotated = 0;

  //cor variables
  const [colorEditor, setColorEditor] = useState(false);
  const [imageEditor, setImageEditor] = useState(false);
  const [textEditor, setTextEditor] = useState(false);

  //activeObject variable
  const [activeObject, setActiveObject] = useState(null);

  function setBGColor(hexColor) {
    // Remover qualquer espaço em branco e checar se já tem o prefixo '#'
    const color = hexColor.trim();
    if (color[0] === "#" && color.length === 7) {
      fabricCanvas.current.backgroundColor = color;
      fabricCanvas.current.renderAll();
      updateTexture();
    }
    //  if (editingComponent.current) {
    //   editingComponent.current.material.color.set(color);
    //   updateTexture();  // Assuming updateTexture updates the Three.js renderer
    // }
  }

  const updateTexture = () => {
    if (fabricTexture) fabricTexture.needsUpdate = true;
  };

  //load fabric canvas--------------------------------------------------------------------------------------------
  useEffect(() => {
    fabricCanvas.current = new fabric.Canvas("fabric-canvas", {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: "#fff",
    });

    const texture = new THREE.CanvasTexture(fabricCanvas.current.getElement());
    texture.repeat.y = -1;
    texture.offset.y = 1;
    setFabricTexture(texture);

    return () => fabricCanvas.current.dispose();
  }, [canvasSize]);

  useEffect(() => {
    if (!fabricTexture) return;

    //three set up-------------------------------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f4);
    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;
    camera.position.y = 0;
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf4f4f4); // cor de fundo da cena
    renderer.setPixelRatio(2); // aumentar os pixeis por pixeis para o dobro

    containerRef.current.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5); // luz para se ver à frente
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5); // luz para se ver à frente
    directionalLight.position.set(45, 45, -45);
    directionalLight2.position.set(-45, 45, 45);
    directionalLight.castShadow = true;
    directionalLight2.castShadow = true;

    scene.add(directionalLight);
    scene.add(directionalLight2);

    const url =
      model == 1
        ? "/hoodieTest.glb"
        : model == 2
        ? "/hoodieCortado1.glb"
        : model == 3
        ? "./hoodieCortado2.glb"
        : model == 4
        ? "./hoodieCortado3.glb"
        : model == 5
        ? "./hoodieCortado4.glb"
        : null;

    loadGLBModel(url, scene, setIsLoading);

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, 0, 0);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.35;
    orbit.screenSpacePanning = false;
    orbit.maxPolarAngle = Math.PI / 1.61; // nao deixa ir o user ver por baixo do hoodie, so o suficiente
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null,
    };
    orbit.enabled = true;

    //functions------------------------------------------------------------------------------------------------------
    const onMouseDown = (e) => {
      openTabs();
      const canvas = fabricCanvas.current;
      const activeObject = canvas.getActiveObject();
      setActiveObject(activeObject);

      if (activeObject) {
        const imageSrc = activeObject.getSrc();
        setImageSrc(imageSrc); // Seta a URL da fonte da imagem no estado
      }

      initialMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      initialMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
      let intersections = getIntersections(
        raycaster,
        camera,
        scene,
        initialMouse
      );

      if (
        editingComponent.current &&
        editingComponent.current.material &&
        editingComponent.current.material.emissive &&
        (!intersections.length ||
          editingComponent.current !== intersections[0].object)
      ) {
        editingComponent.current.material.emissive.setHex(0x000000); // Reset emissive color
      }

      //caso existam interseções
      if (intersections.length > 0) {
        //já existe um editing component ativo
        if (editingComponent.current) {
          /*fabricCanvas.current.renderAll();
          copyCanvas(fabricCanvas.current, editingComponent.current.userData.canva);
          editingComponent.current.userData.canva.renderAll();
          const texture = new THREE.CanvasTexture(editingComponent.current.userData.canva.getElement());
          texture.repeat.y = -1;
          texture.offset.y = 1;
          editingComponent.current.material.map = texture;*/

          //o editing component é igual ao objeto intersetado
          if (editingComponent.current == intersections[0].object) {
            intersections[0].object.material.emissive.setHex(0x000000); // Bright cyan glow

            initialUVCursor.x =
              intersections[0].uv.x * fabricCanvas.current.width;
            initialUVCursor.y =
              intersections[0].uv.y * fabricCanvas.current.height;
            initialUVRotationCursor.x = initialUVCursor.x;
            initialUVRotationCursor.y = initialUVCursor.y;
            editingComponent.current.material.map = fabricTexture;
            editingComponent.current.material.needsUpdate = true;

            isImageSelected = selectImage(
              initialUVCursor,
              fabricCanvas,
              isImageSelected,
              rotated,
              selectedHandle,
              isHandleSelected
            );
            let obj = fabricCanvas.current.getActiveObject();

            if (obj) {
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
                }
              }
            }
          } else {
            //o editing component é atualizado se não for igual

            fabricCanvas.current.renderAll();
            copyCanvas(
              fabricCanvas.current,
              editingComponent.current.userData.canva
            );
            editingComponent.current.userData.canva.renderAll();
            const texture = new THREE.CanvasTexture(
              editingComponent.current.userData.canva.getElement()
            );
            texture.repeat.y = -1;
            texture.offset.y = 1;
            editingComponent.current.material.map = texture;

            editingComponent.current = intersections[0].object;
            intersections[0].object.material.emissive.setHex(0xffffff); // Bright cyan glow

            if (!editingComponent.current.userData.canva) {
              let ownCanva = new fabric.Canvas("temp", {
                width: canvasSize,
                height: canvasSize,
                backgroundColor: "#ffffff",
              });
              ownCanva.renderAll();

              editingComponent.current.userData.canva = ownCanva;
            }

            if (editingComponent.current.userData.canva) {
              copyCanvas(
                editingComponent.current.userData.canva,
                fabricCanvas.current
              );
            } else {
              fabricCanvas.current.backgroundColor = toHexString(
                // editingComponent.current.material.color
                "#ffffff"
              );
            }

            isImageSelected = selectImage(
              initialUVCursor,
              fabricCanvas,
              isImageSelected,
              rotated,
              selectedHandle,
              isHandleSelected
            );
            editingComponent.current.material.map = fabricTexture;
            editingComponent.current.material.needsUpdate = true;

            fabricCanvas.current.renderAll();
            updateTexture();

            initialUVCursor.x =
              intersections[0].uv.x * fabricCanvas.current.width;
            initialUVCursor.y =
              intersections[0].uv.y * fabricCanvas.current.height;
          }

          //não existe nenhum editing component ativo
        } else {
          editingComponent.current = intersections[0].object;
          //console.log(editingComponent.current.name)
          if (!editingComponent.current.userData.canva) {
            //console.log('crating canva');
            let ownCanva = new fabric.Canvas("temp", {
              width: canvasSize,
              height: canvasSize,
              //   backgroundColor: toHexString(
              //     intersections[0].object.material.color
              //   ), //toHexString(intersections[0].object.material.color)
              backgroundColor: "#ffffff",
            });
            ownCanva.renderAll();
            const initialTexture = new THREE.CanvasTexture(
              ownCanva.getElement()
            );
            initialTexture.repeat.y = -1;
            initialTexture.offset.y = 1;
            editingComponent.current.userData.canva = ownCanva;
            console.log(editingComponent.current);
          }

          initialUVCursor.x =
            intersections[0].uv.x * fabricCanvas.current.width;
          initialUVCursor.y =
            intersections[0].uv.y * fabricCanvas.current.height;
          copyCanvas(
            editingComponent.current.userData.canva,
            fabricCanvas.current
          );
          isImageSelected = selectImage(
            initialUVCursor,
            fabricCanvas,
            isImageSelected,
            rotated,
            selectedHandle,
            isHandleSelected
          );
          fabricCanvas.current.renderAll();
          updateTexture();
          //editingComponent.current.material.color = fabricTexture;
          console.log(fabricTexture);
          editingComponent.current.material.map = fabricTexture;
          editingComponent.current.material.needsUpdate = true;
        }

        if (isImageSelected) {
          orbit.enabled = false;
          isDragging = true;
        }

        //caso não existam interseções
      } else {
        setEditingComponentHTML(null);
        if (editingComponent.current) {
          orbit.enabled = true;
          copyCanvas(
            fabricCanvas.current,
            editingComponent.current.userData.canva
          );
          editingComponent.current.userData.canva.renderAll();
          const texture = new THREE.CanvasTexture(
            editingComponent.current.userData.canva.getElement()
          );
          texture.repeat.y = -1;
          texture.offset.y = 1;
          editingComponent.current.material.map = texture;
        }
        editingComponent.current = null;
        fabricCanvas.current.renderAll();
        isHandleSelected = false;
        selectedHandle = null;
        isImageSelected = false;
      }

      fabricCanvas.current.renderAll();
      updateTexture();

      if (editingComponent.current)
        setEditingComponentHTML(editingComponent.current.userData.name);
    };

    const onMouseMove = (e) => {
      if (isDragging) {
        //se não estiver a orbitar e estiver a arrastar
        currentMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        currentMouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        let intersection = null;
        if (editingComponent.current)
          intersection = getIntersection(
            raycaster,
            camera,
            editingComponent.current,
            currentMouse
          )[0];
        orbit.enabled = false;
        if (intersection != null) {
          currentUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
          currentUVCursor.y = intersection.uv.y * fabricCanvas.current.height;
          //fabricCanvas.current.renderAll();
          //updateTexture();

          if (isImageSelected) {
            const activeObject = fabricCanvas.current.getActiveObject();

            if (activeObject) {
              let deltaX = currentUVCursor.x - initialUVCursor.x;
              let deltaY = currentUVCursor.y - initialUVCursor.y;
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
                activeObject.set({ angle: rotated });

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

                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                      scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                      originX: "center",
                      originY: "center",
                    });

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

                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: aCoords.tl.distanceFrom(aCoords.tr) / width,
                      scaleY: aCoords.tl.distanceFrom(aCoords.bl) / height,
                      originX: "center",
                      originY: "center",
                    });
                    break;

                  case "mtr":
                    rotated += calculateAngle(
                      new THREE.Vector2(activeObject.left, activeObject.top),
                      initialUVCursor,
                      currentUVCursor
                    );

                    activeObject.set({
                      angle: rotated,
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

                isImageSelected = selectImage(
                  initialUVCursor,
                  fabricCanvas,
                  isImageSelected,
                  rotated,
                  selectedHandle,
                  isHandleSelected
                );
                fabricCanvas.current.renderAll();
                updateTexture();
              }
            }
            initialUVCursor.x = currentUVCursor.x;
            initialUVCursor.y = currentUVCursor.y;
            if (fabricCanvas.current.getActiveObject()) {
              const obj = fabricCanvas.current.getActiveObject();
              fabricCanvas.current.getActiveObject().set({
                cornerSize: (obj.width * obj.scaleX) / 10,
              });
            }
            fabricCanvas.current.renderAll();
            updateTexture();
          }
        }
      } else return;
    };

    const onMouseUp = (e) => {
      isDragging = false;
      orbit.enabled = true;
      isHandleSelected = false;
      selectedHandle = null;
    };

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //animate--------------------------------------------------------------------------------------------------------
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

    //listeners------------------------------------------------------------------------------------------------------
    window.addEventListener("resize", onWindowResize);
    containerRef.current.addEventListener("mousedown", onMouseDown);
    containerRef.current.addEventListener("mousemove", onMouseMove);
    containerRef.current.addEventListener("mouseup", onMouseUp);
    fabricCanvas.current.on("object:modified", updateTexture);
    fabricCanvas.current.on("object:scaling", updateTexture);
    fabricCanvas.current.on("object:moving", updateTexture);
    fabricCanvas.current.on("object:rotating", updateTexture);
    fabricCanvas.current.on("object:added", updateTexture);

    return () => {
      renderer.domElement.remove();
      renderer.dispose();
      window.removeEventListener("resize", onWindowResize);
      if (containerRef.current) {
        containerRef.current.removeEventListener("mousedown", onMouseDown);
        containerRef.current.removeEventListener("mousemove", onMouseMove);
        containerRef.current.removeEventListener("mouseup", onMouseUp);
      }
      fabricCanvas.current.off("object:modified", updateTexture);
      fabricCanvas.current.off("object:scaling", updateTexture);
      fabricCanvas.current.off("object:moving", updateTexture);
      fabricCanvas.current.off("object:rotating", updateTexture);
      fabricCanvas.current.off("object:added", updateTexture);
    };
  }, [fabricTexture, model]);

  //funcoes de abrir e fechar a janela de edicao-------------------------------------------------------------------
  const openTabs = () => {
    const janela = document.getElementById("editZone");

    if (janela) {
      janela.style.right = "50px";
      janela.style.opacity = 1;
      janela.style.transition = "all 0.32s ease-in-out";
      janela.style.scale = 1;
    }
  };

  const closeEditor = () => {
    const janela = document.getElementById("editZone");

    if (janela) {
      janela.style.right = "-300px";
      janela.style.opacity = 0;
      janela.style.transition = "all 0.32s ease-in-out";
      janela.style.scale = 0;
    }
  };

  const closeTabs = () => {
    setTextEditor(false);
    setColorEditor(false);
    setImageEditor(false);
  };

  const colorEditorTab = () => {
    if (colorEditor) {
      setColorEditor(false);
    } else {
      setColorEditor(true);
    }
  };

  const imageEditorTab = () => {
    if (imageEditor) {
      setImageEditor(false);
    } else {
      setImageEditor(true);
    }
  };

  const textEditorTab = () => {
    if (textEditor) {
      setTextEditor(false);
    } else {
      setTextEditor(true);
    }
  };

  useEffect(() => {
    const canvas = fabricCanvasRef.current;
    if (!canvas) return;

    const updateActiveObject = () => {
      const activeObj = canvas.getActiveObject();
      setActiveObject(activeObj);
      if (activeObj && activeObj.type === "image") {
        setImageSrc(activeObj.getSrc());
      }
    };

    canvas.on("object:selected", updateActiveObject);
    canvas.on("selection:updated", updateActiveObject);
    canvas.on("selection:cleared", () => setActiveObject(null));

    return () => {
      canvas.off("object:selected", updateActiveObject);
      canvas.off("selection:updated", updateActiveObject);
      canvas.off("selection:cleared");
    };
  }, []);

  // Image source effect
  useEffect(() => {
    if (activeObject && activeObject.type === "image") {
      setImageSrc(activeObject.getSrc());
    }
  }, [activeObject]);

  return (
    <>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <p>A carregar...</p>
        </div>
      )}

      <div ref={containerRef}></div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 0,
        }}
      >
        <div style={{ display: "none" }}>
          <canvas
            id="fabric-canvas"
            style={{
              border: "1px solid #00bfff",
              marginRight: "20px",
            }}
          />
        </div>
        <div className={styles.bottomBar}>
          <div>
            <div className={styles.headerNomes}>
              <button
                className={styles.buttonArrows}
                //  onClick={retrocederZona}
              >
                &#8592;
              </button>
              <p className={styles.nomeZonas}>
                {/* {zonas[indiceZonaAtual]} */}
                Frente
              </p>
              <button
                className={styles.buttonArrows}
                // onClick={avancarZona}
              >
                &#8594;
              </button>
            </div>
          </div>
          <div
            // className={`${styles.footerNomes} ${
            //   isHovering ? styles.footerNomesVisible : ""
            // }`}
            className={styles.footerNomes}
          >
            <button
              // onClick={goToMenu}
              className={styles.settingsBtn}
            >
              <NextImage
                className={styles.settingsIcon}
                src={galeryIcon}
                width={20}
                height={20}
                alt="step"
              />
            </button>
            <button
              // onClick={goToMenu}
              style={{ fontSize: 16 }}
              className={styles.settingsBtn}
            >
              <NextImage
                className={styles.settingsIcon}
                src={textIcon}
                width={20}
                height={20}
                alt="step"
              />
            </button>
            <button
              // onClick={goToMenu}
              style={{ display: "flex" }}
              className={styles.settingsBtn}
            >
              <NextImage
                className={styles.settingsIcon}
                src={colorIcon}
                width={20}
                height={20}
                alt="step"
              />
            </button>
          </div>
        </div>
      </div>

      {editingComponent.current && editingComponent && (
        <div id="editZone" className={styles.editZone}>
          <div className={styles.nameZone}>
            <button onClick={closeEditor} className={styles.fileUploadLabeal}>
              <p
                style={{
                  marginTop: -16,
                  justifyContent: "center",
                  fontSize: 14.5,
                  color: "#fff",
                }}
              >
                &#10005;
              </p>
            </button>
            <div>
              <p className={styles.trititle}>
                A Costumizar{" "}
                <b className={styles.subtitle}>
                  {editingComponent.current.name}
                </b>
              </p>
            </div>

            <button
              className={styles.fileUploadLabeal}
              style={{ opacity: 0 }}
            />
          </div>

          <div className={styles.editHeader}>
            <div>
              {editingComponentHTML.includes("COR") ? (
                <button
                  onClick={colorEditorTab}
                  className={styles.divAreaEspecifica}
                  style={{ borderWidth: 0 }}
                >
                  <div className={styles.divIcon}>
                    <NextImage
                      src={colorIcon}
                      width={20}
                      height={20}
                      alt="step"
                    />
                  </div>
                  <div>
                    <p className={styles.titleText}>Cor</p>
                    <p className={styles.infoText}>
                      Dá um toque final ao teu produto.
                    </p>
                  </div>
                </button>
              ) : (
                <>
                  {editingComponentHTML.includes("MIX") ? (
                    <>
                      <button
                        onClick={imageEditorTab}
                        className={styles.divAreaEspecifica}
                      >
                        {/* <input
                          type="file"
                          accept="image/*"
                          onClick={imageEditorTab}
                          //   onChange={handleImage}
                          className={styles.uploadImgHiddenInput}
                        /> */}
                        <div className={styles.divIcon}>
                          <NextImage
                            src={galeryIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Imagem</p>
                          <p className={styles.infoText}>
                            Remover cores e alterar os atributos.
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={textEditorTab}
                        className={styles.divAreaEspecifica}
                      >
                        <div className={styles.divIcon}>
                          <NextImage
                            src={textIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Texto</p>
                          <p className={styles.infoText}>
                            Cor, fontes, tamanhos e alinhamentos.
                          </p>
                        </div>
                      </button>
                      <button
                        onClick={colorEditorTab}
                        className={styles.divAreaEspecifica}
                        style={{ borderWidth: 0 }}
                      >
                        <div className={styles.divIcon}>
                          <NextImage
                            src={colorIcon}
                            width={20}
                            height={20}
                            alt="step"
                          />
                        </div>
                        <div>
                          <p className={styles.titleText}>Cor</p>
                          <p className={styles.infoText}>
                            Dá um toque final ao teu produto.
                          </p>
                        </div>
                      </button>
                    </>
                  ) : (
                    <>
                      {editingComponentHTML.includes("IMP") ? (
                        <>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImage}
                            style={{
                              padding: "50px",
                              backgroundColor: "#234567",
                              position: "absolute",
                              top: "100px",
                            }}
                          />
                        </>
                      ) : (
                        <>
                          <h1
                            style={{
                              fontSize: "100px",
                              color: "#000000",
                              position: "absolute",
                              top: "0px",
                            }}
                          >
                            Não podes editar isso rapah toma juizo
                          </h1>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {colorEditor && (
        <ColorEditor setBGColor={setBGColor} closeTabs={closeTabs} />
      )}

      {imageEditor && (
        <ImageEditor
          fabricCanvas={fabricCanvas}
          updateTexture={updateTexture}
          closeTabs={closeTabs}
          activeObject={activeObject}
          setImageSrc={setImageSrc}
          imageSrc={imageSrc}
        />
      )}

      {textEditor && (
        <textEditor
          fabricCanvas={fabricCanvas}
          updateTexture={updateTexture}
          closeTabs={closeTabs}
          activeObject={activeObject}
          setImageSrc={setImageSrc}
          imageSrc={imageSrc}
        />
      )}
      {/* {colorEditor && (
        <ColorEditor
          activeObject={activeObject}
          closeEditor={goToMenu}
          // changeColor={changeMeshMaterialColorByName}
          handleColorChange={handleColorChange}
          targetCanvasId={componentCanvasMap[editingComponent.current.name]}
        />
      )} */}
      {escolheBtn == false && (
        <div className={styles.modelsZone}>
          <h1
            className={styles.title}
            style={{ textAlign: "center", marginBottom: 25 }}
          >
            Escolhe um modelo para começares
          </h1>
          <div className={styles.modelosBtns}>
            <button
              className={styles.modeloBtn}
              onClick={() => {
                setModel("1");
                setEscolheBtn(true);
              }}
            >
              <NextImage
                src={model1}
                className={styles.modelosImgs}
                width={150}
                height={150}
              />
            </button>
            <button
              className={styles.modeloBtn}
              onClick={() => {
                setModel("2");
                setEscolheBtn(true);
              }}
            >
              <NextImage
                src={model2}
                className={styles.modelosImgs}
                width={150}
                height={150}
              />
            </button>
            <button
              className={styles.modeloBtn}
              onClick={() => {
                setModel("3");
                setEscolheBtn(true);
              }}
            >
              <NextImage
                src={model3}
                className={styles.modelosImgs}
                width={150}
                height={150}
              />
            </button>
            <button
              className={styles.modeloBtn}
              onClick={() => {
                setModel("4");
                setEscolheBtn(true);
              }}
            >
              <NextImage
                src={model4}
                className={styles.modelosImgs}
                width={150}
                height={150}
              />
            </button>
            <button
              className={styles.modeloBtn}
              onClick={() => {
                setModel("5");
                setEscolheBtn(true);
              }}
            >
              <NextImage
                src={model5}
                className={styles.modelosImgs}
                width={150}
                height={150}
              />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ThreeDViewer;
