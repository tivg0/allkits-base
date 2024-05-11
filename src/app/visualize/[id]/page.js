"use client";
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import NextImage from "next/image";
import styles from "../../../styles/page.module.css";
import logoStep from "../../../../public/logoStepTransparent.png";
import copyIcon from "../../../../public/copy.png";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { loadGLBModel } from "../../utils";
import { fetchScene } from "./utils";

const FabricCanvas = ({ params }) => {
  const canvasRefs = useRef({});
  const containerRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [objectNames, setObjectNames] = useState([]);
  let orbit;

  const mesh = useRef(null);

  useEffect(() => {
    const initializeCanvas = async () => {
      const sceneDataArray = await fetchScene(params);

      if (!sceneDataArray || !Array.isArray(sceneDataArray)) {
        return;
      }
      sceneDataArray.forEach((sceneData, index) => {
        const { width, height, backgroundColor, texts, images, part } =
          sceneData;

        const canvas = new fabric.Canvas(`${part}`, {
          width,
          height,
        });

        canvas.setBackgroundColor(
          backgroundColor,
          canvas.renderAll.bind(canvas)
        );

        canvas.backgroundColor = backgroundColor;

        if (texts && texts.length > 0) {
          texts.forEach(({ text, fontFamily, color, top, left, fontSize }) => {
            console.log(`Adding text '${text}' to canvas`);
            const textObject = new fabric.Text(text, {
              fontFamily,
              fontSize,
              fill: color,
              left,
              top,
              originX: "center",
              originY: "center",
            });
            canvas.add(textObject);
          });
        }

        if (images && images.length > 0) {
          images.forEach(
            ({ url, top, left, width, height, scaleX, scaleY, angle }) => {
              console.log(`Loading image from URL: ${url}`);
              fabric.Image.fromURL(
                url,
                (img) => {
                  console.log(`Image loaded successfully: ${url}`);
                  img.set({
                    left,
                    top,
                    scaleX,
                    scaleY,
                    width,
                    height,
                    angle,
                    originX: "center",
                    originY: "center",
                  });

                  canvas.add(img);
                },
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

      setTimeout(() => {
        scene.children.forEach((child) => {
          if (child instanceof THREE.Group) {
            child.children.forEach((meshh) => {
              if (Object.keys(canvasRefs.current).includes(meshh.name)) {
                mesh.current = meshh;
                let fabricCanvas = new fabric.Canvas();
                fabricCanvas.setDimensions({
                  width: 512,
                  height: 512,
                  backgroundColor: "",
                });
                fabricCanvas.add(
                  new fabric.Text("Hello, Fabric!", { left: 50, top: 50 })
                );

                try {
                  const newTexture = new THREE.CanvasTexture(
                    canvasRefs.current[meshh.name].lowerCanvasEl
                  );
                  newTexture.flipY = false;
                  mesh.current.material.map = newTexture;
                  mesh.current.material.map.needsUpdate = true;
                } catch (error) {
                  console.error("Error creating texture:", error);
                }
              }
            });
          }
        });

        animate();
      }, 500);
    };

    initializeCanvas();

    const scene = new THREE.Scene();

    loadGLBModel("/hoodieTest.glb", scene, setIsLoading, setObjectNames);

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
    renderer.setClearColor(0xf4f4f4);
    renderer.setPixelRatio(2);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);
    const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xf4f4f4, 1.5);
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1.5);
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
    orbit.maxPolarAngle = Math.PI / 1.61;
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: null,
    };
    orbit.enabled = true;
    orbit.minDistance = 16.1;
    orbit.maxDistance = 35;

    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
      orbit.update();
    };

    return () => {};
  }, [params]);

  return (
    <>
      <div ref={containerRef}></div>
      <button className={styles.copiaTextMain}>
        <NextImage src={copyIcon} width={17} height={17} />
        <p className={styles.copiaText} style={{ zIndex: "1000" }}>
          Copia o link para poderes partilhar a tua obra!
        </p>
      </button>
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
