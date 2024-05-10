"use client";
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import NextImage from "next/image";
import styles from "../../../styles/page.module.css";
import logoStep from "../../../../public/logoStepTransparent.png";
import copyIcon from "../../../../public/copy.png";
import * as THREE from 'three';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadGLBModel } from "../../utils";

const fetchScene = async (params) => {
  try {
    const response = await fetch(
      "https://allkits-server.onrender.com/getScene",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: params.id,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to fetch scene");
    }

    const jsonData = await response.json(); // Parse response as JSON
    //console.log(jsonData);
    return jsonData;
  } catch (error) {
    console.error("Error fetching scene:", error);
    // Handle error state if needed
  }
};

const FabricCanvas = ({ params }) => {
  const canvasRefs = useRef({});
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [objectNames, setObjectNames] = useState([])
  let orbit;
  let hasRan = false;

  useEffect(() => {
    const initializeCanvas = async () => {
      const sceneDataArray = await fetchScene(params);

      if (!sceneDataArray || !Array.isArray(sceneDataArray)) {
        // Handle if scene data is not available or not an array
        return;
      }

      sceneDataArray.forEach((sceneData, index) => {
        /*if (!canvasRefs.current[index]) {
          canvasRefs.current[index] = document.createElement("canvas");
          document.body.appendChild(canvasRefs.current[index]);
        }*/

        const { width, height, backgroundColor, texts, images, part } = sceneData;

        const canvas = new fabric.Canvas(/*canvasRefs.current[index]*/`${part}`, {
          width,
          height,
        });

        canvas.setBackgroundColor(
          backgroundColor,
          canvas.renderAll.bind(canvas)
        );

        // Add text objects to canvas if texts array is not empty
        if (texts && texts.length > 0) {
          texts.forEach(({ text, fontFamily, color, top, left, fontSize }) => {
            const textObject = new fabric.Text(text, {
              fontFamily,
              fontSize,
              fill: color,
              left,
              top,
            });
            canvas.add(textObject);
          });
        }

        // Add image objects to canvas if images array is not empty
        if (images && images.length > 0) {
          //console.log(images[0].url);
          images.forEach(
            ({ url, top, left, width, height, scaleX, scaleY, angle }) => {
              fabric.Image.fromURL(
                url,
                (img) => {
                  img.set({
                    left,
                    top,
                    scaleX,
                    scaleY,
                    width,
                    height,
                    angle,
                  });
                  canvas.add(img);
                },
                // Error callback
                (error) => {
                  console.error("Error loading image:", error);
                }
              );
            }
          );
        }
        canvas.renderAll();

        canvasRefs.current[`${part}`] = canvas;
        
      });
      console.log('done');
    }

    initializeCanvas();

    const scene = new THREE.Scene();

    loadGLBModel('/hoodieTest.glb', scene, setIsLoading, setObjectNames);

    /*Object.entries(canvasRefs.current).map(([key, value]) => {
      console.log(value);
      const texture = new THREE.CanvasTexture(value.getElement());
      texture.repeat.y = -1;
      texture.offset.y = 1;


    })*/

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
    renderer.setClearColor(0xf4f4f4); // background color of the scene
    renderer.setPixelRatio(2); // increase pixel density

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

    containerRef.current.appendChild(renderer.domElement);

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
    orbit.enabled = true;
    orbit.minDistance = 16.1;
    orbit.maxDistance = 35;


    //if (!hasRan) {
      setTimeout(() => {
        console.log('1')
        scene.children.forEach(child => {
          if (child instanceof THREE.Group) {
            child.children.forEach(mesh => {
              /*Object.entries(canvasRefs.current).map(([key, value]) => {
              
              if (key == mesh.name) {
  
              }
              })*/

              
              console.log(Object.keys(canvasRefs.current))

              if (Object.keys(canvasRefs.current).includes(mesh.name)) {
  
                //console.log(mesh)
                let canvas;
                canvas = canvasRefs.current[mesh.name];
                canvas.renderAll();
                //console.log(canvas)
  
                if (mesh.material.map) {
                  mesh.material.map.dispose(); // Dispose old texture
                }
  
                let newTexture = new THREE.CanvasTexture(canvas.getElement());
                newTexture.repeat.y = - 1;
                newTexture.offset.y = 1;
                newTexture.needsUpdate = true;
                console.log(newTexture);
  
        
                mesh.material.map = newTexture;
                //mesh.material.color = new THREE.Color(0x000000)
                mesh.material.map.needsUpdate = true;
                
                //console.log(mesh.material.map);
                //console.log(canvas);
              }
              
            })
          }
        })
      }, 500);
      console.log('run');
      hasRan=true;
    //}

            // Animation loop
            const animate = () => {
              requestAnimationFrame(animate);
              renderer.render(scene, camera);
              orbit.update();
            };
    animate();
  
    return () => {
      // Cleanup code here if needed
    };
  }, [params]);

  // Render canvases
  return (
    <>
    <div ref={containerRef}></div>
      <button className={styles.copiaTextMain}>
        <NextImage src={copyIcon} width={17} height={17} />
        <p className={styles.copiaText} style={{zIndex: '1000'}}>
          Copia o link para poderes partilhar a tua obra!
        </p>
      </button>
      {/*canvasRefs.current.map((canvasRef, index) => (
        <canvas key={index} ref={(el) => (canvasRefs.current[index] = el)} />
      ))*/}
      <div className={styles.poweredTextMain}>
        <p className={styles.poweredText}>Powered by</p>
        <NextImage
          className={styles.poweredLogo}
          src={logoStep}
          width={105}
          height={45}
        />
      </div>
    </>
  );
};

export default FabricCanvas;
