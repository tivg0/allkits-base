'use client'
import React, { useEffect, useRef } from 'react'
import { string } from '../string';

import * as THREE from 'three';

function page() {

  let containerRef = useRef(null);

  useEffect(() => {

    const scene = new THREE.Scene();

    try {
      const parsedJson = JSON.parse(string);
      const loader = new THREE.ObjectLoader();
      const loadedScene = loader.parse(parsedJson);
      scene.add(loadedScene);
  } catch (error) {
      console.error("Error parsing JSON or loading scene:", error);
  }

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

  //animate--------------------------------------------------------------------------------------------------------
  const animate = () => {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  };
  animate();

  return () => {
    renderer.domElement.remove();
    renderer.dispose();
  }

  },[])

  return (
    <div ref={containerRef}></div>
  )
}

export default page