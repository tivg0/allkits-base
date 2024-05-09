"use client";
import React, { useEffect, useRef } from "react";
import { fabric } from "fabric";

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

    return () => {
      // Cleanup code here if needed
    };
  }, [params]);

  // Render canvases
  return (
    <>
      {canvasRefs.current.map((canvasRef, index) => (
        <canvas key={index} ref={(el) => (canvasRefs.current[index] = el)} />
      ))}
    </>
  );
};

export default FabricCanvas;
