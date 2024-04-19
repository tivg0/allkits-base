import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import styles from "../styles/page.module.css";

const ImageEditor = forwardRef(
  (
    {
      closeTabs,
      fabricCanvas,
      updateTexture,
      activeObject,
      imageSrc,
      setImageSrc,
    },
    ref
  ) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [colorToRemove, setColorToRemove] = useState(null);
    const canvasRef = useRef(null);
    const imgRef = useRef(new Image());
    const [imgTest, setimgTeste] = useState(null);
    const [picker, setPicker] = useState(false);
    const [removeBtn, setRemoveBtn] = useState(false);
    const [atributos, setAtributos] = useState(false);
    const [heightWindow, setHeightWindow] = useState(292);
    const [windowCanvas, setWindowCanvas] = useState(0);
    const [opacityHint, setOpacityHint] = useState(1);
    const [opacityHintText, setOpacityHintText] = useState(1);
    const [indexHint, setIndexHint] = useState(0);
    const [widthHint, setWidthHint] = useState(190);
    const [fontHint, setFontHint] = useState(12);
    const [displayHint, setDisplayHint] = useState("flex");

    const removeBgImgCanva = (newImg) => {
      const canvas = fabricCanvas.current;

      if (activeObject && activeObject.type === "image") {
        const originalProps = {
          left: activeObject.left,
          top: activeObject.top,
          scaleX: activeObject.scaleX,
          scaleY: activeObject.scaleY,
          angle: activeObject.angle,
        };

        fabric.Image.fromURL(newImg, (newImg) => {
          //console.log(editingComponent.current.name);
          // Scale the new image to match the size of the previous image

          // Set the position of the new image to match the previous image
          newImg.set({
            ...originalProps,
            borderColor: "#00bfff",
            cornerSize: 15,
            cornerColor: "#00bfff", // size of the control corners
            transparentCorners: false,
            cornerStyle: "circle",
          });

          // Remove the first image
          canvas.remove(activeObject);
          // Add the new image in place of the first one
          canvas.add(newImg);
          canvas.requestRenderAll();
          updateTexture();
        });
      }
    };

    const handleHoverHint = () => {
      // Immediately start fading out the hint text
      setOpacityHintText(0);

      setTimeout(() => {
        // After 400ms, hide the hint completely
        setOpacityHint(0);
        setWidthHint(0);
        // Optionally, adjust the font hint here if needed
      }, 400);
    };

    const handleLeaveHint = () => {
      // Wait for 5 seconds before resetting the hint's appearance
      setTimeout(() => {
        setOpacityHint(1);
        setWidthHint(190);
        setOpacityHintText(1);
        // Optionally, reset the font hint size here if needed
      }, 5000);
    };

    const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          // img.onload = () => addImage(img.src);

          img.onload = () => {
            // Suponha que 'targetCanvasId' seja uma prop que você passa para o ImageEditor
            // indicando se é para atualizar 'fabricCanvas' ou 'fabricCanvasMesh'
            addImage(img.src, targetCanvasId);
          };
          img.src = event.target.result;
        };

        reader.readAsDataURL(file);
        setSelectedFile(URL.createObjectURL(file));
        updateTexture();
      }
    };

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
            cornerColor: "rgb(255,0,0)",
          });
          fabricCanvas.current.add(fabricImage);
          fabricCanvas.current.renderAll();
          updateTexture();
        };
      };
      reader.readAsDataURL(file);
    };

    // useEffect(() => {
    //   const handleSelection = () => {
    //     if (fabricCanvas.current) {
    //       const activeObject = fabricCanvas.current.getActiveObject();
    //       if (activeObject && activeObject.type === "image") {
    //         setImageSrc(activeObject.getSrc()); // Salva a URL da imagem no estado
    //       }
    //     }
    //   };
    //   console.log("fabricname:", fabricCanvas.current);

    //   if (fabricCanvas.current) {
    //     fabricCanvas.current.on("selection:created", handleSelection);
    //     fabricCanvas.current.on("selection:updated", handleSelection);
    //   }

    //   return () => {
    //     if (fabricCanvas.current) {
    //       fabricCanvas.current.off("selection:created", handleSelection);
    //       fabricCanvas.current.off("selection:updated", handleSelection);
    //     }
    //   };
    // }, [fabricCanvas]);

    // Then export the canvas as before
    const exportCanvasAsImage = () => {
      // Temporarily set canvas background to #0f0 for export
      const originalBg = fabricCanvas.backgroundColor;
      fabricCanvas.backgroundColor = "#fff"; // Set to white
      fabricCanvas.renderAll();

      const dataURL = fabricCanvas.toDataURL({
        format: "png",
        quality: 1.0,
      });

      // Revert canvas background to its original state after export, if needed
      fabricCanvas.backgroundColor = originalBg;
      fabricCanvas.renderAll();

      return dataURL;
    };

    useEffect(() => {
      if (ref) {
        ref.current = { exportCanvasAsImage };
      }
    }, [ref, exportCanvasAsImage]);

    // const handleExport = () => {
    //   setTimeout(() => {
    //     exportTexture(exportCanvasAsImage());
    //   }, 100);
    // };

    // remove color

    useEffect(() => {
      loadImageOnCanvas();
      if (activeObject) setRemoveBtn(true);
    }, [activeObject]);

    const loadImageOnCanvas = () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = imgRef.current;
      img.src = imageSrc;
      img.onload = () => {
        // Set the canvas width to 300px
        const canvasWidth = 311;
        // Calculate the height to maintain the aspect ratio
        const aspectRatio = img.height / img.width;
        const canvasHeight = canvasWidth * aspectRatio;

        // Set the canvas dimensions
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;

        // Draw the image scaled to the canvas size
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
      };
    };

    const pickColor = (event) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      setColorToRemove(`${pixel[0]},${pixel[1]},${pixel[2]}`);
    };

    const removeColor = () => {
      if (!colorToRemove || !canvasRef.current) return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const [rToRemove, gToRemove, bToRemove] = colorToRemove
        .split(",")
        .map(Number);

      for (let i = 0; i < data.length; i += 4) {
        if (
          isWithinRange(data[i], rToRemove) &&
          isWithinRange(data[i + 1], gToRemove) &&
          isWithinRange(data[i + 2], bToRemove)
        ) {
          data[i + 3] = 0; // Torna o pixel transparente
        }
      }

      ctx.putImageData(imageData, 0, 0);
      const editedImageData = canvas.toDataURL();
      setImageSrc(editedImageData); // Atualiza a fonte da imagem com a imagem editada
      removeBgImgCanva(editedImageData);
    };

    const isWithinRange = (value, target) => {
      const tolerance = 16.1;
      return value >= target - tolerance && value <= target + tolerance;
    };

    // mudar parametros da imagem para mudar com o removeColor

    const handleWidthChange = (event) => {
      const newWidth = event.target.value;
      setWidth(newWidth);
    };

    const handleRemoverCor = () => {
      setPicker(true);
      setAtributos(false);
      loadImageOnCanvas();
      setHeightWindow(450);
      setWindowCanvas(311);
    };

    const handleAtributos = () => {
      setAtributos(true);
      setPicker(false);
    };

    return (
      <>
        <div style={{ height: heightWindow }} className={styles.editZoneImg}>
          <div className={styles.nameZone}>
            <button className={styles.fileUploadLabealBack} onClick={closeTabs}>
              <p
                style={{
                  marginTop: -15,
                  justifyContent: "center",
                  fontSize: 12,
                  marginLeft: -1,
                  color: "#fff",
                }}
              >
                &#8592;
              </p>
            </button>
            <p className={styles.trititle}>Editar Imagem</p>
            <label className={styles.fileUploadLabealAdd}>
              <p
                style={{
                  marginTop: -13,
                  marginLeft: -1,
                  fontSize: 15,
                  color: "#fff",
                }}
              >
                +
              </p>
              <input
                type="file"
                onChange={handleImage}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* {activeObject != null ||
        activeObjectMesh != null ||
        activeObjectMangaL != null ||
        activeObjectMangaR != null ||
        activeObjectHoodOut != null ? ( */}

          <div style={{ marginTop: 65 }}>
            {removeBtn ? (
              <>
                {!picker && (
                  <div>
                    <button
                      className={styles.divAreaEspecifica}
                      style={{ borderWidth: 0 }}
                      onClick={handleRemoverCor}
                    >
                      <div className={styles.divIcon}>
                        <img
                          src={"./removeIcon.png"}
                          style={{ width: 25, height: 25 }}
                          alt="Description"
                        />
                      </div>
                      <div>
                        <p className={styles.titleText}>Remover Cor</p>
                        <p className={styles.infoText}>
                          Remove cores das tuas imagens.
                        </p>
                      </div>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div>
                <input
                  type="file"
                  onChange={handleImage}
                  style={{
                    width: 311,
                    position: "absolute",
                    height: 380,
                    top: 0,
                    zIndex: -1,
                    opacity: 0,
                  }}
                />
                <div
                  style={{
                    marginTop: 165,
                    alignSelf: "center",
                  }}
                >
                  <p className={styles.trititle}>
                    Selecione uma imagem para começar
                  </p>
                </div>
              </div>
            )}

            <>
              {activeObject && picker && (
                <div
                  style={{
                    opacity: opacityHint,
                    transition: "all 0.4s ease-in-out",
                    width: widthHint,
                    display: displayHint,
                  }}
                  className={styles.hintText}
                  onMouseOver={handleHoverHint}
                  onMouseLeave={handleLeaveHint}
                  onMouseUp={handleLeaveHint} // Consider if onMouseUp is necessary for your use case
                >
                  <img
                    src="./removeIcon.png"
                    style={{ width: 15, height: 15 }}
                  />
                  <p
                    style={{
                      color: "#333",
                      textAlign: "center",
                      opacity: opacityHintText,
                      fontSize: fontHint,
                      letterSpacing: -0.4,
                    }}
                    className={styles.trititle}
                  >
                    Clique em cima da cor
                  </p>
                </div>
              )}
            </>

            {picker ? (
              <div className={styles.bottomWindow}>
                <button
                  style={{
                    backgroundColor: "#fff",
                    boxShadow: "0px 0px 35px rgba(0, 0, 0, 0.25)",
                  }}
                  className={styles.fecharBtn}
                  onClick={removeColor}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      alignSelf: "center",
                      textAlign: "center",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        backgroundColor: `rgb(${colorToRemove})`,
                        borderRadius: 100,
                        border: "1px solid #f2f2f2",
                        boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                      }}
                    ></div>
                    Remover Cor
                  </div>
                </button>
              </div>
            ) : null}

            <div
              style={{
                width: windowCanvas,
                justifyContent: "center",
                backgroundColor: "#f9f9f9",
                borderRadius: 10,
                border: "1px solid transparent",
                boxShadow: "0 0 15px rgba(0, 0, 0, 0.1)",
                marginTop: 10,
              }}
            >
              <canvas
                ref={canvasRef}
                onClick={pickColor}
                style={{
                  display: "block",
                  cursor: "crosshair",
                  borderRadius: 15,
                  width: "90%",
                  border: "1px solid transparent",
                  justifyContent: "center",
                  margin: "5%",
                }}
              />
            </div>
          </div>
          {/* ) : (
          <div
            style={{
              marginTop: 165,
              alignSelf: "center",
            }}
          >
            <p className={styles.trititle}>Adicione uma imagem para começar</p>
          </div>
        )} */}

          <div className={styles.exportBtn}>
            <button>Pré-visualizar</button>
          </div>
        </div>
      </>
    );
  }
);

export default ImageEditor;
