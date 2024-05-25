import { fabric } from "fabric";
import { calculateAverageUV, getUVDimensions } from "../three/get-uv-data";
import { fontList } from "../../assets/fonts";

export function addTextbox(
  text,
  fabricCanvas,
  updateTexture,
  editingComponent,
  fontSize,
  fontFamily,
  fillColor,
  textAlign,
  setActiveObject
) {
  let position = calculateAverageUV(editingComponent.current);
  let scaleF =
    getUVDimensions(editingComponent.current).smallerSide *
    0.05 *
    fabricCanvas.current.width;

  const canvas = fabricCanvas.current;
  if (canvas) {
    const textbox = new fabric.Textbox(text, {
      left: canvas.width * position.averageU,
      top: canvas.height * (position.averageV - 0.1),
      originX: "center",
      originY: "center",
      width: 155,
      height: 200,
      fontSize: Math.floor(scaleF),
      fontFamily: fontFamily,
      fill: fillColor,
      textAlign: textAlign,
      editable: false,
      borderColor: "transparent",
      cornerColor:
        canvas.backgroundColor == "#000000"
          ? "rgba(255, 255, 255, 0.4)"
          : "rgba(0, 0, 0, 0.4)",
      padding: 5,
      transparentCorners: false,
      cornerStyle: "circle",
      shadow: "rgba(0,0,0,0.3) 0px 0px 10px",
    });

    let minSide = Math.min(textbox.width, textbox.height);
    if (minSide < 100) {
      minSide = 10;
    }

    textbox.set({
      cornerSize: fontSize / 2,
    });
    for (const font of fontList) {
      textbox.set("fontFamily", font);
    }
    textbox.set("fontFamily", "Arial");

    delete textbox.controls.tr;
    delete textbox.controls.tl;
    delete textbox.controls.br;
    delete textbox.controls.bl;
    delete textbox.controls.mt;
    delete textbox.controls.mb;

    canvas.add(textbox);
    fabricCanvas.current.setActiveObject(textbox);
    setActiveObject(textbox);
    canvas.renderAll();
    updateTexture();
  }
}
