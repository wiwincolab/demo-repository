/* The shared PATH_E / PATH_W corridors are 1.42 m wide, at local Z = 2.
 * Each lane makes a small, continuous U-turn inside the outermost tile. */
(() => {
  const radius = .24, left = -17.2, right = 17.2;
  const straight = right - left, arc = Math.PI * radius;
  const length = 2 * (straight + arc);
  function sample(distance, row = 0) {
    let d = ((distance % length) + length) % length;
    const z = row * 12 + 2;
    if (d < straight) return { x: left + d, z: z - radius, heading: Math.PI / 2 };
    d -= straight;
    if (d < arc) {
      const angle = -Math.PI / 2 + d / radius;
      return { x: right + radius * Math.cos(angle), z: z + radius * Math.sin(angle), heading: -angle };
    }
    d -= arc;
    if (d < straight) return { x: right - d, z: z + radius, heading: -Math.PI / 2 };
    const angle = Math.PI / 2 + (d - straight) / radius;
    return { x: left + radius * Math.cos(angle), z: z + radius * Math.sin(angle), heading: -angle };
  }
  globalThis.TownWalkerPaths = Object.freeze({ sample, length, radius });
})();
