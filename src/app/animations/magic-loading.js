function magicLoading (backgroundMagic, modelos, titleModels) {
    if (backgroundMagic && backgroundMagic.current) {
      backgroundMagic.current.style.backgroundColor = "transparent";
      backgroundMagic.current.style.backdropFilter = "blur(0px)";
      backgroundMagic.current.style.transition = "all 0.8s cubic-bezier(0.8,0,0.8,1.0)";
    }

    if (modelos && modelos.current) {
        modelos.current.style.gap = "500px";
        modelos.current.style.opacity = "0";
        titleModels.current.style.marginTop = "-100%";
        modelos.current.style.transition = "gap 1s cubic-bezier(0.8,0,0.8,1.0), opacity 0.3s cubic-bezier(0.8,0,0.8,1.0), margin-top 0.1s cubic-bezier(0.8,0,0.8,1.0)";
    }
  
    if (titleModels && titleModels.current) {
        titleModels.current.style.marginTop = "-100%";
        titleModels.current.style.opacity = "0";
        titleModels.current.style.transition = "opacity 0.3s cubic-bezier(0.1, 0.7 , 0.0 ,1.0), margin-top 1.6s cubic-bezier(0.7, 0.1 , 0.0 ,1.0)";
    }
};

export {magicLoading}