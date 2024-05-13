"use client";
import * as THREE from "three";
import { fabric } from "fabric";
import { useEffect, useRef, useState } from "react";
import TWEEN from "@tweenjs/tween.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import Link from "next/link";
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
import NextImage from "next/image";
import styles from "@/styles/page.module.css";
import galeryIcon from "../imgs/galeryBlack.png";
import textIcon from "@/imgs/textIcon.png";
import colorIcon from "@/imgs/colorIcon.webp";
import shareIcon from "@/imgs/iconShare.png";
import buildingIcon from "@/imgs/buildingIcon.png";
import model5 from "@/imgs/1foto.png";
import model3 from "@/imgs/2foto.png";
import model1 from "@/imgs/3foto.png";
import model4 from "@/imgs/4foto.png";
import model2 from "@/imgs/5foto.png";
import ColorEditor from "./ColorEditor";
import ImageEditor from "./ImageEditor";
import TextEditor from "./TextEditor";
import { fontList } from "./fonts";
import { useRouter } from "next/navigation";
import { getPartName } from "@/utils/getPartName";
import { ref, uploadString, getDownloadURL } from "firebase/storage";
import { storage } from "@/firebase";

const ThreeDViewer = () => {
  //qunado da select image fica tudo azul do componente preciso fazer um if ou tirar o azul por enquanto

  //zonas que deixa de dar para pegar na imagem de novo tem a ver com a area de intersecao e preciso fazer alguma diretamente prop. entre a tolerancia

  //meio lento a tocar em imagens ate aparecer os quadrados de scale

  //qunado se mete a imagem pequena deixa de se ter acesso

  //limitar scales
  //tolerance proporcional a scale DONE
  //raycaster layers
  const router = useRouter();
  //three variables-----------------------------------------------------------------------------------------------
  let editingComponent = useRef(null);
  const fabricCanvasRef = useRef(null);
  const containerRef = useRef();
  const sceneRef = useRef(null); // Create a ref for the scene

  const raycaster = new THREE.Raycaster();
  let initialMouse = new THREE.Vector2();
  let currentMouse = new THREE.Vector2();
  let initialUVCursor = new THREE.Vector2();
  let currentUVCursor = new THREE.Vector2();
  let initialUVRotationCursor = new THREE.Vector2();
  let orbit;
  const [editingComponentHTML, setEditingComponentHTML] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageSrc, setImageSrc] = useState("");

  const [model, setModel] = useState("0");
  const [escolheBtn, setEscolheBtn] = useState(false);
  const [preview, setPreview] = useState(false);
  const [tutorial, setTutorial] = useState(false);

  const [canvasSize, setCanvasSize] = useState(480); // Default to larger size
  const [variavelAjuste, setVariavelAjuste] = useState(23.67); //9732cm^2 totais de area || area do canvas 230400cm2

  const [fabricCanvases, setFabricCanvases] = useState([]);
  const [maxTextSize, setMaxTextSize] = useState(100);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const isChrome =
      /Chrome/.test(userAgent) && /Google Inc/.test(navigator.vendor);
    const isSafari = /Safari/.test(userAgent) && !isChrome;

    if (isSafari) {
      setCanvasSize(480); // Supondo que você quer um tamanho menor para Safari
      setVariavelAjuste(23.67);
      setMaxTextSize(100);
    } else {
      setCanvasSize(1024); // Tamanho padrão para outros navegadores
      setVariavelAjuste(47.47);
      setMaxTextSize(200);
    }
  }, []);

  const [objectNames, setObjectNames] = useState([]); // Estado para armazenar os nomes dos objetos
  const [currentIndex, setCurrentIndex] = useState(0); // Estado para o índice atual

  const [firstClick, setFirstClick] = useState(true);
  let localFirstClick = firstClick; // Copia o estado atual para uma variável local

  const [editorOpen, setEditorOpen] = useState(false);

  const minScaleAllowed = 100;

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

  //nomes certos dos objetos

  function setBGColor(hexColor) {
    const color = hexColor.trim(); // Clean the input
    if (color[0] !== "#" || color.length !== 7) return; // Ensure valid color
    editingComponent.current.material.emissive.setHex(0x000000); // Reset emissive color

    const canvas = fabricCanvas.current;
    if (!canvas) return;

    const startColor = new THREE.Color(canvas.backgroundColor); // Current color
    const endColor = new THREE.Color(color); // New color from input

    let progress = 0; // Initialize progress
    const duration = 400; // Duration of the transition in milliseconds
    const stepTime = 10; // Time each step takes

    function step() {
      progress += stepTime;
      const lerpFactor = progress / duration;
      if (lerpFactor < 1) {
        // Continue interpolation
        const interpolatedColor = startColor.lerpColors(
          startColor,
          endColor,
          lerpFactor
        );
        const cssColor = "#" + interpolatedColor.getHexString();
        canvas.setBackgroundColor(cssColor, canvas.renderAll.bind(canvas));
        requestAnimationFrame(step); // Request the next animation frame
      } else {
        // Final color set after the animation ends
        canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      }
      updateTexture(); // Update texture if needed
    }
    step();
  }

  const updateTexture = () => {
    if (fabricTexture) fabricTexture.needsUpdate = true;
  };

  const [precoFinal, setPrecoFinal] = useState("13.25"); // Preço inicial de 10€ como string para fácil manipulação na renderização
  const [precoAnimado, setPrecoAnimado] = useState("0.00"); // Estado para controlar o valor animado do preço

  const setupCanvases = () => {
    fabricCanvases[0].setDimensions({ width: 100, height: 80 }); // Front
    fabricCanvases[1].setDimensions({ width: 100, height: 100 }); // Back
    fabricCanvases[2].setDimensions({ width: 60, height: 100 }); // Left
    fabricCanvases[3].setDimensions({ width: 60, height: 100 }); // Right
  };

  const [fontSize, setFontSize] = useState(35);
  const [tex, setTex] = useState("");
  const [texMesh, setTexMesh] = useState("");
  const [fillColor, setFillColor] = useState("#000000"); // Default color set to blue
  const [textAlign, setTextAlign] = useState("center");
  const [fontFamily, setFontFamily] = useState("Arial");

  const [docId, setDocId] = useState("");

  //load fabric canvas--------------------------------------------------------------------------------------------
  useEffect(() => {
    fabricCanvas.current = new fabric.Canvas("fabric-canvas", {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: "#fff",
      part: editingComponent.current
        ? editingComponent.current.name
        : "bodyFMIX",
    });
    /* setFabricCanvases((prevCanvases) => [
      ...prevCanvases,
      fabricCanvas.current,
    ]); */

    const texture = new THREE.CanvasTexture(fabricCanvas.current.getElement());
    texture.repeat.y = -1;
    texture.offset.y = 1;
    setFabricTexture(texture);

    return () => fabricCanvas.current.dispose();
  }, [canvasSize]);

  const [clientData, setClientData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  async function getActiveScene() {
    const dataL = await testP();
    console.log("dataL", dataL);

    try {
      const response = await fetch(
        "https://allkits-server.onrender.com/convertSceneToText",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sceneData: dataL,
            clientData,
            model: model,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to convert scene to JSON");
      }

      const data = await response.json(); // Parse JSON response
      const id = data.docId; // Access the docId field

      setDocId(id);

      // You can do further processing with the docId here if needed
    } catch (error) {
      console.error("Error:", error);
    }
  }

  useEffect(() => {
    if (!fabricTexture) return;

    //three set up-------------------------------------------------------------------------------------------------
    const scene = new THREE.Scene();
    sceneRef.current = scene; // Assign the created scene to the ref

    scene.background = new THREE.Color(0xf4f4f4);
    const camera = new THREE.PerspectiveCamera(
      35,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 25;
    camera.position.y = -5;
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xf4f4f4); // cor de fundo da cena
    renderer.setPixelRatio(2); // aumentar os pixeis por pixeis para o dobro

    containerRef.current.appendChild(renderer.domElement);
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xf4f4f4, 1.5); // luz para se ver à frente
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5); // luz para se ver à frente
    directionalLight.position.set(90, 45, -45);
    directionalLight2.position.set(-45, 90, 90);
    directionalLight.castShadow = true;
    directionalLight2.castShadow = true;

    scene.add(directionalLight);
    scene.add(directionalLight2);

    const url =
      model == 1
        ? "/hoodieTest.glb"
        : model == 2
        ? "/1.glb"
        : model == 3
        ? "./2.glb"
        : model == 4
        ? "./3.glb"
        : model == 5
        ? "./4.glb"
        : null;

    if (model == 1 || model == 2 || model == 3 || model == 4 || model == 5)
      loadGLBModel(url, scene, setIsLoading, setObjectNames);

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, 0, 0);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.161;
    orbit.screenSpacePanning = false;
    orbit.maxPolarAngle = Math.PI / 1.61; // nao deixa ir o user ver por baixo do hoodie, so o suficiente
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null,
    };
    orbit.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: null,
    };
    orbit.enabled = true;
    orbit.minDistance = 16.1;
    orbit.maxDistance = 35;
    // Create the fog instance and add it to the scene
    // Parameters: fog color, start distance, end distance
    // scene.fog = new THREE.Fog(0xff0000, 10, 100);
    scene.fog = new THREE.FogExp2(0xffffff, 0.0161);

    // Função para animar a cor emissiva
    function animateEmissiveColor(object, startColor, endColor, duration) {
      const start = { r: startColor.r, g: startColor.g, b: startColor.b };
      const end = { r: endColor.r, g: endColor.g, b: endColor.b };

      new TWEEN.Tween(start)
        .to(end, duration)
        .onUpdate(() => {
          // Atualiza a cor emissiva do material
          object.material.emissive.setRGB(start.r, start.g, start.b);
        })
        .start(); // Inicia a animação
    }

    //functions------------------------------------------------------------------------------------------------------
    const handleInteractionStart = (e) => {
      // Determine the input type and extract coordinates accordingly
      const isTouchEvent = e.type.includes("touch");
      const x = isTouchEvent ? e.touches[0].clientX : e.clientX;
      const y = isTouchEvent ? e.touches[0].clientY : e.clientY;

      const canvas = fabricCanvas.current;
      const activeObject = canvas.getActiveObject();
      setActiveObject(activeObject);

      // Calculate normalized device coordinates
      initialMouse.x = (x / window.innerWidth) * 2 - 1;
      initialMouse.y = -(y / window.innerHeight) * 2 + 1;
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
        openTabs();

        let obj = fabricCanvas.current.getActiveObject();
        // if (obj) {
        //   setEditorOpen(false);
        // }

        // if (activeObject && activeObject.type == "image") {
        //   const imageSrc = activeObject.getSrc();
        //   setImageSrc(imageSrc); // Seta a URL da fonte da imagem no estado
        //   setTimeout(() => {
        //     setTextEditor(false);
        //     setImageEditor(true);
        //   }, 1610);
        // } else if (activeObject && activeObject.type == "textbox") {
        //   setTimeout(() => {
        //     setImageEditor(false);
        //     setTextEditor(true);
        //   }, 1610);
        // }

        // console.log("intercetou", intersections[0].object.name);
        // editingComponent.current = intersections[0].object;
        //já existe um editing component ativo
        if (editingComponent.current) {
          //o editing component é igual ao objeto intersetado
          if (editingComponent.current == intersections[0].object) {
            if (localFirstClick) {
              setTutorial(true);
              const object = intersections[0].object;
              intersections[0].object.material.emissive.setHex;
              const currentEmissive = object.material.emissive.getHex();

              animateEmissiveColor(
                object,
                new THREE.Color(currentEmissive),
                new THREE.Color(0x00bfff),
                400
              );
              animateEmissiveColor(
                object,
                new THREE.Color(0x00bfff),

                new THREE.Color(currentEmissive),
                400
              );
              setFirstClick(false);
              localFirstClick = false; // Atualiza a variável local imediatamente
            } else {
              intersections[0].object.material.emissive.setHex(0x000000); // Bright cyan glow
            }

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
            //obj
            if (obj) {
              setActiveObject(obj);
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
              if (!isDragging) {
                isDragging = true; // Start dragging only if it's a new interaction
                // selectAndHandleObject(intersections);
              }
            } else {
              setActiveObject(null);
            }
          } else {
            //o editing component é atualizado se não for igual
            const object = intersections[0].object;
            intersections[0].object.material.emissive.setHex;
            const currentEmissive = object.material.emissive.getHex();

            animateEmissiveColor(
              object,
              new THREE.Color(currentEmissive),
              new THREE.Color(0x00bfff),
              400
            );
            animateEmissiveColor(
              object,
              new THREE.Color(0x00bfff),

              new THREE.Color(currentEmissive),
              400
            );
            closeTabs();

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

            // intersections[0].object.material.emissive.setHex(0xffffff); // Bright cyan glow

            if (!editingComponent.current.userData.canva) {
              let ownCanva = new fabric.Canvas("temp", {
                width: canvasSize,
                height: canvasSize,
                backgroundColor: "#ffffff",
                part: editingComponent.current.name,
              });
              setFabricCanvases((prevCanvases) => [...prevCanvases, ownCanva]);

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
            const obj = fabricCanvas.current.getActiveObject();
            if (obj) {
              openTabs();
              setActiveObject(obj);
            } else {
              setActiveObject(null);
            }
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
              part: editingComponent.current
                ? editingComponent.current.name
                : "bodyFMIX",
            });
            setFabricCanvases((prevCanvases) => [...prevCanvases, ownCanva]);

            ownCanva.renderAll();
            const initialTexture = new THREE.CanvasTexture(
              ownCanva.getElement()
            );
            initialTexture.repeat.y = -1;
            initialTexture.offset.y = 1;
            editingComponent.current.userData.canva = ownCanva;
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
        setTimeout(() => {
          closeEditor();
        }, 200);
        closeTabs();
        if (isDragging) {
          isDragging = false;
          isHandleSelected = false;
          selectedHandle = null;
          setEditingComponentHTML(null); // or any other reset function
        }

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
        // editingComponent.current = null;
        fabricCanvas.current.renderAll();
        isHandleSelected = false;
        selectedHandle = null;
        isImageSelected = false;
      }

      fabricCanvas.current.renderAll();
      updateTexture();

      containerRef.current.addEventListener(
        "mousedown",
        handleInteractionStart
      );
      containerRef.current.addEventListener(
        "touchstart",
        handleInteractionStart
      );

      if (editingComponent.current)
        setEditingComponentHTML(editingComponent.current.userData.name);
      else if (!editingComponent.current) setEditingComponentHTML("hoodInCOR");
    };

    const handleMove = (x, y) => {
      if (isDragging) {
        //se não estiver a orbitar e estiver a arrastar
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
                      activeObject.set({
                        width: aCoords.tl.distanceFrom(aCoords.tr),
                        originX: "center",
                        originY: "center",
                      });
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
                      activeObject.set({
                        width: aCoords.tl.distanceFrom(aCoords.tr),
                        originX: "center",
                        originY: "center",
                      });
                    }

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

    const onMouseMove = (e) => {
      if (!isDragging) return;

      const x = e.clientX;
      const y = e.clientY;
      currentMouse.x = (x / window.innerWidth) * 2 - 1;
      currentMouse.y = -(y / window.innerHeight) * 2 + 1;
      handleMove(x, y);
    };

    const onTouchMove = (e) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const onMouseUp = (e) => {
      if (isDragging) {
        isDragging = false;
        orbit.enabled = true;
        isHandleSelected = false;
        selectedHandle = null;
        // Reset any interaction specifics here
        updateTexture(); // Refresh view to finalize interaction
      }
    };

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //animate--------------------------------------------------------------------------------------------------------
    const animate = () => {
      requestAnimationFrame(animate);
      TWEEN.update(); // Atualiza todas as animações do Tween
      orbit.update(); // Ensures damping effects are recalculated each frame

      renderer.render(scene, camera);
    };
    animate();

    //listeners------------------------------------------------------------------------------------------------------
    const container = containerRef.current;

    window.addEventListener("resize", onWindowResize);
    container.addEventListener("mousedown", handleInteractionStart);
    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("touchstart", handleInteractionStart, {
      passive: true,
    });
    container.addEventListener("touchmove", onTouchMove, { passive: true });
    container.addEventListener("touchend", onMouseUp, { passive: true });

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
        container.removeEventListener("mousedown", handleInteractionStart);
        container.removeEventListener("mousemove", onMouseMove);
        container.removeEventListener("mouseup", onMouseUp);
        container.removeEventListener("touchstart", handleInteractionStart);
        container.removeEventListener("touchmove", onTouchMove);
        container.removeEventListener("touchend", onMouseUp);
      }
      fabricCanvas.current.off("object:modified", updateTexture);
      fabricCanvas.current.off("object:scaling", updateTexture);
      fabricCanvas.current.off("object:moving", updateTexture);
      fabricCanvas.current.off("object:rotating", updateTexture);
      fabricCanvas.current.off("object:added", updateTexture);
    };
  }, [fabricTexture, model]);

  // //calcular area imprimida
  const calcularEImprimirAreasOcupadas = () => {
    let precoTotal = 13.25; // Preço base de 13.25€

    fabricCanvases.forEach((canvas) => {
      const areaTotalCanvas = canvas.width * canvas.height; // área total do canvas em cm²
      canvas.getObjects().forEach((obj) => {
        const areaObjeto =
          (obj.width * obj.scaleX * obj.height * obj.scaleY) / variavelAjuste; // área ocupada do objeto em cm²
        const percentagemAreaOcupada =
          areaObjeto / areaTotalCanvas / variavelAjuste; // percentagem da área ocupada pelo objeto no canvas
        const blocosDezCm2Ocupados = Math.ceil(
          (areaTotalCanvas * percentagemAreaOcupada) / 10
        ); // blocos de 10 cm² ocupados pelo objeto
        const custoAdicional = blocosDezCm2Ocupados * 1.6; // custo adicional baseado em 1.60€ por bloco de 10 cm²
        // console.log("area do canvas", areaTotalCanvas);
        // console.log("area do obj", areaObjeto);
        // console.log("% ocupada obj - canvas", percentagemAreaOcupada);
        // console.log("..........");
        // console.log("blocos", blocosDezCm2Ocupados);
        // console.log("custoAdd", custoAdicional);
        precoTotal += custoAdicional; // soma o custo adicional ao preço total
      });
    });

    // console.log("fabricCanvases:", fabricCanvases);
    setPrecoFinal(precoTotal.toFixed(2)); // atualiza o estado com o preço final
    animatePrice(0, precoTotal, 1000); // anima a mudança de preço
  };

  const animatePrice = (start, end, duration) => {
    let startTime = null;
    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setPrecoAnimado((progress * (end - start) + start).toFixed(2));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setPrecoAnimado(end.toFixed(2)); // Certifica-se de que o preço final é exatamente o que deve ser
      }
    };
    window.requestAnimationFrame(step);
  };

  const onConcluirClicked = () => {
    const precoFinal = calcularEImprimirAreasOcupadas();
    document.getElementById("precoFinal").textContent = `Preço: €${precoFinal}`;
  };

  useEffect(() => {
    const area = 300;
    // A função que realiza o cálculo da área ocupada
    calcularEImprimirAreasOcupadas();
  }, [fabricCanvases, preview, activeObject]);

  //funcoes de abrir e fechar a janela de edicao-------------------------------------------------------------------

  const editZoneRef = useRef(null);

  const openTabs = () => {
    if (editZoneRef.current) {
      editZoneRef.current.style.right = "50px";
      editZoneRef.current.style.opacity = 1;
      editZoneRef.current.style.transition = "all 0.32s ease-in-out";
      editZoneRef.current.style.scale = 1;
      setEditorOpen(true);
    }
  };

  // Função para fechar a janela de edição
  const closeEditor = () => {
    if (editZoneRef.current) {
      editZoneRef.current.style.right = "-300px";
      editZoneRef.current.style.opacity = 0;
      editZoneRef.current.style.transition = "all 0.32s ease-in-out";
      editZoneRef.current.style.scale = 0;
      setEditorOpen(false);
    }
  };

  const closeTabs = () => {
    setTextEditor(false);
    setColorEditor(false);
    setImageEditor(false);
  };

  const colorEditorTab = () => {
    setColorEditor(!colorEditor);
  };

  const imageEditorTab = () => {
    setImageEditor(!imageEditor);
  };

  const textEditorTab = () => {
    if (textEditor) {
      setTextEditor(false);
    } else {
      setTextEditor(true);
    }
  };
  // const [cornerColor, setCornerColor] = useState("rgba(0, 0, 0, 0.4)");
  // useEffect(() => {
  //   if (fabricCanvas.current.backgroundColor == "#000000") {
  //     setCornerColor("rgba(255, 255, 255, 0.4)");
  //   }
  // }, [fabricCanvas.current]);

  function addTextbox(text) {
    const canvas = fabricCanvas.current;
    if (canvas) {
      // Create a new textbox
      const textbox = new fabric.Textbox(text, {
        left: canvas.width / 2, // Center the textbox horizontally
        top: canvas.height / 2,
        originX: "center",
        originY: "center",
        width: 155, // Adjust as needed
        height: 200,
        fontSize: fontSize,
        fontFamily: fontFamily,
        fill: fillColor,
        textAlign: textAlign, // Adjust as needed
        editable: false, // Set to true to allow editing
        borderColor: "transparent",
        cornerColor:
          fabricCanvas.current.backgroundColor == "#000000"
            ? "rgba(255, 255, 255, 0.4)"
            : "rgba(0, 0, 0, 0.4)",
        padding: 5,
        transparentCorners: false,
        // cornerSize: (scale * 0.65 * fabricImage.scaleX) / 10,
        cornerSize: (155 + 200) / 20,
        cornerStyle: "circle",
        shadow: "rgba(0,0,0,0.3) 0px 0px 10px",
      });
      for (const font of fontList) {
        textbox.set("fontFamily", font);
      }
      textbox.set("fontFamily", "Arial");

      delete textbox.controls.tr;
      delete textbox.controls.tl;
      delete textbox.controls.br;
      delete textbox.controls.bl;
      delete textbox.controls.mt;
      delete textbox.controls.mb;

      // Add the textbox to the canvas
      canvas.add(textbox);
      canvas.setActiveObject(textbox);
      setActiveObject(textbox); // Update the React state to the newly added textbox
      canvas.renderAll();
      updateTexture();
    }
  }

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
    if (activeObject && activeObject.type == "image") {
      const imageSrc = activeObject.getSrc();
      setImageSrc(imageSrc); // Seta a URL da fonte da imagem no estado
      setTextEditor(false);
      setImageEditor(true);
    } else if (activeObject && activeObject.type == "textbox") {
      setImageEditor(false);
      setTextEditor(true);
    }

    if (fabricCanvas.current) {
      const canvas = fabricCanvas.current;
      const activeObject = canvas.getActiveObject();
      setActiveObject(activeObject);
      console.log("Active Object do momento: ", activeObject);
      if (activeObject == null) {
        closeTabs();
      }
    }
  }, [activeObject]);

  // Função para retroceder ao nome anterior
  const retrocederZona = () => {
    setCurrentIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : 0));
  };

  // Função para avançar ao próximo nome
  const avancarZona = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex < objectNames.length - 1 ? prevIndex + 1 : prevIndex
    );
  };

  // useEffect(() => {
  //   if (editingComponent.current) {
  //     // lógica que depende de editingComponent.current
  //     setEditingComponentHTML(editingComponent.current.userData.name);
  //   }
  // }, [editingComponent.current]);

  const simulateCenterClick = () => {
    if (!containerRef.current) return;

    // Get the bounding rectangle of the container
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Create a new mouse event
    const event = new MouseEvent("mousedown", {
      clientX: centerX,
      clientY: centerY,
      view: window,
      bubbles: true,
      cancelable: true,
    });

    // Dispatch the event on the container
    containerRef.current.dispatchEvent(event);
  };
  const backgroundMagic = useRef(null);
  const modelosZone = useRef(null);
  const modelos = useRef(null);
  const titleModels = useRef(null);

  const magicLoading = () => {
    if (backgroundMagic.current) {
      backgroundMagic.current.style.backgroundColor = "transparent";
      backgroundMagic.current.style.backdropFilter = "blur(0px)";
      backgroundMagic.current.style.transition = "all 1.6s ease-in-out";
    }

    if (modelos) {
      modelos.current.style.gap = "1000px";
      modelos.current.style.transition = "all 0.4s ease-in-out";
      modelos.current.style.opacity = "0";
    }

    if (titleModels) {
      titleModels.current.style.marginTop = "-100%";
      titleModels.current.style.opacity = "0";
      titleModels.current.style.transition = "all 1.2s ease-in-out";
    }
  };

  const [allCanvasData, setAllCanvasData] = useState([]);

  const sendData = async () => {
    console.log(allCanvasData);
    const mergedData = { data: allCanvasData, clientData, docId: docId };

    try {
      const response = await fetch(
        "https://allkits-server.onrender.com/sendEmail",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(mergedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to send data");
      }

      const responseData = await response.text();
    } catch (error) {
      console.error("Error:", error);
    }
  };
  console.log(fabricCanvases);
  const testP = async () => {
    const allCanvasData = [];

    for (const canvas of fabricCanvases) {
      const objects = canvas.getObjects();
      const canvasData = {
        width: canvas.width,
        height: canvas.height,
        backgroundColor: canvas.backgroundColor,
        texts: [],
        images: [],
        part: canvas.part,
      };

      for (const obj of objects) {
        if (obj.type === "textbox") {
          console.log(obj);
          canvasData.texts.push({
            text: obj.text,
            fontFamily: obj.fontFamily,
            fontSize: obj.fontSize,
            color: obj.fill,
            top: obj.top,
            left: obj.left,
            width: obj.width,
            height: obj.height,
            textLines: obj.textLines,
          });
        } else if (
          obj.type === "image" &&
          obj._element &&
          obj._element.src.startsWith("data:image")
        ) {
          const baseImage = obj._element.src;

          const imageData = obj._element.src.split(";base64,").pop();
          const imageName = `image_${Date.now()}.png`;
          const imagePath = `images/${imageName}`;
          const imageRef = ref(storage, imagePath);

          try {
            await uploadString(imageRef, imageData, "base64");

            const downloadURL = await getDownloadURL(imageRef);

            canvasData.images.push({
              url: downloadURL,
              base64: baseImage,
              scaleX: obj.scaleX,
              scaleY: obj.scaleY,
              top: obj.top,
              left: obj.left,
              width: obj.width,
              height: obj.height,
              angle: obj.angle ? obj.angle : 0,
              flipX: obj.flipX,
            });
          } catch (error) {
            console.error("Error uploading image:", error);
          }
        }
      }

      allCanvasData.push(canvasData);
    }
    setAllCanvasData(allCanvasData);
    return allCanvasData;
  };

  const handleChange = (e) => {
    setClientData({
      ...clientData,
      [e.target.name]: e.target.value,
    });
  };

  const nextStep =
    clientData.name != "" &&
    clientData.email != "" &&
    clientData.phone != "" &&
    docId != "";

  const [success, setSuccess] = useState(false);

  return (
    <>
      {isLoading && (
        <div className={styles.loadingContainer}>
          <p>A carregar...</p>
        </div>
      )}
      <div ref={containerRef}> </div>

      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 0,
        }}
      >
        <div
          style={{ position: "absolute", top: "0", left: "0", display: "none" }}
        >
          <canvas
            id="fabric-canvas"
            style={{
              border: "1px solid #00bfff",
              marginRight: "20px",
              position: "absolute",
              top: "0",
              left: "0",
            }}
          />
        </div>
      </div>

      {editingComponent.current && (
        <>
          <div ref={editZoneRef} className={styles.editZone}>
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
                    {getPartName(editingComponent.current.name)}
                    {/* {editingComponent.current.name} */}
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
                        {editingComponentHTML.includes("IMP") && (
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
                        )}
                      </>
                    )}
                    {editingComponentHTML.includes("NOT") && (
                      <p
                        style={{ marginTop: 75, textAlign: "center" }}
                        className={styles.infoText}
                      >
                        Não é possível personalizar esta área
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {!preview && (
            <div className={styles.editZoneTlm}>
              <div className={styles.mainBtns}>
                <button onClick={imageEditorTab}>
                  <NextImage src={galeryIcon} width={20} height={20} />
                </button>
                <button onClick={textEditorTab}>
                  <NextImage src={textIcon} width={20} height={20} />
                </button>
                <button onClick={colorEditorTab}>
                  <NextImage src={colorIcon} width={20} height={20} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {success == false && (
        <>
          <div className={styles.priceBtnMain}>
            {preview && (
              <button
                className={styles.priceBtn}
                style={{
                  opacity: nextStep ? "1" : "0.5",
                  pointerEvents: nextStep ? "auto" : "none",
                }}
                onClick={() => {
                  nextStep && (setSuccess(true), sendData());
                }}
              >
                Continuar
              </button>
            )}
          </div>
          <div className={styles.exportBtnNot}>
            <button
              onClick={() => {
                getActiveScene();
                calcularEImprimirAreasOcupadas();
                setPreview(!preview);
                setTimeout(() => {
                  closeEditor();
                }, 200);
                closeTabs();
              }}
              style={{
                right: preview
                  ? window.innerWidth < 750
                    ? 110
                    : 165
                  : window.innerWidth < 750
                  ? 25
                  : 50,
                color: preview ? "#fff" : "#000",
                backgroundColor: preview ? "transparent" : "#fff",
              }}
            >
              {preview ? (
                window.innerWidth < 450 ? (
                  <p
                    style={{
                      marginTop: 0,
                      // backgroundColor: "rgba(0, 0, 0 ,0.3)",
                      // padding: 10,
                      // borderRadius: 100,
                      // paddingLeft: 15,
                      // paddingRight: 15,
                    }}
                  >
                    &#8592;
                  </p>
                ) : (
                  "Voltar à Personalização"
                )
              ) : (
                "Concluído"
              )}
            </button>
          </div>
        </>
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
        <TextEditor
          fabricCanvas={fabricCanvas}
          updateTexture={updateTexture}
          closeTabs={closeTabs}
          addTextbox={addTextbox}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
          activeObject={activeObject}
          fontSize={fontSize}
          setFontSize={setFontSize}
          textAlign={textAlign}
          setTextAlign={setTextAlign}
          fillColor={fillColor}
          setFillColor={setFillColor}
          maxTextSize={maxTextSize}
          setMaxTextSize={setMaxTextSize}
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
        <div ref={backgroundMagic} className={styles.modelsZone}>
          <div ref={modelosZone} className={styles.modelsList}>
            <h1
              ref={titleModels}
              className={styles.title}
              style={{
                textAlign: "center",
                marginBottom: 25,
                fontSize: 15,
                color: "#fff",
              }}
            >
              ESCOLHE O TEU MODELO
            </h1>
            <div ref={modelos} className={styles.modelosBtns}>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  magicLoading();
                  setTimeout(() => {
                    simulateCenterClick();
                    setEscolheBtn(true);
                  }, 1610);
                  setModel("5");

                  setTutorial(true);
                }}
              >
                <NextImage
                  src={model5}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
              <button
                className={styles.modeloBtn}
                onClick={() => {
                  setModel("3");
                  magicLoading();
                  setTimeout(() => {
                    simulateCenterClick();
                    setEscolheBtn(true);
                  }, 1610);
                  setTutorial(true);
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
                  setModel("1");
                  magicLoading();
                  setTimeout(() => {
                    simulateCenterClick();
                    setEscolheBtn(true);
                  }, 1610);
                  setTutorial(true);
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
                  setModel("4");
                  magicLoading();
                  setTimeout(() => {
                    simulateCenterClick();
                    setEscolheBtn(true);
                  }, 1610);
                  setTutorial(true);
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
                  setModel("2");
                  magicLoading();
                  setTimeout(() => {
                    simulateCenterClick();
                    setEscolheBtn(true);
                  }, 1610);
                  setTutorial(true);
                }}
              >
                <NextImage
                  src={model2}
                  className={styles.modelosImgs}
                  width={150}
                  height={150}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {preview === true && (
        <div className={styles.checkoutZone}>
          {success === false ? (
            <>
              <div className={styles.modelsList}>
                <p
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    fontSize: 15,
                    color: "#fff",
                  }}
                >
                  PREÇO TOTAL ESTIMADO (POR UN.)
                </p>

                <h1
                  id="precoFinal"
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    marginBottom: 15,
                    fontSize: 100,
                    color: "#fff",
                    fontWeight: 800,
                    letterSpacing: -3.2,
                    marginTop: -15,
                  }}
                >
                  €{precoAnimado}
                </h1>
              </div>
              <div className={styles.inputsFormMain}>
                <h1
                  className={styles.title}
                  style={{
                    textAlign: "center",
                    fontSize: 15,
                    color: "#8c8c8c",
                  }}
                >
                  INFORMAÇÕES DE ENVIO
                </h1>
                <div className={styles.inputsForm}>
                  <input
                    className={styles.inputForm}
                    placeholder="Nome"
                    name="name"
                    value={clientData.name}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.inputForm}
                    placeholder="Email"
                    name="email"
                    value={clientData.email}
                    onChange={handleChange}
                  />
                  <input
                    className={styles.inputForm}
                    placeholder="Telemóvel"
                    name="phone"
                    value={clientData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.successOrderMain}>
              <h1 className={styles.successOrderText}>
                Personalização submetida com sucesso
              </h1>
              <p
                style={{ marginTop: -10, marginBottom: 35 }}
                className={styles.successOrderSubText}
              >
                Iremos entrar em contacto consigo muito brevemente
              </p>
              <div className={styles.finalBtns}>
                {docId != "" ? (
                  <button
                    className={styles.btnPreviewLink}
                    onClick={() => router.push(`/visualize/${docId}`)}
                    // target={"_blank"}
                  >
                    <NextImage src={shareIcon} width={20} height={20} />
                    <p>Abrir link de pré-visualização</p>
                  </button>
                ) : (
                  <button className={styles.btnBuildLink}>
                    <NextImage src={buildingIcon} width={20} height={20} />
                    <p>A criar o teu link de pré-visualização</p>
                  </button>
                )}
                <Link
                  className={styles.goToAllkitsBtn}
                  style={{ textDecoration: "none" }}
                  href={"https://www.allkits.pt"}
                >
                  Voltar à Allkits
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default ThreeDViewer;
