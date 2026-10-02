/** A deliberately authored demo miniature. It is not a reconstructed photo mesh. */
export function createUsjMiniature(T: any) {
  const root = new T.Group();
  const parts: Record<string, any> = {};
  const materials = new Map<string, any>();
  const mat = (color: string, roughness = .7) => {
    const key = color + roughness;
    if (!materials.has(key)) materials.set(key, new T.MeshStandardMaterial({ color, roughness }));
    return materials.get(key);
  };
  function mesh(parent: any, geometry: any, material: any, x = 0, y = 0, z = 0) {
    const object = new T.Mesh(geometry, material);
    object.position.set(x, y, z); object.castShadow = true; object.receiveShadow = true;
    parent.add(object); return object;
  }
  const box = (p: any, w: number, h: number, d: number, color: string, x = 0, y = 0, z = 0) =>
    mesh(p, new T.BoxGeometry(w, h, d), mat(color), x, y, z);
  const sphere = (p: any, r: number, color: string, x = 0, y = 0, z = 0) =>
    mesh(p, new T.SphereGeometry(r, 24, 16), mat(color), x, y, z);
  const cylinder = (p: any, rt: number, rb: number, h: number, color: string, x = 0, y = 0, z = 0, count = 32) =>
    mesh(p, new T.CylinderGeometry(rt, rb, h, count), mat(color), x, y, z);
  function group(x = 0, y = 0, z = 0, parent = root) {
    const g = new T.Group(); g.position.set(x, y, z); parent.add(g); return g;
  }
  function roundedShape(w: number, d: number, r: number) {
    const s = new T.Shape(), x = -w / 2, y = -d / 2;
    s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s;
  }
  function slab(p: any, w: number, d: number, h: number, color: string, x = 0, y = 0, z = 0, r = .18) {
    const geo = new T.ExtrudeGeometry(roundedShape(w, d, r), { depth: h, bevelEnabled: true, bevelSegments: 2, steps: 1, bevelSize: .035, bevelThickness: .025, curveSegments: 8 });
    geo.rotateX(-Math.PI / 2); return mesh(p, geo, mat(color), x, y, z);
  }
  function arch(w: number, h: number, depth: number) {
    const s = new T.Shape(), r = w / 2;
    s.moveTo(-r, 0); s.lineTo(r, 0); s.lineTo(r, h - r); s.absarc(0, h - r, r, 0, Math.PI, false); s.closePath();
    return new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 16 });
  }
  function plaque(p: any, text: string, width: number, height: number, x: number, y: number, z: number, bg = '#f2ca8e', ink = '#8d3d28') {
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 256;
    const c = canvas.getContext('2d')!;
    c.fillStyle = bg; c.fillRect(0, 0, 768, 256); c.strokeStyle = ink; c.lineWidth = 8; c.strokeRect(15, 15, 738, 226);
    c.fillStyle = ink; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = text==='?'?'bold 210px Arial':'bold 80px Georgia';
    if(text==='?'){c.save();c.translate(384,128);c.scale(3,1);c.fillText('?',0,0);c.restore();}
    else text.split('\n').forEach((line, i, a) => c.fillText(line, 384, 128 + (i - (a.length - 1) / 2) * 92));
    const texture = new T.CanvasTexture(canvas); texture.colorSpace = T.SRGBColorSpace;
    return mesh(p, new T.PlaneGeometry(width, height), new T.MeshBasicMaterial({ map: texture, toneMapped: false }), x, y, z);
  }
  // Warm ceramic plinth, with a quiet engraved edge and inset landscape.
  slab(root, 11.7, 8.6, .48, '#e1d9c5', 0, -.48, 0, .65);
  slab(root, 11.8, 8.7, .09, '#f8f2df', 0, -.08, 0, .65);
  slab(root, 11.4, 8.3, .06, '#a6bb82', 0, .015, 0, .55);
  slab(root, 8.6, 2.6, .055, '#eee5cc', -.1, .09, 2.32, .65);
  slab(root, 1.4, 6.2, .06, '#e4dcc6', -.15, .095, -.03, .2);
  plaque(root, 'OSAKA · A DAY AT THE PARK', 3.7, .25, 0, -.25, 4.355, '#e8dfca', '#69695b');

  // Café: rounded red cap, radial white spots, timber entrance and little terrace.
  const cafe = parts.cafe = group(-3.05, .09, 1.2); cafe.userData.part = 'cafe';
  cylinder(cafe, 1.14, 1.2, 1.25, '#f2d8a2', 0, .65);
  cylinder(cafe, 1.22, 1.22, .12, '#e6b36e', 0, .14);
  const cap = mesh(cafe, new T.SphereGeometry(1.78, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2), mat('#e34e42', .47), 0, 1.12);
  cap.scale.y = .8;
  cylinder(cafe, 1.76, 1.76, .09, '#f3e7cc', 0, 1.11);
  const spotAngles = [[.25, 0, .38], [.78, .72, .40], [.83, 2.12, .42], [.93, 3.47, .42], [.87, 4.85, .40], [1.20, 5.7, .22]];
  spotAngles.forEach(([theta, phi, size]) => {
    const x = 1.79 * Math.sin(theta!) * Math.cos(phi!), y = 1.12 + 1.79 * .8 * Math.cos(theta!), z = 1.79 * Math.sin(theta!) * Math.sin(phi!);
    const spot = sphere(cafe, size!, '#fff4df', x, y, z); spot.scale.z = .045;
    spot.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), new T.Vector3(x, (y - 1.12) / .64, z).normalize());
  });
  mesh(cafe, arch(.93, 1.0, .16), mat('#c19758'), 0, .12, 1.02);
  mesh(cafe, arch(.72, .86, .055), mat('#875c3f'), 0, .12, 1.17);
  const door = group(-.32, .12, 1.235, cafe);
  const doorPanel = mesh(door, arch(.64, .82, .055), mat('#bd8a50'), .32, 0);
  for (let i = 0; i < 5; i++) box(door, .009, .52, .008, '#9a6e44', .08 + i * .12, .3, .06);
  sphere(door, .035, '#d4aa52', .54, .37, .08);
  const glass = new T.MeshStandardMaterial({ color: '#f0c374', emissive: '#ffba52', emissiveIntensity: .22, roughness: .4 });
  for (const x of [-.8, .8]) {
    mesh(cafe, arch(.36, .48, .06), mat('#8d6845'), x, .48, .9);
    mesh(cafe, arch(.26, .36, .065), glass, x, .53, .925);
    box(cafe, .03, .3, .03, '#a4733c', x, .7, 1.01);
  }
  plaque(cafe, 'KINOPIO\nCAFE', 1.14, .52, 0, 1.68, 1.80);
  slab(cafe, 2.35, .65, .1, '#eee0be', 0, .1, 1.41, .2);
  for (const x of [-1.58, 1.58]) {
    cylinder(cafe, .29, .20, .40, '#cfad76', x, .22, .75);
    const topiary = sphere(cafe, .34, '#67934d', x, .67, .75); topiary.scale.y = 1.25;
  }

  // Rear castle: masonry courses, crenellations and a recognisable sculpted gate.
  const castle = parts.castle = group(-1.2, .09, -2.25); castle.userData.part = 'castle';
  slab(castle, 3.35, 1.75, .16, '#777f77', 0, 0, 0, .12);
  box(castle, 2.8, 1.62, 1.2, '#909889', 0, .92, 0);
  for (let row = 0; row < 6; row++) {
    box(castle, 2.82, .024, .013, '#778171', 0, .25 + row * .25, .611);
    for (let col = 0; col < 6; col++) box(castle, .022, .21, .015, '#798574', -1.2 + col * .45 + (row % 2) * .2, .37 + row * .25, .615);
  }
  for (let i = 0; i < 8; i++) box(castle, .25, .31, .27, '#b5baaa', -1.28 + i * .36, 1.87, .48);
  for (const x of [-1.23, 1.23]) {
    cylinder(castle, .39, .46, 2.2, '#8c978a', x, 1.18, 0, 10);
    cylinder(castle, .49, .43, .23, '#b4bca9', x, 2.22, 0, 10);
    for (let i = 0; i < 8; i++) box(castle, .16, .25, .17, '#a9b5a3', x + Math.cos(i / 8 * Math.PI * 2) * .36, 2.45, Math.sin(i / 8 * Math.PI * 2) * .36);
    mesh(castle, arch(.22, .54, .035), mat('#44554d'), x, 1.30, .40);
  }
  cylinder(castle, .49, .66, 3.18, '#829083', 0, 1.67, -.30, 8);
  cylinder(castle, .67, .54, .22, '#b3bba8', 0, 3.19, -.30, 8);
  for (let i = 0; i < 8; i++) box(castle, .20, .30, .20, '#aeb9a7', Math.cos(i / 8 * Math.PI * 2) * .52, 3.43, -.3 + Math.sin(i / 8 * Math.PI * 2) * .52);
  mesh(castle, arch(.94, 1.35, .09), mat('#364b44'), 0, .16, .624);
  const head = group(0, 1.43, .85, castle);
  const skull = sphere(head, .63, '#a5ad99'); skull.scale.set(1, .76, .62);
  const muzzle = sphere(head, .46, '#c8c7a9', 0, -.23, .33); muzzle.scale.set(1.12, .57, .60);
  for (const sign of [-1, 1]) {
    const brow = box(head, .43, .15, .20, '#7f8e7f', sign * .3, .12, .43); brow.rotation.z = sign * .32;
    const eye = sphere(head, .09, '#dba946', sign * .25, .0, .43); eye.scale.z = .3;
    const horn = mesh(head, new T.ConeGeometry(.13, .47, 12), mat('#e9e2c2'), sign * .59, .40, .03); horn.rotation.z = -sign * .45;
    const tooth = mesh(head, new T.ConeGeometry(.08, .16, 8), mat('#f3e7c2'), sign * .24, -.39, .42); tooth.rotation.z = Math.PI;
  }
  for (let i = 0; i < 6; i++) box(root, 1.05, .115, .31, '#d6d7c6', -1.2, .70 - i * .10, -1.10 + i * .28);
  for (const x of [-1.8, -.6]) box(root, .11, .70, 1.9, '#bcc4b3', x, .47, -.35);

  // Terraces mimic the distinctive layered landscape in the supplied picture.
  const hills = group(2.45, .09, -1.45);
  const terraces = [
    {w:4.4,d:3.6,h:.83,x:0,z:0}, {w:3.75,d:3.05,h:.78,x:.22,z:-.19},
    {w:2.95,d:2.45,h:.77,x:.54,z:-.43}, {w:1.95,d:1.78,h:.80,x:.82,z:-.70},
    {w:1.15,d:1.07,h:.87,x:1.0,z:-.9},
  ];
  let y = 0;
  terraces.forEach((t, n) => {
    slab(hills, t.w, t.d, t.h, n % 2 ? '#d8a46f' : '#dcb47d', t.x, y, t.z, .16);
    // Subtle soil strata and staggered masonry joints, rather than noisy textures.
    for (let row = 1; row < 3; row++) {
      box(hills, t.w - .24, .027, .014, '#bf915f', t.x, y + row * t.h / 3, t.z + t.d / 2 + .015);
      const count = Math.floor(t.w / .38);
      for (let col = 0; col < count; col++) box(hills, .019, .20, .018, '#c18f59', t.x - t.w / 2 + .19 + col * .38 + (row % 2) * .13, y + (row - .48) * t.h / 3, t.z + t.d / 2 + .018);
    }
    y += t.h; slab(hills, t.w + .06, t.d + .06, .12, '#6ba63f', t.x, y, t.z, .20); y += .12;
  });
  // Small white clouds embedded in the highest terrace face.
  for (const [cx, cy, cz, s] of [[3.48,4.5,-1.90,.24],[3.32,3.82,-1.50,.18],[2.4,2.15,.0,.16]] as const) {
    const cloud = group(cx, cy, cz); for (let i = 0; i < 3; i++) sphere(cloud, s, '#f3eee0', (i-1)*s*1.1, i===1?s*.32:0, 0);
  }
  const flag = cylinder(root, .021, .025, .67, '#f0eee0', 3.45, 5.1, -2.35, 8);
  box(root, .31, .17, .02, '#e45045', 3.6, 5.3, -2.35);

  function tree(x: number, y: number, z: number, size = 1) {
    const g = group(x, y, z); g.scale.setScalar(size);
    cylinder(g, .13, .19, 1.05, '#ab774b', 0, .51);
    sphere(g, .55, '#55a64d', 0, 1.32); sphere(g, .40, '#69b64d', -.33, 1.16, .05); sphere(g, .38, '#4d9b41', .36, 1.18, -.03);
    for (const [x, y, z] of [[.25,1.38,.45],[-.27,1.17,.42],[0,1.62,.40]] as const) sphere(g, .095, '#df6251', x, y, z);
  }
  tree(3.84, 1.00, .24, .90); tree(3.38, 2.66, -1.92, .70); tree(1.15, .16, .53, .64); tree(-4.3, .12, -2.44, .76);
  // A few specific park details keep the layered hill from becoming a generic stack.
  box(root,.74,.64,.11,'#de4b3f',2.6,2.12,.21);
  box(root,.45,.57,.13,'#458aaf',1.17,1.38,.41);
  sphere(root,.037,'#e8d9ad',2.84,2.10,.28);
  const thwomp=group(3.48,3.18,-1.11);
  box(thwomp,.62,.70,.20,'#768787');box(thwomp,.50,.58,.025,'#b6c2b6',0,0,.12);
  for(const s of [-1,1]) {
    const eyebrow=box(thwomp,.19,.07,.055,'#526764',s*.13,.10,.155);eyebrow.rotation.z=s*.29;
    box(thwomp,.09,.08,.04,'#f2ecda',s*.12,.025,.17);
    box(thwomp,.031,.06,.05,'#374f49',s*.10,.027,.20);
    const spike=mesh(thwomp,new T.ConeGeometry(.08,.16,4),mat('#9caca4'),s*.34,.14,.0);spike.rotation.z=-s*Math.PI/2;
  }
  box(thwomp,.27,.12,.04,'#56685f',0,-.17,.15);
  for(let i=0;i<3;i++)box(thwomp,.06,.045,.018,'#f0e6d0',-.09+i*.09,-.14,.181);
  for(let i=0;i<4;i++) {
    const b=group(.62+i*.29,2.24,.24);box(b,.25,.25,.20,'#dda260');
    box(b,.22,.025,.012,'#b27548',0,0,.106);box(b,.022,.11,.012,'#b27548',-.045,.069,.106);
  }

  function pipe(x: number, y: number, z: number, h: number, r = .34) {
    const g = group(x, y, z);
    const green = mat('#36a873', .39);
    mesh(g, new T.CylinderGeometry(r, r, h, 32), green, 0, h / 2);
    mesh(g, new T.CylinderGeometry(r * 1.18, r * 1.18, .18, 32), green, 0, h);
    mesh(g, new T.CylinderGeometry(r * .82, r * .82, .019, 32), mat('#235a43'), 0, h + .098);
    mesh(g, new T.TorusGeometry(r, .075, 10, 32), green, 0, h + .095).rotation.x = Math.PI/2;
    return g;
  }
  pipe(4.5, .12, 2.38, 1.0, .43); pipe(1.5, .12, 1.55, .82, .34); pipe(-4.17, .1, -1.26, 1.04, .35);
  pipe(2.55, 1.05, -.04, .43, .24);
  const plant = group(-4.17, 1.37, -1.26);
  const headPlant = sphere(plant, .39, '#e35244', 0, .32, 0); headPlant.rotation.z=-.3;
  for (let i = 0; i < 7; i++) { const angle = i / 7 * Math.PI * 2; sphere(plant, .065, '#f4e8d4', Math.cos(angle)*.28,.32+Math.sin(angle)*.28,.24); }
  const mouth = sphere(plant, .29, '#f5ecd8', .14, .3, .23); mouth.scale.set(1,.39,.75); mouth.rotation.z=-.2;
  cylinder(plant,.055,.06,.6,'#408451',0,-.15);

  // Foreground question block, with an embossed mark and four corner rivets.
  const block = parts.block = group(2.52, 1.22, 2.1); block.userData.part = 'block';
  slab(root, 2.8, 1.3, .52, '#bf714d', 2.5, .1, 2.02, .1);
  slab(root, 2.86, 1.36, .07, '#6c9e40', 2.5, .62, 2.02, .12);
  box(block,.85,.85,.85,'#efa840');
  box(block,.75,.75,.03,'#ffc45b',0,0,.44);
  plaque(block,'?',.56,.64,0,.015,.461,'#ffc45b','#fff5ce');
  for(const x of [-.32,.32]) for(const yy of [-.32,.32]) sphere(block,.032,'#bd8638',x,yy,.462);
  const coin = group(0, .74, 0, block); coin.visible = false;
  const gold = mat('#fbc652', .25);
  const coinDisc = mesh(coin,new T.CylinderGeometry(.24,.24,.075,32),gold); coinDisc.rotation.x=Math.PI/2;
  const coinRim = mesh(coin,new T.TorusGeometry(.18,.025,8,32),mat('#fff0a6')); coinRim.position.z=.045;
  box(coin,.035,.21,.025,'#fff0a6',0,0,.06);
  for(let i=0;i<3;i++) { const small = cylinder(root,.10,.10,.045,'#f2ce5b',1.58+i*.3,2.08,.22);small.rotation.x=Math.PI/2; }

  // Foreground lamps, planted borders and a tiny picnic table ground the scale.
  function lamp(x:number,z:number) {
    const g=group(x,.14,z);cylinder(g,.04,.07,1.2,'#81c2ba',0,.6);cylinder(g,.15,.21,.08,'#79b5ac',0,.09);
    sphere(g,.17,'#f4ead3',0,1.26);cylinder(g,.02,.20,.23,'#8bc8c0',0,1.47);
  }
  lamp(-.55,2.80);lamp(4.95,1.1);lamp(-4.9,2.75);
  for(const [x,z] of [[-1.65,2.7],[-1.4,2.85],[.8,3.15],[4.95,-.5],[-4.85,-.7]] as const) {
    sphere(root,.22,'#668955',x,.21,z);sphere(root,.18,'#80a05f',x+.2,.20,z+.1);
  }
  const table=group(-2.60,.12,3.07);cylinder(table,.35,.35,.065,'#e8d4a5',0,.40);cylinder(table,.045,.065,.38,'#95724f',0,.20);
  for(const x of [-.54,.54]){cylinder(table,.19,.19,.06,'#e5b582',x,.26);cylinder(table,.025,.045,.24,'#95724f',x,.12);}
  for (let i=0;i<5;i++) box(root,.29,.025,.38,'#f5efdd',-.35,.18,1.2+i*.49);

  const companionHome = new T.Vector3(.62,.9,2.4);
  const anchors = {cafe: new T.Vector3(-3.05, 2.76, 1.2), castle: new T.Vector3(-1.2,3.66,-2.25), block: new T.Vector3(2.52,1.83,2.1)};
  return { root, parts, coin, door, glass, anchors, companionHome };
}
