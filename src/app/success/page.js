"use client";
import { useParams, useRouter } from "next/navigation";
const Success = () => {
  const router = useRouter();
  console.log(router);
  return (
    <div>
      <h1>Personalização submetida com sucesso</h1>
      <h5>Iremos entrar em contacto consigo muito brevemente</h5>
      {/*  {docId != "" ? (
        <button
          className={styles.btnPreviewLink}
          onClick={() => router.push(`/visualize/${docId}`)}
          // target={"_blank"}
        >
          <NextImage src={shareIcon} width={20} height={20} />
          <p>Copiar e ir para o teu link de pré-visualização</p>
        </button>
      ) : (
        <button className={styles.btnBuildLink}>
          <NextImage src={buildingIcon} width={20} height={20} />
          <p>A criar o teu link de pré-visualização</p>
        </button>
      )} */}
    </div>
  );
};

export default Success;
