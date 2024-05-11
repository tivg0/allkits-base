"use client";
import React, { useEffect, useRef, useState } from "react";
import { fabric } from "fabric";
import * as THREE from "three";
import { loadGLBModel } from "../../utils";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
    console.log(jsonData);
    return jsonData;
  } catch (error) {
    console.error("Error fetching scene:", error);
    // Handle error state if needed
  }
};

const FabricCanvas = ({ params }) => {
  const canvasRefs = useRef([]);
  const [isLoading, setIsLoading] = useState(false);
  const [objectNames, setObjectNames] = useState([]);
  let orbit;
  let containerRef = useRef(null);

  useEffect(() => {
    const initializeCanvas = async () => {
      const sceneDataArray = await fetchScene(params);

      if (!sceneDataArray || !Array.isArray(sceneDataArray)) {
        // Handle if scene data is not available or not an array
        return;
      }

      sceneDataArray.forEach((sceneData, index) => {
        if (!canvasRefs.current[index]) {
          canvasRefs.current[index] = document.createElement("canvas");
          document.body.appendChild(canvasRefs.current[index]);
        }

        const { width, height, backgroundColor, texts, images } = sceneData;

        const canvas = new fabric.Canvas(canvasRefs.current[index], {
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
              originX: "center",
              originY: "center",
            });
            canvas.add(textObject);
          });
        }

        // Add image objects to canvas if images array is not empty
        if (images && images.length > 0) {
          console.log(images[0].url);
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
                    originX: "center",
                    originY: "center",
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
      });
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

    if (containerRef.current) {
      containerRef.current.appendChild(renderer.domElement);
    }

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
    animate();

    return () => {
      renderer.domElement.remove();
      renderer.dispose();
      orbit.dispose();
    };
  }, [params]);

  return (
    <>
      {/*  <div ref={containerRef}></div> */}
      {canvasRefs.current.map((canvasRef, index) => (
        <div style={{ position: "absolute", top: "0", left: "0" }} key={index}>
          <canvas
            style={{
              border: "1px solid #00bfff",
              marginRight: "20px",
              position: "absolute",
              top: "0",
              left: "0",
            }}
            ref={(el) => (canvasRefs.current[index] = el)}
          />
        </div>
      ))}
    </>
  );
};

export default FabricCanvas;
