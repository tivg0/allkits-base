"use client";
import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useParams } from "next/navigation";

function Page() {
  const params = useParams();
  const containerRef = useRef(null);
  const [sceneData, setSceneData] = useState(null);
  const [loading, setLoading] = useState(true); // Loading state

  const fetchScene = async () => {
    try {
      const response = await fetch("http://localhost:3030/getScene", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: params.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch scene");
      }

      const jsonData = await response.json(); // Parse response as JSON
      return jsonData;
    } catch (error) {
      console.error("Error fetching scene:", error);
      // Handle error state if needed
    }
  };

  useEffect(() => {
    const loadScene = async () => {
      try {
        const data = await fetchScene();
        setSceneData(data);
        setLoading(false); // Set loading to false when scene is fetched
      } catch (error) {
        console.error("Error loading scene:", error);
      }
    };

    loadScene();
  }, []);

  useEffect(() => {
    if (sceneData) {
      try {
        const scene = new THREE.Scene();
        const loader = new THREE.ObjectLoader();
        const loadedScene = loader.parse(sceneData);
        scene.add(loadedScene);

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

        containerRef.current.appendChild(renderer.domElement);

        // Animation loop
        const animate = () => {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        };
        animate();

        return () => {
          renderer.domElement.remove();
          renderer.dispose();
        };
      } catch (error) {
        console.error("Error parsing JSON or loading scene:", error);
      }
    }
  }, [sceneData]);

  return <div ref={containerRef}>{loading && <p>Loading...</p>}</div>;
}

export default Page;
