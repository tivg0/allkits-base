import React, { useRef, useState, useEffect, forwardRef } from "react";
import styles from "@/styles/page.module.css";

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
    },
    ref
  ) => {
    const [width, setWidth] = useState(activeObject ? activeObject.width : "");
    const [text, setText] = useState(activeObject ? activeObject.text : "");
    const [fontList, setFontList] = useState([
      "Akira Expanded Demo",
      "Alfa Slab One",
      "Antonio Medium",
      "Antonio Thin",
      "Arial",
      "Arial Bold",
      "Arial Black",
      "Bebas Neue",
      "Belinda New",
      "College Block",
      "Constantia",
      "Constantia Bold",
      "Courier",
      "Courier Bold",
      "Filson Pro Bold",
      "Filson Pro Book",
      "Filson Pro Heavy",
      "Filson Pro Light",
      "Filson Pro Medium Italic",
      "Filson Pro Regular",
      "Filson Pro Thin",
      "Fineday Style One",
      "Fineday Style Two",
      "Futura Bk BT Book",
      "Futura Md BT Bold",
      "Futura Md BT Medium",
      "Ghost Clan",
      "Graduate Regular",
      "Helvetica Bold",
      "Helvetica Light",
      "Helvetica",
      "Himalaya",
      "Hudson NY Slab",
      "Hudson NY Pro Slab Light",
      "Impact",
      "Kettering 105 Bold",
      "Kettering 205 Heavy",
      "LEMONMILK Bold",
      "LEMONMILK Light",
      "LEMONMILK Regular",
      "Libre Baskerville Bold",
      "Libre Baskerville Regular",
      "Octin Sports Free Regular",
      "Picturama Alternate",
      "Picturama Founder PERSONAL USE ONLY",
      "Princetown Std Regular",
      "Resolve Sans Bold Condensed",
      "Sanchez Italic",
      "Sanchez Regular",
      "Shrikhand Regular",
      "Super Plants",
      "Super Summer Personal Use",
      "Times New Roman",
      "Times New Roman Bold",
      "Yearbook Solid",
    ]);

    const [heightWindow, setHeightWindow] = useState(292);

    useEffect(() => {
      // Carregar as fontes disponíveis
      const fetchFonts = async () => {
        try {
          const response = await fetch("/fonts");
          const fontData = await response.json();
          console.log("Conteúdo retornado:", fontData); // Verifique o conteúdo retornado
          setFontList(fontData.fonts);
        } catch (error) {
          console.error("Erro ao carregar fontes:", error);
        }
      };

      fetchFonts();
    }, []);

    useEffect(() => {
      // Determine which active object is currently selected based on the targetCanvasId
      if (fabricCanvas.current && activeObject) {
        setText(activeObject.text);
        setFontSize(activeObject.fontSize || 35); // Atualiza o estado do tamanho da fonte com base no objeto ativo
      }
    }, [activeObject]);

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

      // Check which canvas is currently being targeted and if there's an active object selected
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("text", newText);
        fabricCanvas.current.renderAll();
      }

      setText(newText);
      updateTexture(); // Update the texture to reflect the changes
    };

    const handleSizeChange = (newSize) => {
      // Check which canvas is currently being targeted and if there's an active object selected
      if (fabricCanvas.current && activeObject) {
        // Update text for the active object in fabricCanvas
        activeObject.set("fontSize", newSize);
        fabricCanvas.current.renderAll();
      }

      setFontSize(newSize);
      updateTexture(); // Update the texture to reflect the changes
    };

    const handleFontFamily = (newFontFamily) => {
      // Atualiza o objeto ativo com a nova fontFamily

      activeObject.set({ fontFamily: newFontFamily });

      fabricCanvas.current.renderAll();
      console.log(newFontFamily);
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
      // Atualiza o objeto ativo com a nova fontFamily
      activeObject.set("fillColor", newFill);
      fabricCanvas.current.renderAll();
      setFillColor(newFill); // Atualiza o estado do React para refletir a mudança
      updateTexture(); // Chamada para atualizar a textura, se necessário
    };

    const handleTextAlign = (newAlign) => {
      // Atualiza o objeto ativo com a nova fontFamily
      activeObject.set({ textAlign: newAlign });
      fabricCanvas.current.renderAll();
      console.log(newAlign);

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
              <div className={styles.bottomWindow}>
                <div style={{ marginTop: 115 }}></div>
                {/* <input
                  placeholder="Escreva o seu texto"
                  className={styles.inputText}
                  onChange={(e) =>
                    handleTextChange(e.target.value, targetCanvasId)
                  } // Update text based on input changes
                /> */}
                <input
                  placeholder="Escreva o seu texto"
                  className={styles.inputText}
                  value={text}
                  // value={text} // Display text from the active object
                  onChange={handleTextChange}
                />
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
                        style={{
                          backgroundColor: "#f2f2f2",
                          border: 0,
                          paddingLeft: 10,
                          padding: 7,
                          borderRadius: 100,
                        }}
                        className={styles.selectFonts}
                        value={fontFamily}
                        onChange={(e) => {
                          const newFontFamily = e.target.value;
                          handleFontFamily(newFontFamily);
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
                      }}
                    >
                      Tamanho {fontSize}
                    </p>
                    <div>
                      <select
                        style={{
                          backgroundColor: "#f2f2f2",
                          border: 0,
                          paddingLeft: 10,
                          padding: 7,
                          borderRadius: 100,
                        }}
                        className={styles.inputSize}
                        value={fontSize} // Ensure the selected value is controlled by the state
                        onChange={(e) => {
                          const newSize = parseInt(e.target.value, 10);
                          handleSizeChange(newSize);

                          updateTexture(); // Aplica a nova fonte ao objeto ativo
                        }}
                      >
                        <option defaultValue value="15">
                          15
                        </option>
                        {/* Ensure this matches the state's initial value */}
                        <option value="50">50</option>
                        <option value="75">75</option>
                        <option value="100">100</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className={styles.alignBtns}>
                  <button
                    onClick={() => {
                      const newAlign = "left";
                      handleTextAlign(newAlign);
                    }}
                    className={styles.alignBtn}
                  >
                    <img
                      src={"./textIconalign.png"}
                      style={{ width: 20, height: 20, marginTop: 4 }}
                      alt="Description"
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
                      src={"./textIconalign.png"}
                      style={{ width: 20, height: 20, marginTop: 4 }}
                      alt="Description"
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
                      src={"./textIconalign.png"}
                      style={{ width: 20, height: 20, marginTop: 4 }}
                      alt="Description"
                    />
                  </button>
                  <button style={{ opacity: 0 }} className={styles.alignBtn}>
                    <img
                      src={"./textIconalign.png"}
                      style={{ width: 20, height: 20, marginTop: 4 }}
                      alt="Description"
                    />
                  </button>
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
                        style={{
                          backgroundColor: "#f2f2f2",
                          border: 0,
                          paddingLeft: 10,
                          padding: 7,
                          borderRadius: 100,
                        }}
                        className={styles.inputSize}
                        value={fillColor} // Control the selected value with the state
                        onChange={(e) => {
                          const newFill = e.target.value;
                          console.log(newFill);
                          handleFill(newFill);
                          updateTexture(); // Aplica a nova fonte ao objeto ativo
                        }}
                      >
                        <option value="#000000">Preto</option>
                        <option value="#ffffff">Branco</option>
                        <option value="#ffff00">Amerelo</option>
                        <option value="#ff0000">Vermelho</option>
                        <option value="#00bfff">Azul</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div
              style={{
                marginTop: 165,
                alignSelf: "center",
              }}
            >
              <p className={styles.trititle}>Adicione texto para começar</p>
            </div>
          )}
        </div>
      </>
    );
  }
);

export default TextEditor;