import React, { useRef, useState, useEffect, forwardRef } from "react";
import styles from "@/styles/page.module.css";
import { fontList } from "./fonts";
import deleteIcon from "@/imgs/binIcon.png";
import NextImage from "next/image";
import { getUVDimensions } from "./get-uv-data";

const TextEditor = forwardRef(
  (
    {
      fabricCanvas,
      activeObject,
      closeTabs,
      updateTexture,
      fontFamily,
      setFontFamily,
      addTextbox,
      fontSize,
      setFontSize,
      textAlign,
      setTextAlign,
      fillColor,
      setFillColor,
      maxTextSize,
      setMaxTextSize,
      editingComponent,
    },
    ref
  ) => {
    const [width, setWidth] = useState(activeObject ? activeObject.width : "");
    const [text, setText] = useState(activeObject ? activeObject.text : "");
    const [fill, setFill] = useState(
      activeObject ? activeObject.fill : "#000000"
    );

    const [heightWindow, setHeightWindow] = useState(292);
    const [deleteBtn, setDeleteBtn] = useState(false);

    useEffect(() => {
      let scaleF = getUVDimensions(editingComponent.current) * 0.5;
      // Determine which active object is currently selected based on the targetCanvasId
      if (fabricCanvas.current && activeObject) {
        setText(activeObject.text);
        setFontSize(activeObject.fontSize || 35); // Atualiza o estado do tamanho da fonte com base no objeto ativo
        setFillColor(activeObject.fill || "#000000"); // Atualiza o estado do tamanho da fonte com base no objeto ativo
        setFontFamily(activeObject.fontFamily || "Arial"); // Atualiza o estado do tamanho da fonte com base no objeto ativo
      }
    }, [activeObject]);

    const handleDelete = () => {
      setDeleteBtn(!deleteBtn);
      if (fabricCanvas.current && activeObject) {
        fabricCanvas.current.remove(activeObject);
        fabricCanvas.current.discardActiveObject(); // Remove a seleção atual
        fabricCanvas.current.renderAll(); // Atualiza o canvas
        // closeTabs(); // Fecha as abas de edição se necessário
        updateTexture(); // Atualiza a textura para refletir as mudanças
        closeTabs();
      }
    };

    // const handleTextChange = (newText, targetCanvasId) => {
    //   setText(newText); // Update the text state
    //   // Determine which canvas to update based on targetCanvasId and update it accordingly
    //   const canvas =
    //     targetCanvasId === "fabricCanvas"
    //       ? fabricCanvas.current
    //       : fabricCanvasMesh.current;
    //   if (canvas) {
    //     const objects = canvas.getObjects("textbox");
    //     if (objects.length > 0) {
    //       const textbox = objects[0];
    //       textbox.set("text", newText);
    //       canvas.requestRenderAll();
    //     }
    //   }
    // };
    const handleTextChange = (e) => {
      const newText = e.target.value;
      console.log(newText);

      // Check which canvas is currently being targeted and if there's an active object selected
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("text", newText);
        fabricCanvas.current.renderAll();
      }

      setText(newText);
      updateTexture(); // Update the texture to reflect the changes
      console.log(fontSize);
    };

    const [newSize, setNewSize] = useState(fontSize);
    const handleSizeChange = (e) => {
      let newSize =
        e.target.value < maxTextSize && e.target.value > 0
          ? e.target.value
          : e.target.value >= maxTextSize
          ? maxTextSize
          : e.target.value <= 0
          ? 0.1
          : e.target.value;

      for (let i = 0; i < newSize.length; i++) {
        if (newSize[0] == 0) {
          newSize = String(Number(newSize)); // Convert to Number to remove leading zeros, then back to String
        }
      }

      // Check which canvas is currently being targeted and if there's an active object selected
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("fontSize", newSize);
        fabricCanvas.current.renderAll();
      }
      console.log(newSize);
      setFontSize(newSize);
      updateTexture(); // Update the texture to reflect the changes
    };

    const handleFontFamily = (newFontFamily) => {
      // Atualiza o objeto ativo com a nova fontFamily
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("fontFamily", newFontFamily);
        fabricCanvas.current.renderAll();
      }

      setFontFamily(newFontFamily); // Atualiza o estado do React para refletir a mudança
      updateTexture(); // Chamada para atualizar a textura, se necessário
    };

    // useEffect(() => {
    //   // Certifique-se de que 'activeObject' e outros objetos similares estejam definidos e atualizados corretamente
    //   // no estado do seu componente antes de tentar usá-los aqui.
    //   if (fontFamily && fabricCanvas.current) {
    //     if (fabricCanvas.current && activeObject) {
    //       activeObject.set("fontFamily", fontFamily);
    //       fabricCanvas.current.requestRenderAll();
    //     }

    //     // Adicione chamadas set para quaisquer outros canvas que você esteja usando,
    //     // similar ao que foi feito acima.

    //     updateTexture(); // Chamada para atualizar a textura, se necessário
    //   }
    // }, [fontFamily, fabricCanvas.current, activeObject, updateTexture]);

    const handleFill = (newFill) => {
      // Check which canvas is currently being targeted and if there's an active object selected
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("fill", newFill);
        fabricCanvas.current.renderAll();
      }

      console.log("Active color: ", activeObject);
      setFillColor(newFill); // Atualiza o estado do React para refletir a mudança
      updateTexture(); // Update the texture to reflect the changes
    };

    const handleTextAlign = (newAlign) => {
      if (fabricCanvas.current && activeObject) {
        // Atualiza o objeto ativo com a nova fontFamily
        activeObject.set("textAlign", newAlign);
        fabricCanvas.current.renderAll();
      }

      setTextAlign(newAlign); // Atualiza o estado do React para refletir a mudança
      updateTexture(); // Chamada para atualizar a textura, se necessário
    };

    return (
      <>
        <div style={{ height: heightWindow }} className={styles.editZoneText}>
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
            <p className={styles.trititle}>Editar Texto</p>
            {fabricCanvas.current && (
              <label
                onClick={() => addTextbox("Seu texto aqui")} // Use a function call to ensure parameters are passed correctly
                className={styles.fileUploadLabealAdd}
              >
                <p
                  style={{
                    marginTop: -13,
                    fontSize: 15,
                    marginLeft: -1,
                    color: "#fff",
                  }}
                >
                  +
                </p>
              </label>
            )}
          </div>

          {activeObject ? (
            <>
              <div className={styles.bottomWindowText}>
                <div
                  style={{
                    display: "flex",
                    gap: 5,
                    justifyContent: "space-between",
                  }}
                  className={styles.input_Trash}
                >
                  <input
                    placeholder="Escreva o seu texto"
                    className={styles.inputText}
                    style={{ width: "90%" }}
                    value={text}
                    // value={text} // Display text from the active object
                    onChange={handleTextChange}
                  />

                  <button
                    onClick={handleDelete}
                    className={styles.deleteButton}
                  >
                    <NextImage src={deleteIcon} width={25} height={25} />
                  </button>
                </div>

                <div className={styles.textHeader}>
                  <div className={styles.fontFamily}>
                    <div>
                      <p
                        style={{
                          color: "#666",
                          fontSize: 13,
                          letterSpacing: -0.8,
                          marginBottom: 5,
                          fontFamily: "Inter",
                        }}
                      >
                        Escolha a sua fonte
                      </p>
                      <div>
                        <select
                          className={styles.selectFonts}
                          value={fontFamily}
                          onChange={(e) => {
                            const newFontFamily = e.target.value;
                            handleFontFamily(newFontFamily);
                            fabricCanvas.current.renderAll();
                            updateTexture(); // Apenas se necessário para lógica adicional
                          }}
                        >
                          {fontList.map((font) => (
                            <option
                              key={font}
                              style={{ fontFamily: font }}
                              value={font}
                            >
                              {font}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <p
                        style={{
                          color: "#666",
                          fontSize: 13,
                          letterSpacing: -0.8,
                          marginBottom: 5,
                          fontFamily: "Inter",
                          marginLeft: 5,
                        }}
                      >
                        Cor do texto
                      </p>
                      <div>
                        <select
                          className={styles.inputSize}
                          value={fillColor} // Control the selected value with the state
                          onChange={(e) => {
                            const newFill = e.target.value;
                            handleFill(newFill);
                            updateTexture(); // Aplica a nova fonte ao objeto ativo
                          }}
                        >
                          <option value="#feff00">Amerelo Claro</option>
                          <option value="#88bcec">Azul</option>
                          <option value="#f8c404">Amarelo</option>
                          <option value="#000000">Preto</option>
                          <option value="#90240c">Castanho Avermelhado</option>

                          <option value="#90240c">Verde</option>
                          <option value="#f0540c">Vermelho Claro</option>
                          <option value="#1004d4">Azul Escuro</option>
                          <option value="#08a4d4">Azul Água</option>
                          <option value="#600c14">Castanho</option>

                          <option value="#48cc3c">Verde Claro</option>
                          <option value="#d8d49c">Dourado-Bege</option>
                          <option value="#c8c4c4">Cinza</option>
                          <option value="#082c0c">Verde Escuro</option>
                          <option value="#080c1c">Azul-Preto</option>

                          <option value="#d02414">Vermelho</option>
                          <option value="#68147c">Violeta</option>
                          <option value="#ffffff">Branco</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div className={styles.alinhamento_Tamanho}>
                    <div>
                      <p
                        style={{
                          color: "#666",
                          fontSize: 13,
                          letterSpacing: -0.8,
                          marginBottom: 5,
                          fontFamily: "Inter",
                        }}
                      >
                        Alinhamento
                      </p>
                      <div className={styles.alignBtns}>
                        <button
                          onClick={() => {
                            const newAlign = "left";
                            handleTextAlign(newAlign);
                          }}
                          className={styles.alignBtn}
                        >
                          <img
                            src={"./alignLeft.png"}
                            style={{ width: 20, height: 20, marginTop: 4 }}
                            alt="Step"
                          />
                        </button>
                        <button
                          onClick={() => {
                            const newAlign = "center";
                            handleTextAlign(newAlign);
                          }}
                          className={styles.alignBtn}
                        >
                          <img
                            src={"./alignMiddle.png"}
                            style={{ width: 20, height: 20, marginTop: 4 }}
                            alt="Step"
                          />
                        </button>
                        <button
                          onClick={() => {
                            const newAlign = "right";
                            handleTextAlign(newAlign);
                          }}
                          className={styles.alignBtn}
                        >
                          <img
                            src={"./alignRight.png"}
                            style={{ width: 20, height: 20, marginTop: 4 }}
                            alt="Step"
                          />
                        </button>
                        <button
                          style={{ opacity: 0 }}
                          className={styles.alignBtn}
                        >
                          <img
                            src={"./textIconalign.png"}
                            style={{ width: 20, height: 20, marginTop: 4 }}
                            alt="Description"
                          />
                        </button>
                      </div>
                    </div>
                    <div className={styles.inputMain}>
                      <p
                        style={{
                          color: "#666",
                          fontSize: 13,
                          letterSpacing: -0.8,
                          marginBottom: 5,
                          fontFamily: "Inter",
                        }}
                      >
                        Tamanho
                      </p>
                      <div>
                        <input
                          className={styles.inputText}
                          // style={{ width: 90 }}
                          value={fontSize == 0.1 ? 0 : fontSize}
                          inputMode={"numeric"}
                          // value={text} // Display text from the active object
                          onChange={handleSizeChange}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className={styles.noText}>
              <p className={styles.trititle}>Adicione texto para começar</p>
            </div>
          )}
        </div>
      </>
    );
  }
);

export default TextEditor;
