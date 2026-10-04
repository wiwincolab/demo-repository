/** Three physical camera beats; no screen-sized picture is used to hide the zoom. */
export function revisitCamera(zoom:number, bearing:number, id:string, three:boolean) {
  const framing:Record<string,number>={kobe:16.6,amanohashidate:13.9,ine:16,kyoto:16.4,nara:16.4,dotonbori:17.1,usj:16.5,'fuji-blue':13.8};
  const close=framing[id]??zoom;
  return {
    survey:{zoom:Math.min(12.4,close-2.8),pitch:0,bearing:bearing-18},
    descend:{zoom:close-1.25,pitch:three?22:0,bearing:bearing-8},
    scene:{zoom:close,pitch:three?52:0,bearing},
  };
}
