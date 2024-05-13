function calculateAverageUV(mesh) {
    const uvAttribute = mesh.geometry.getAttribute('uv');
    if (!uvAttribute) {
        console.error('No UV coordinates found in the mesh.');
        return null;
    }
  
    let totalU = 0;
    let totalV = 0;
    const count = uvAttribute.count;
  
    // Sum all UV coordinates
    for (let i = 0; i < count; i++) {
        totalU += uvAttribute.getX(i);
        totalV += uvAttribute.getY(i);
    }
  
    // Calculate averages
    const averageU = totalU / count;
    const averageV = totalV / count;
  
    return { averageU, averageV };
  }
  
  function getUVDimensions(mesh) {
  const uvAttribute = mesh.geometry.getAttribute('uv');
  if (!uvAttribute) {
      console.error('No UV coordinates found in the mesh.');
      return null;
  }
  
  let minU = Infinity;
  let maxU = -Infinity;
  let minV = Infinity;
  let maxV = -Infinity;
  
  // Iterate over all UV coordinates to find min and max for U and V
  for (let i = 0; i < uvAttribute.count; i++) {
      const u = uvAttribute.getX(i);
      const v = uvAttribute.getY(i);
  
      if (u < minU) minU = u;
      if (u > maxU) maxU = u;
      if (v < minV) minV = v;
      if (v > maxV) maxV = v;
  }
  
  // Calculate dimensions
  const width = maxU - minU;
  const height = maxV - minV;
  
  const smallerSide = Math.min(width, height);
  
  return smallerSide;
  }

  export {getUVDimensions, calculateAverageUV}