/* Small articulated chicTrip companions, sharing the town renderer and lights. */
(() => {
  window.installTownWalkers = async (app, T) => {
    const loaded = await app.ready;
    if (!loaded || app.state.disposed) return;
    const { Group, Mesh, SphereGeometry, PlaneGeometry, BufferGeometry,
      Float32BufferAttribute, MeshStandardMaterial, ShaderMaterial } = T;
    const paths = window.TownWalkerPaths;
    const root = new Group();
    root.name = 'chicTrip walking companions';
    // Keep the editor's nine town children intact.
    app.state.scene.add(root);
    const geometries = new Set(), materials = new Set(), cleanups = [];
    const ownGeometry = (g) => (geometries.add(g), g);
    const material = (color) => {
      const m = new MeshStandardMaterial({ color, roughness: .88, metalness: 0 });
      materials.add(m);
      return m;
    };
    const yellow = material('#ffc619'), teal = material('#06a9c8');
    const white = material('#fff8e5'), ink = material('#282221'), sole = material('#856045');
    const gold = material('#edbd70');
    const sphere = ownGeometry(new SphereGeometry(1, 16, 12));
    const shadowGeometry = ownGeometry(new PlaneGeometry(.95, .72));
    const shadowMaterial = new ShaderMaterial({
      transparent: true, depthWrite: false,
      vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
      fragmentShader: 'varying vec2 vUv; void main(){float a=1.-smoothstep(.08,.5,length(vUv-.5));gl_FragColor=vec4(.16,.21,.20,a*.22);}',
    });
    materials.add(shadowMaterial);

    // A rounded triangular prism preserves the mascot's arrow-shaped face.
    // Three bevel rings soften its silhouette without a downloaded model.
    const corners = [[-.34, .34], [-.34, -.29], [.46, .015]];
    const outline = [];
    for (let i = 0; i < corners.length; i++) {
      const p = corners[i], before = corners[(i + 2) % 3], after = corners[(i + 1) % 3];
      const a = p.map((v, k) => v * .78 + before[k] * .22);
      const b = p.map((v, k) => v * .78 + after[k] * .22);
      for (let j = 0; j <= 5; j++) {
        const u = j / 5;
        outline.push(a.map((v, k) => (1 - u) ** 2 * v + 2 * (1 - u) * u * p[k] + u ** 2 * b[k]));
      }
    }
    const positions = [], indices = [], count = outline.length;
    for (const [scale, z] of [[.86, -.18], [1, -.12], [1, .12], [.86, .18]]) {
      for (const [x, y] of outline) positions.push(x * scale, y * scale, z);
    }
    for (let ring = 0; ring < 3; ring++) for (let i = 0; i < count; i++) {
      const a = ring * count + i, b = ring * count + (i + 1) % count;
      indices.push(a, b, b + count, a, b + count, a + count);
    }
    positions.push(0, 0, -.18, 0, 0, .18);
    for (let i = 0; i < count; i++) {
      indices.push(count * 4, (i + 1) % count, i);
      indices.push(count * 4 + 1, count * 3 + i, count * 3 + (i + 1) % count);
    }
    const faceGeometry = ownGeometry(new BufferGeometry());
    faceGeometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    faceGeometry.setIndex(indices);
    faceGeometry.computeVertexNormals();

    function oval(parent, mat, size, at) {
      const mesh = new Mesh(sphere, mat);
      mesh.scale.set(...size); mesh.position.set(...at);
      mesh.receiveShadow = true;
      parent.add(mesh);
      return mesh;
    }
    function companion(index, row, distance) {
      const outfit = material(['#243f68', '#237e76', '#6e537e'][index % 3]);
      const hat = material(['#ec4742', '#e6a850', '#588c78'][index % 3]);
      const group = new Group(), body = new Group();
      group.name = `去趣散步旅伴 ${index + 1}`;
      group.scale.setScalar(.86);
      group.add(body); root.add(group);
      oval(body, teal, [.23, .27, .17], [0, .57, 0]);
      oval(body, outfit, [.25, .20, .19], [0, .41, .015]);
      oval(body, outfit, [.17, .13, .035], [0, .55, .16]);
      for (const x of [-.145, .145]) {
        oval(body, outfit, [.032, .13, .025], [x, .65, .14]);
        oval(body, gold, [.033, .033, .017], [x, .60, .177]);
      }
      const head = new Group(); head.position.y = .94; body.add(head);
      const face = new Mesh(faceGeometry, yellow); face.receiveShadow = true; head.add(face);
      oval(head, teal, [.09, .32, .20], [-.30, .015, -.025]);
      for (const x of [-.235, .015]) {
        oval(head, white, [.105, .14, .067], [x, .14, .185]);
        oval(head, ink, [.039, .052, .025], [x + .014, .148, .246]);
        oval(head, white, [.012, .016, .009], [x + .006, .169, .267]);
      }
      oval(head, hat, [.28, .095, .235], [-.11, .33, 0]);
      oval(head, hat, [.255, .026, .19], [-.10, .29, .19]);
      oval(head, white, [.047, .044, .015], [-.11, .343, .219]);
      const arms = [], legs = [];
      for (const side of [-1, 1]) {
        const arm = new Group(); arm.position.set(side * .255, .62, 0); body.add(arm);
        oval(arm, yellow, [.065, .145, .07], [side * .025, -.10, 0]);
        oval(arm, yellow, [.081, .09, .075], [side * .032, -.23, .015]);
        arms.push(arm);
        const leg = new Group(); leg.position.set(side * .12, .28, 0); body.add(leg);
        oval(leg, yellow, [.058, .095, .063], [0, -.085, 0]);
        oval(leg, sole, [.097, .032, .13], [0, -.244, .03]);
        oval(leg, white, [.095, .061, .128], [0, -.202, .03]);
        legs.push(leg);
      }
      const shadow = new Mesh(shadowGeometry, shadowMaterial);
      shadow.rotation.x = -Math.PI / 2; shadow.position.y = .157;
      root.add(shadow);
      return { group, body, arms, legs, shadow, row, distance, speed: .48 + (index % 3) * .055 };
    }
    const walkers = Array.from({ length: 6 }, (_, i) => companion(i, Math.floor(i / 2) - 1,
      [7, 30, 19, 48, 12, 39][i]));
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    let paused = motion.matches, disposed = false;
    const button = document.createElement('button');
    button.id = 'town-walkers-toggle'; button.type = 'button';
    button.title = '六位去趣小旅伴沿著小鎮步道散步';
    document.querySelector('.editor-toolbar').prepend(button);
    function blocked() { return document.body.classList.contains('town-is-editing'); }
    function label() {
      button.textContent = paused ? '開始散步' : '暫停散步';
      button.setAttribute('aria-pressed', String(!paused));
      button.disabled = blocked();
    }
    function on(target, type, handler) {
      target.addEventListener(type, handler);
      cleanups.push(() => target.removeEventListener(type, handler));
    }
    on(button, 'click', () => { paused = !paused; label(); app.invalidate(); });
    on(motion, 'change', () => { paused = motion.matches; label(); app.invalidate(); });
    const editing = new MutationObserver(() => { label(); app.invalidate(); });
    editing.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    const panel = document.querySelector('.sky-controls');
    const size = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--town-controls-height', `${panel.offsetHeight}px`);
    });
    size.observe(panel);
    function update(delta) {
      if (disposed) return false;
      const isEditing = blocked();
      root.visible = !isEditing;
      const active = !paused && !isEditing && !window.TownAstronomy?.state.skyView;
      for (const walker of walkers) {
        if (active) walker.distance += delta * walker.speed;
        const point = paths.sample(walker.distance, walker.row);
        walker.group.position.set(point.x, .154, point.z);
        walker.group.rotation.y = point.heading;
        const phase = walker.distance * Math.PI * 2 / .62;
        const swing = active ? Math.sin(phase) * .43 : 0;
        walker.body.position.y = active ? (1 - Math.cos(phase * 2)) * .009 : 0;
        walker.legs[0].rotation.x = swing; walker.legs[1].rotation.x = -swing;
        walker.arms[0].rotation.x = -swing * .8; walker.arms[1].rotation.x = swing * .8;
        walker.shadow.position.x = point.x; walker.shadow.position.z = point.z;
      }
      return active;
    }
    function dispose() {
      if (disposed) return;
      disposed = true; editing.disconnect(); size.disconnect(); cleanups.forEach((fn) => fn());
      document.documentElement.style.removeProperty('--town-controls-height');
      app.state.scene.remove(root); button.remove();
      geometries.forEach((g) => g.dispose()); materials.forEach((m) => m.dispose());
    }
    on(window, 'pagehide', dispose);
    window.TownWalkers = { update, dispose,
      get state() { return { paused, editing: blocked(), visible: root.visible,
        walkers: walkers.map((w) => ({ row: w.row, distance: w.distance,
          position: w.group.position.toArray(), heading: w.group.rotation.y, gait: w.legs[0].rotation.x })) }; },
    };
    update(0); label(); app.invalidate();
  };
})();
