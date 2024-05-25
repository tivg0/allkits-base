export const animatePrice = (start, end, duration, setAnimatedPrice) => {
    let startTime = null;
    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setAnimatedPrice((progress * (end - start) + start).toFixed(2));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setAnimatedPrice(end.toFixed(2)); // Certifica-se de que o preço final é exatamente o que deve ser
      }
    };
    window.requestAnimationFrame(step);
  };