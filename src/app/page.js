'use client'
import * as THREE from 'three';
import { fabric } from 'fabric';
import { useEffect, useRef, useState } from 'react';
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getIntersections, loadGLBModel, selectImage, copyCanvas, getIntersection, calculateAngle, toHexString } from './utils';
import { color } from 'three/examples/jsm/nodes/shadernode/ShaderNode';

export default function Home () {

  //qunado da select image fica tudo azul do componente preciso fazer um if ou tirar o azul por enquanto

  //zonas que deixa de dar para pegar na imagem de novo tem a ver com a area de intersecao e preciso fazer alguma diretamente prop. entre a tolerancia
  
  //meio lento a tocar em imagens ate aparecer os quadrados de scale

  //qunado se mete a imagem pequena deixa de se ter acesso

  //limitar scales
  //tolerance proporcional a scale DONE
  //raycaster layers


  //three variables-----------------------------------------------------------------------------------------------
  let editingComponent = useRef(null);
  const containerRef = useRef();
  const raycaster = new THREE.Raycaster();
  let initialMouse = new THREE.Vector2();
  let currentMouse = new THREE.Vector2();
  let initialUVCursor = new THREE.Vector2();
  let currentUVCursor = new THREE.Vector2();
  let initialUVRotationCursor = new THREE.Vector2();
  let orbit;
  const [editingComponentHTML, setEditingComponentHTML] = useState(null)

  //fabric variables----------------------------------------------------------------------------------------------
  let fabricCanvas = useRef(null);
  const [fabricTexture, setFabricTexture] = useState(null);
  let isDragging = false;
  let selectedHandle;
  let isHandleSelected = false;
  let isImageSelected = false;
  let rotated = 0;

  //functions-----------------------------------------------------------------------------------------------------
  const handleImage = (e) => {
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
        const aspectRatio = fabricImage.width / fabricImage.height;
        fabricImage.set({
          selectable: true,
          left: fabricCanvas.current.width / 2,
          top: fabricCanvas.current.height / 2,
          originX: "center",
          originY: "center",
          scaleX: scale * 0.65,
          scaleY: scale * 0.65,
          cornerSize: (scale * 0.65 * fabricImage.scaleX) / 10,
          cornerStyle: "circle",
          transparentCorners: false,
          cornerColor: "rgb(255,0,0)"
        });
        fabricCanvas.current.add(fabricImage);
        fabricCanvas.current.renderAll();
        updateTexture();
      }
    }
    reader.readAsDataURL(file);
  }

  function setBGColor (string) {
    if (string.length == 6) {
      let prefix = '#';
      fabricCanvas.current.backgroundColor = prefix + string;
      fabricCanvas.current.renderAll();
      updateTexture();
    } 
  }

  const updateTexture = () => {
    if (fabricTexture) fabricTexture.needsUpdate = true;
    
  }

  //load fabric canvas--------------------------------------------------------------------------------------------
  useEffect(() => {

    fabricCanvas.current = new fabric.Canvas('fabric-canvas', {
      width: 1024,
      height: 1024,
    });

    const texture = new THREE.CanvasTexture(fabricCanvas.current.getElement());
    texture.repeat.y = -1;
    texture.offset.y = 1;
    setFabricTexture(texture);

  return () => fabricCanvas.current.dispose();

  },[])

  useEffect(() => {

    if (!fabricTexture) return;

    //three set up-------------------------------------------------------------------------------------------------
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf7f7f7);
    const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 20;
    const renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    const light1 = new THREE.RectAreaLight(0xf4eeff,10, 10, 10);
    light1.rotateX(-Math.PI/6)
    light1.position.z = 8;
    light1.position.y = 10;
    scene.add(light1);
    const light2 = new THREE.RectAreaLight(0xeeeeff,3, 10, 10);
    light2.rotateX(Math.PI/2);
    light2.rotateY(Math.PI/6);
    light2.position.z = -5;
    light2.position.y = -8;
    light2.position.x = 4;
    scene.add(light2);
    const light3 = new THREE.RectAreaLight(0xffeeee,10, 10, 10);
    light3.rotateX(-Math.PI/3);
    light3.rotateY(-Math.PI/6);
    light3.position.z = -8;
    light3.position.y = 15;
    light3.position.x = -6;
    scene.add(light3);
    const light4 = new THREE.RectAreaLight(0xdde2df,2, 10, 10);
    light4.rotateX(Math.PI/3);
    light4.rotateY(-Math.PI/6);
    light4.position.z = 0;
    light4.position.y = -4;
    light4.position.x = -6;
    scene.add(light4);

    loadGLBModel('/hoodieTest.glb', scene);

    orbit = new OrbitControls(camera, renderer.domElement);
    orbit.target.set(0, 0, 0);
    orbit.enableDamping = true;
    orbit.dampingFactor = 0.3;
    orbit.mouseButtons = {
      LEFT: THREE.MOUSE.ROTATE,
      MIDDLE: THREE.MOUSE.DOLLY,
      RIGHT: THREE.MOUSE.PAN,
    };
    orbit.maxPolarAngle = Math.PI / 1.61;
    orbit.enabled = true;
    //---------------------------------------------------------------------------------------------------------------

    //functions------------------------------------------------------------------------------------------------------
    const onMouseDown = (e) => {
      initialMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      initialMouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
      let intersections = getIntersections(raycaster, camera, scene, initialMouse);

      //caso existam interseções
      if (intersections.length > 0) {
        orbit.enabled = false;
        isDragging = true;

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
            initialUVCursor.x = intersections[0].uv.x * fabricCanvas.current.width;
            initialUVCursor.y = intersections[0].uv.y * fabricCanvas.current.height;
            initialUVRotationCursor.x = initialUVCursor.x;
            initialUVRotationCursor.y = initialUVCursor.y;
            editingComponent.current.material.map = fabricTexture;
            isImageSelected = selectImage(initialUVCursor, fabricCanvas, isImageSelected, rotated, selectedHandle, isHandleSelected);
            let obj = fabricCanvas.current.getActiveObject();

            if (obj) {
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
                };
              };
            };

          } else {
            //o editing component é atualizado se não for igual

            fabricCanvas.current.renderAll();
            copyCanvas(fabricCanvas.current, editingComponent.current.userData.canva);
            editingComponent.current.userData.canva.renderAll();
            const texture = new THREE.CanvasTexture(editingComponent.current.userData.canva.getElement());
            texture.repeat.y = -1;
            texture.offset.y = 1;
            editingComponent.current.material.map = texture;

            editingComponent.current = intersections[0].object;

            /*if (!editingComponent.current.userData.canva) {

              let ownCanva = new fabric.Canvas('temp', {
                width: 1024,
                height: 1024,
                backgroundColor: toHexString(editingComponent.current.material.color)
              })
              ownCanva.renderAll();

              editingComponent.current.userData.canva = ownCanva;
            }*/

            fabricCanvas.clear();
            if (editingComponent.current.userData.canva) copyCanvas(editingComponent.current.userData.canva, fabricCanvas.current);

            isImageSelected = selectImage(initialUVCursor, fabricCanvas, isImageSelected, rotated, selectedHandle, isHandleSelected);
            editingComponent.current.material.map = fabricTexture;
            fabricCanvas.current.renderAll();
            updateTexture();
            
            initialUVCursor.x = intersections[0].uv.x * fabricCanvas.current.width;
            initialUVCursor.y = intersections[0].uv.y * fabricCanvas.current.height;
          }

        //não existe nenhum editing component ativo
        } else {
          editingComponent.current = intersections[0].object;
          //console.log(editingComponent.current.name)
          if (!editingComponent.current.userData.canva) {
            //console.log('crating canva');
            let ownCanva = new fabric.Canvas('temp', {
              width: 1024,
              height: 1024,
              backgroundColor: '#ffff00'//toHexString(intersections[0].object.material.color)
            })
            ownCanva.renderAll();
            const initialTexture = new THREE.CanvasTexture(ownCanva.getElement());
            initialTexture.repeat.y = -1;
            initialTexture.offset.y = 1;
            editingComponent.current.userData.canva = ownCanva;
            console.log(editingComponent.current)
          }

          initialUVCursor.x = intersections[0].uv.x * fabricCanvas.current.width;
          initialUVCursor.y = intersections[0].uv.y * fabricCanvas.current.height;
          copyCanvas(editingComponent.current.userData.canva, fabricCanvas.current);
          isImageSelected = selectImage(initialUVCursor, fabricCanvas, isImageSelected, rotated, selectedHandle, isHandleSelected);
          fabricCanvas.current.renderAll();
          updateTexture();
          //editingComponent.current.material.color = fabricTexture;
          console.log(fabricTexture);
          editingComponent.current.material.map = fabricTexture;
        }

      //caso não existam interseções
      } else {
        setEditingComponentHTML(null);
        if (editingComponent.current) {
          orbit.enabled = true;
          copyCanvas(fabricCanvas.current, editingComponent.current.userData.canva);
          editingComponent.current.userData.canva.renderAll();
          const texture = new THREE.CanvasTexture(editingComponent.current.userData.canva.getElement())
          texture.repeat.y = - 1;
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

      if (editingComponent.current) setEditingComponentHTML(editingComponent.current.userData.name)
    }

    const onMouseMove = (e) => {
      if (isDragging) {
        //se não estiver a orbitar e estiver a arrastar
        currentMouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        currentMouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
        let intersection = null;
        if (editingComponent.current) intersection = getIntersection(raycaster, camera, editingComponent.current, currentMouse)[0];
        orbit.enabled = false;
        if (intersection != null) {
          currentUVCursor.x = intersection.uv.x * fabricCanvas.current.width;
          currentUVCursor.y = intersection.uv.y * fabricCanvas.current.height;
          //fabricCanvas.current.renderAll();
          //updateTexture();

          if (isImageSelected) {
            const activeObject = fabricCanvas.current.getActiveObject();

            if (activeObject) {
              let deltaX = (currentUVCursor.x - initialUVCursor.x);
              let deltaY = (currentUVCursor.y - initialUVCursor.y);
              const width = activeObject.width,
              height = activeObject.height;
              const aspectRatio = (activeObject.scaleX*width)/(activeObject.scaleY*height);

              if (isHandleSelected) {
                //handle selecionado
                let sin = Math.sin( activeObject.angle * Math.PI / 180 ), cos = Math.cos( activeObject.angle * Math.PI / 180 );
                let deltaXI = deltaX * cos + deltaY * sin, 
                deltaYI = - deltaX * sin + deltaY *cos;
                let deltaMin = Math.min(Math.abs(deltaXI),Math.abs(deltaYI));
                let newDX, newDY;
                let corner1DX, corner1DY, corner2DX, corner2DY;
                let aCoords;
                activeObject.set( { angle: rotated } );

                switch (selectedHandle) {
                  case 'tr':
                    if (deltaMin == Math.abs(deltaXI)) {
                      deltaYI = - deltaXI / aspectRatio;
                    } else deltaXI = - deltaYI * aspectRatio;
                    newDX = cos * deltaXI - sin * deltaYI;
                    newDY = sin * deltaXI + cos * deltaYI;
                    corner1DX = - sin * deltaYI;
                    corner1DY = cos * deltaYI;
                    corner2DX = cos * deltaXI;
                    corner2DY = sin * deltaXI;
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x + corner1DX, activeObject.aCoords.tl.y + corner1DY),
                      tr: new fabric.Point(activeObject.aCoords.tr.x + newDX, activeObject.aCoords.tr.y + newDY),
                      br: new fabric.Point(activeObject.aCoords.br.x + corner2DX, activeObject.aCoords.br.y + corner2DY),
                      bl: new fabric.Point(activeObject.aCoords.bl.x, activeObject.aCoords.bl.y)
                    }
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;

                  case 'tl':
                    if (deltaMin == Math.abs(deltaXI)) {
                      deltaYI = deltaXI / aspectRatio;
                    } else deltaXI = deltaYI * aspectRatio;
                    newDX = cos * deltaXI - sin * deltaYI;
                    newDY = sin * deltaXI + cos * deltaYI;
                    corner1DX = - sin * deltaYI;
                    corner1DY = cos * deltaYI;
                    corner2DX = cos * deltaXI;
                    corner2DY = sin * deltaXI;
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x + newDX,activeObject.aCoords.tl.y + newDY),
                      tr: new fabric.Point(activeObject.aCoords.tr.x + corner1DX,activeObject.aCoords.tr.y + corner1DY),
                      br: new fabric.Point(activeObject.aCoords.br.x,activeObject.aCoords.br.y),
                      bl: new fabric.Point(activeObject.aCoords.bl.x + corner2DX,activeObject.aCoords.bl.y + corner2DY)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'bl':
                    if (deltaMin == Math.abs(deltaXI)) {
                      deltaYI = - deltaXI / aspectRatio;
                    } else deltaXI = - deltaYI * aspectRatio;
                    newDX = cos * deltaXI - sin * deltaYI;
                    newDY = sin * deltaXI + cos * deltaYI;
                    corner1DX = - sin * deltaYI;
                    corner1DY = cos * deltaYI;
                    corner2DX = cos * deltaXI;
                    corner2DY = sin * deltaXI;
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x + corner2DX,activeObject.aCoords.tl.y + corner2DY),
                      tr: new fabric.Point(activeObject.aCoords.tr.x,activeObject.aCoords.tr.y),
                      br: new fabric.Point(activeObject.aCoords.br.x + corner1DX,activeObject.aCoords.br.y + corner1DY),
                      bl: new fabric.Point(activeObject.aCoords.bl.x + newDX,activeObject.aCoords.bl.y + newDY)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'br':
                    if (deltaMin == Math.abs(deltaXI)) {
                      deltaYI = deltaXI / aspectRatio;
                    } else deltaXI = deltaYI * aspectRatio;
                    newDX = cos * deltaXI - sin * deltaYI;
                    newDY = sin * deltaXI + cos * deltaYI;
                    corner1DX = - sin * deltaYI;
                    corner1DY = cos * deltaYI;
                    corner2DX = cos * deltaXI;
                    corner2DY = sin * deltaXI;
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x,activeObject.aCoords.tl.y),
                      tr: new fabric.Point(activeObject.aCoords.tr.x + corner2DX,activeObject.aCoords.tr.y + corner2DY),
                      br: new fabric.Point(activeObject.aCoords.br.x + newDX,activeObject.aCoords.br.y + newDY),
                      bl: new fabric.Point(activeObject.aCoords.bl.x + corner1DX,activeObject.aCoords.bl.y + corner1DY)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'mb':
                    newDX = ( - sin ) * ( - deltaX * ( sin ) + deltaY * cos );
                    newDY = ( cos ) * ( - deltaX * ( sin ) + deltaY * cos );

                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x,activeObject.aCoords.tl.y),
                      tr: new fabric.Point(activeObject.aCoords.tr.x,activeObject.aCoords.tr.y),
                      br: new fabric.Point(activeObject.aCoords.br.x + newDX,activeObject.aCoords.br.y + newDY),
                      bl: new fabric.Point(activeObject.aCoords.bl.x + newDX,activeObject.aCoords.bl.y + newDY)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'mt':
                    newDX = ( - sin ) * ( - deltaX * ( sin ) + deltaY * cos );
                    newDY = ( cos ) * ( - deltaX * ( sin ) + deltaY * cos );
                  
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x + newDX,activeObject.aCoords.tl.y + newDY),
                      tr: new fabric.Point(activeObject.aCoords.tr.x + newDX,activeObject.aCoords.tr.y + newDY),
                      br: new fabric.Point(activeObject.aCoords.br.x,activeObject.aCoords.br.y),
                      bl: new fabric.Point(activeObject.aCoords.bl.x,activeObject.aCoords.bl.y)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'mr':   
                    newDX = ( cos ) * ( deltaX * ( cos ) + deltaY * sin );
                    newDY = ( sin ) * ( deltaX * ( cos ) + deltaY * sin );
                  
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x,activeObject.aCoords.tl.y),
                      tr: new fabric.Point(activeObject.aCoords.tr.x + newDX, activeObject.aCoords.tr.y + newDY),
                      br: new fabric.Point(activeObject.aCoords.br.x + newDX, activeObject.aCoords.br.y + newDY),
                      bl: new fabric.Point(activeObject.aCoords.bl.x,activeObject.aCoords.bl.y)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    });
                  
                    break;
                  
                  case 'ml':
                    newDX = ( cos ) * ( deltaX * ( cos ) + deltaY * sin );
                    newDY = ( sin ) * ( deltaX * ( cos ) + deltaY * sin );
                    aCoords = {
                      tl: new fabric.Point(activeObject.aCoords.tl.x + newDX,activeObject.aCoords.tl.y + newDY),
                      tr: new fabric.Point(activeObject.aCoords.tr.x,activeObject.aCoords.tr.y),
                      br: new fabric.Point(activeObject.aCoords.br.x,activeObject.aCoords.br.y),
                      bl: new fabric.Point(activeObject.aCoords.bl.x + newDX,activeObject.aCoords.bl.y + newDY)
                    }
                  
                    activeObject.set({
                      left: aCoords.tl.lerp(aCoords.br).x,
                      top: aCoords.tl.lerp(aCoords.br).y,
                      scaleX: (aCoords.tl.distanceFrom(aCoords.tr)) / width,
                      scaleY: (aCoords.tl.distanceFrom(aCoords.bl)) / height,
                      originX: 'center',
                      originY: 'center',
                    })
                    break;
                  
                  case 'mtr':
                    rotated += calculateAngle(new THREE.Vector2(activeObject.left, activeObject.top), initialUVCursor, currentUVCursor);

                    activeObject.set({
                      angle: rotated,
                    });
                    break;
                }

              } else if (isImageSelected && activeObject.containsPoint(initialUVCursor)) {
                activeObject.set({
                  left: activeObject.left + deltaX,
                  top: activeObject.top + deltaY,
                });

                isImageSelected = selectImage(initialUVCursor, fabricCanvas, isImageSelected, rotated, selectedHandle, isHandleSelected)
                fabricCanvas.current.renderAll();
                updateTexture();
              };
            }
            initialUVCursor.x = currentUVCursor.x;
            initialUVCursor.y = currentUVCursor.y;
            if (fabricCanvas.current.getActiveObject()) {
              const obj = fabricCanvas.current.getActiveObject();
              fabricCanvas.current.getActiveObject().set({
                cornerSize: obj.width * obj.scaleX / 10,
              })
            }
            fabricCanvas.current.renderAll();
            updateTexture();
          }
        }
      } else return;
    }

    const onMouseUp = (e) => {
      isDragging = false;
      orbit.enabled = true;
      isHandleSelected = false;
      selectedHandle = null;

    }

    function onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight );
    }

    //animate--------------------------------------------------------------------------------------------------------
    const animate = () => {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    };
    animate();

   

    //listeners------------------------------------------------------------------------------------------------------
    window.addEventListener( 'resize', onWindowResize );
    containerRef.current.addEventListener('mousedown', onMouseDown);
    containerRef.current.addEventListener('mousemove', onMouseMove);
    containerRef.current.addEventListener('mouseup', onMouseUp);
    fabricCanvas.current.on('object:modified', updateTexture);
    fabricCanvas.current.on('object:scaling', updateTexture);
    fabricCanvas.current.on('object:moving', updateTexture);
    fabricCanvas.current.on('object:rotating', updateTexture);
    fabricCanvas.current.on('object:added', updateTexture);

    return () => {
      renderer.domElement.remove();
      renderer.dispose();
      window.removeEventListener( 'resize', onWindowResize );
      containerRef.current.removeEventListener('mousedown', onMouseDown);
      containerRef.current.removeEventListener('mousemove', onMouseMove);
      containerRef.current.removeEventListener('mouseup', onMouseUp);
      fabricCanvas.current.off('object:modified', updateTexture);
      fabricCanvas.current.off('object:scaling', updateTexture);
      fabricCanvas.current.off('object:moving', updateTexture);
      fabricCanvas.current.off('object:rotating', updateTexture);
      fabricCanvas.current.off('object:added', updateTexture);
    }

  }, [fabricTexture]);

  return (
    <main>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <canvas id='fabric-canvas' style={{ border: "1px solid #00bfff", marginRight: '20px'}}/>
        <div ref={containerRef}/>
    </div>
        {editingComponent.current ? (
          <>
          {editingComponentHTML.includes('COR') ? (
            <>
            <input style={{position: 'absolute', top:'0px'}}
              type='text'
              placeholder='color'
              onChange={(e) => setBGColor(e.target.value)}
            />
            </>
          ):(
            <>
            {editingComponentHTML.includes('MIX') ? (
            <>
              <input style={{position: 'absolute', top:'0px'}}
                type='text'
                placeholder='color'
                onChange={(e) => setBGColor(e.target.value)}
              />
              <input
                type='file'
                accept='image/*'
                onChange={handleImage}
                style={{padding: '50px', backgroundColor: '#234567', position: 'absolute', top: '100px'}}
              />
            </>
          ):(
          <>
          {editingComponentHTML.includes('IMP') ? (
            <>
              <input
                type='file'
                accept='image/*'
                onChange={handleImage}
                style={{padding: '50px', backgroundColor: '#234567', position: 'absolute', top: '100px'}}
              />
            </>
          ):(
            <>
            <h1 style={{fontSize:'100px', color: '#000000', position: 'absolute', top:'0px'}}>Não podes editar isso rapah toma juizo</h1>
            </>
          )}
          </>
          )}
            </>
          )}
          </>
        ):(
          <>
          </>
        )}


        

  </main>
  );

}