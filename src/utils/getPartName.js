const partNames = {
  bodyF: "Frente",
  bodyB: "Trás",
  mangaL: "Manga Esquerda",
  mangaR: "Manga Direita",
  hoodOut: "Capuz",
  hoodIn: "Forro",
  agulhetas: "Agulhetas",
  pocket: "Bolso",
  argolas: "Argolas",
  corda: "Cordas",
  elasticoC: "Elástico Central",
  elasticoL: "Elástico Esquerdo",
  elasticoR: "Elástico Direito",
  capaMIX: "Capa",
};

export const getPartName = (filename) => {
  const prefix = Object.keys(partNames).find((prefix) =>
    filename.startsWith(prefix)
  );
  return prefix ? partNames[prefix] : "Parte Desconhecida";
};
