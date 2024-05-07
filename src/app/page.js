"use client";
import Head from "next/head";
import ThreeDViewer from "./ThreeDViewer";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "../styles/page.module.css";
import logo from "../imgs/logoAllkits.png";
import ImageEditor from "./ImageEditor";

const Home = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  return (
    <div>
      <Head>
        <title>3D Sweat Design Simulator</title>
        <meta name="description" content="Your 3D Sweat Design Simulator" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className={styles.titleZone}>
        <div className={styles.titleStruct}>
          <Image src={logo} width={80} height={35} />
          <p className={styles.desc}>Simulator</p>
        </div>
        <p
          style={{
            color: "#333",
            textAlign: "left",
            fontSize: 12,
            letterSpacing: -0.5,
            marginTop: 0,
          }}
          className={styles.subtitle}
        >
          STEP, Lda. Hoodie 3D Models
        </p>
      </div>

      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "70vh",
          backgroundColor: "#f4f4f4",
          margin: "auto",
        }}
      >
        <ThreeDViewer product={product} />
      </main>
    </div>
  );
};

export default Home;
