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
  corda: "Cordões",
  elasticoC: "Elástico Central",
  punhoL: "Elástico Esquerdo",
  punhoR: "Elástico Direito",
};

export const getPartName = (filename) => {
  const prefix = Object.keys(partNames).find((prefix) =>
    filename.startsWith(prefix)
  );
  return prefix ? partNames[prefix] : "Parte Desconhecida";
};
