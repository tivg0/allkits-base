const partNames = {
  pt: {
    bodyF: "Frente",
    bodyB: "Trás",
    mangaL: "Manga Esquerda",
    mangaR: "Manga Direita",
    hoodOut: "Capuz",
    hoodIn: "Forro",
    agulhetas: "Agulhetas",
    pocket: "Bolso",
    argolas: "Argolas",
    corda: "Cordões",
    elasticoC: "Elástico Central",
    punhoL: "Elástico Esquerdo",
    punhoR: "Elástico Direito",
  },
  en: {
    bodyF: "Front",
    bodyB: "Back",
    mangaL: "Left Sleeve",
    mangaR: "Right Sleeve",
    hoodOut: "Hood",
    hoodIn: "Lining",
    agulhetas: "Drawstring Needles",
    pocket: "Pocket",
    argolas: "Rings",
    corda: "Drawstrings",
    elasticoC: "Central Elastic",
    punhoL: "Left Elastic",
    punhoR: "Right Elastic",
  },
};

export const getPartName = (filename, lang) => {
  const prefix = Object.keys(partNames[lang]).find((prefix) =>
    filename.startsWith(prefix)
  );
  return prefix ? partNames[lang][prefix] : "Parte Desconhecida";
};
