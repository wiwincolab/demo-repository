/* Editing adapter for the supplied, bundled Travel Town scene. No extra renderer. */
(() => {
  const KEY = 'chictrip:town-layout:v1';
  const CHANNEL = 'chictrip-town-layout-v1';
  const valid = (order) => Array.isArray(order) && order.length === 9 &&
    order.every((id) => Number.isInteger(id) && id >= 0 && id < 9) && new Set(order).size === 9;

  window.installTownEditor = async (app, THREE) => {
    const { Vector3, Ray, Box3, Mesh, PlaneGeometry, MeshBasicMaterial, tiles } = THREE;
    const panel = document.createElement('section');
    panel.className = 'town-editor';
    panel.setAttribute('aria-label', '小鎮排列');
    panel.innerHTML = `
      <div class="editor-toolbar">
        <button id="town-edit" type="button" disabled aria-pressed="false">✥ 編輯小鎮</button>
        <button id="town-undo" type="button" hidden disabled>↶ 上一步</button>
        <button id="town-restore" type="button" hidden>原始排列</button>
      </div>
      <div id="town-edit-guide" hidden>
        <strong>把喜歡的風景，放在一起</strong>
        <p>拖動景點，放開交換位置。也可依序點選兩格。</p>
        <div id="town-layout-grid" role="group" aria-label="九宮格排列：先選景點，再選交換位置"></div>
        <p class="editor-footnote">固定九宮格 · 不旋轉街區 · Esc 取消選取</p>
      </div>
      <p id="town-edit-status" role="status" aria-live="polite">正在準備編輯工具…</p>`;
    document.body.append(panel);
    const $ = (id) => document.getElementById(id);
    const edit = $('town-edit'), undo = $('town-undo'), restore = $('town-restore');
    const guide = $('town-edit-guide'), grid = $('town-layout-grid'), status = $('town-edit-status');
    let order = Array.from({ length: 9 }, (_, i) => i);
    let editing = false, selected = null, gesture = null, disposed = false, touched = false;
    const history = [], cleanups = [];
    const on = (target, type, handler, options) => {
      target.addEventListener(type, handler, options);
      cleanups.push(() => target.removeEventListener(type, handler, options));
    };
    const say = (text) => { status.textContent = text; };
    const loaded = await app.ready;
    if (!loaded || disposed || app.state.disposed) {
      say('模型載入完成後才能編輯；若載入失敗，請重新整理。');
      return;
    }
    const state = app.state;
    const { scene, camera, controls, renderer, townData } = state;
    const canvas = renderer.domElement;
    const slots = tiles.map(({ x, z }) => ({ x, z }));
    const blocks = [...townData.town.children];
    const lampByTile = slots.map((slot) => scene.children.find((item) => item.isPointLight &&
      Math.abs(item.position.x - slot.x) < .01 && Math.abs(item.position.z - slot.z - 3.6) < .01));
    const marker = (color) => {
      const mesh = new Mesh(new PlaneGeometry(11.8, 11.8), new MeshBasicMaterial({
        color, transparent: true, opacity: .35, depthTest: false, depthWrite: false,
        toneMapped: false,
      }));
      mesh.rotation.x = -Math.PI / 2;
      mesh.renderOrder = 100;
      mesh.visible = false;
      scene.add(mesh);
      return mesh;
    };
    const originMarker = marker('#ffe1a0'), targetMarker = marker('#43d5b1');
    const ray = new Ray();
    const originalHelp = document.querySelector('.controls .help').textContent;
    const buttons = order.map((_, slot) => {
      const button = document.createElement('button');
      button.type = 'button';
      on(button, 'click', () => choose(slot));
      grid.append(button);
      return button;
    });
    function drawGrid() {
      buttons.forEach((button, slot) => {
        const id = order[slot];
        button.textContent = `${slot + 1} ${tiles[id].short}`;
        button.setAttribute('aria-label', `第 ${slot + 1} 格，${tiles[id].name}${selected === id ? '，已選取' : ''}`);
        button.setAttribute('aria-pressed', String(selected === id));
      });
      undo.disabled = history.length === 0;
      restore.disabled = order.every((id, slot) => id === slot);
    }
    function showMarker(mesh, slot) {
      mesh.visible = editing && slot !== null;
      if (slot !== null) mesh.position.set(slots[slot].x, .2, slots[slot].z);
    }
    function redraw() {
      townData.town.updateMatrixWorld(true);
      state.key.shadow.needsUpdate = true;
      state.moonlight.shadow.needsUpdate = true;
      renderer.shadowMap.needsUpdate = true;
      app.invalidate();
    }
    function applyLayout() {
      order.forEach((id, slot) => {
        const { x, z } = slots[slot];
        blocks[id].position.set(x, 0, z);
        tiles[id].x = x;
        tiles[id].z = z;
        lampByTile[id]?.position.set(x, 1.75, z + 3.6);
      });
      townData.town.updateMatrixWorld(true);
      townData.bounds.copy(new Box3().setFromObject(townData.town));
      townData.tileBounds = blocks.map((block) => new Box3().setFromObject(block));
      drawGrid();
      redraw();
    }
    function persist() {
      touched = true;
      if (window.parent !== window) {
        window.parent.postMessage({ channel: CHANNEL, type: 'save', order: [...order] }, '*');
      } else {
        try { localStorage.setItem(KEY, JSON.stringify(order)); say('排列已儲存在這個瀏覽器。'); }
        catch { say('排列已更新；瀏覽器未允許儲存，離開後會重設。'); }
      }
    }
    function clearSelection() {
      selected = null;
      originMarker.visible = targetMarker.visible = false;
      drawGrid();
      redraw();
    }
    function swap(from, to) {
      if (from === to) return;
      history.push([...order]);
      if (history.length > 30) history.shift();
      [order[from], order[to]] = [order[to], order[from]];
      clearSelection();
      applyLayout();
      say('位置已交換，正在儲存排列…');
      persist();
    }
    function choose(slot) {
      if (!editing || gesture) return;
      const id = order[slot];
      if (selected === null) {
        selected = id;
        showMarker(originMarker, slot);
        say(`已選取${tiles[id].short}，再選另一格就能交換。`);
        drawGrid();
        redraw();
      } else if (selected === id) {
        clearSelection();
        say('已取消選取。');
      } else swap(order.indexOf(selected), slot);
    }
    function setRay(event) {
      const rect = canvas.getBoundingClientRect();
      camera.updateMatrixWorld();
      ray.origin.copy(camera.position);
      ray.direction.set((event.clientX - rect.left) / rect.width * 2 - 1,
        -(event.clientY - rect.top) / rect.height * 2 + 1, .5)
        .unproject(camera).sub(ray.origin).normalize();
    }
    function hitTile(event) {
      setRay(event);
      townData.town.updateMatrixWorld(true);
      const caster = { ray, near: 0, far: Infinity, camera, params: { Mesh: {} } };
      let nearest = Infinity, tile = null;
      blocks.forEach((block, id) => block.traverseVisible((mesh) => {
        if (!mesh.isMesh) return;
        const hits = [];
        mesh.raycast(caster, hits);
        for (const hit of hits) if (hit.distance < nearest) { nearest = hit.distance; tile = id; }
      }));
      return tile;
    }
    function groundPoint(event) {
      setRay(event);
      if (Math.abs(ray.direction.y) < 1e-6) return null;
      const distance = -ray.origin.y / ray.direction.y;
      return distance > 0 ? ray.at(distance, new Vector3()) : null;
    }
    function slotAt(point) {
      if (!point) return null;
      const col = Math.floor((point.x + 18) / 12), row = Math.floor((point.z + 18) / 12);
      return col >= 0 && col < 3 && row >= 0 && row < 3 ? row * 3 + col : null;
    }
    function stopGesture(commit, event) {
      if (!gesture) return;
      const active = gesture;
      if (event && active.moved) moveGesture(event);
      gesture = null;
      if (canvas.hasPointerCapture(active.pointerId)) canvas.releasePointerCapture(active.pointerId);
      canvas.classList.remove('is-dragging');
      targetMarker.visible = false;
      applyLayout();
      if (commit && active.moved && active.target !== null && active.target !== active.from) {
        swap(active.from, active.target);
      } else if (commit && !active.moved) {
        choose(active.from);
      } else {
        clearSelection();
        say(commit ? '已放回原位；請拖到九宮格內交換。' : '已取消移動，方塊回到原位。');
      }
    }
    function moveGesture(event) {
      if (!gesture || gesture.pointerId !== event.pointerId) return;
      const g = gesture;
      if (!g.moved && Math.hypot(event.clientX - g.startX, event.clientY - g.startY) < 7) return;
      if (!g.moved) {
        g.moved = true;
        selected = g.id;
        showMarker(originMarker, g.from);
        drawGrid();
        canvas.classList.add('is-dragging');
      }
      const point = groundPoint(event);
      if (!point) { g.target = null; targetMarker.visible = false; return; }
      const position = point.sub(g.offset);
      g.target = slotAt(position);
      blocks[g.id].position.set(position.x, .9, position.z);
      showMarker(targetMarker, g.target);
      redraw();
    }
    on(canvas, 'pointerdown', (event) => {
      if (!editing) return;
      event.stopImmediatePropagation();
      event.preventDefault();
      if (gesture) { stopGesture(false); return; }
      if (!event.isPrimary || event.button !== 0) return;
      const id = hitTile(event), point = groundPoint(event);
      if (id === null || !point) { clearSelection(); return; }
      canvas.focus({ preventScroll: true });
      gesture = { id, from: order.indexOf(id), pointerId: event.pointerId,
        startX: event.clientX, startY: event.clientY, moved: false, target: null,
        offset: point.sub(blocks[id].position) };
      canvas.setPointerCapture(event.pointerId);
    }, true);
    on(canvas, 'pointermove', (event) => {
      if (!editing) return;
      event.stopImmediatePropagation();
      if (gesture) { event.preventDefault(); moveGesture(event); }
    }, true);
    on(canvas, 'pointerup', (event) => {
      if (!editing) return;
      event.stopImmediatePropagation();
      if (gesture?.pointerId === event.pointerId) stopGesture(true, event);
    }, true);
    on(canvas, 'pointercancel', () => stopGesture(false));
    on(canvas, 'lostpointercapture', () => stopGesture(false));
    on(window, 'blur', () => stopGesture(false));
    // The host iframe and its canvas can resize in consecutive frames. Repaint
    // once both have settled, including when camera controls are disabled.
    let resizeFrame = 0;
    on(window, 'resize', () => {
      stopGesture(false);
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = requestAnimationFrame(() => { if (!disposed) app.invalidate(); });
      });
    });
    cleanups.push(() => cancelAnimationFrame(resizeFrame));
    on(document, 'visibilitychange', () => { if (document.hidden) stopGesture(false); });
    on(document, 'keydown', (event) => {
      if (!editing) return;
      if (event.key === 'Escape') { event.preventDefault(); stopGesture(false); clearSelection(); }
      if (event.target === canvas) event.stopImmediatePropagation();
    }, true);
    function toggleEditing() {
      stopGesture(false);
      editing = !editing;
      clearSelection();
      controls.enabled = !editing;
      document.body.classList.toggle('town-is-editing', editing);
      edit.textContent = editing ? '✓ 完成排列' : '✥ 編輯小鎮';
      edit.setAttribute('aria-pressed', String(editing));
      guide.hidden = undo.hidden = restore.hidden = !editing;
      $('atlas').classList.remove('open');
      $('atlas-toggle').setAttribute('aria-expanded', 'false');
      app.refit();
      document.querySelector('.controls .help').textContent = editing
        ? '拖動景點交換位置 · 點選兩格也能交換 · 完成後可旋轉欣賞' : originalHelp;
      say(editing ? '拖動一個景點，或用九宮格選取兩格交換。' : '排列完成！拖曳旋轉，看看你的小鎮。');
      canvas.setAttribute('aria-label', editing ? '編輯小鎮：拖動街區交換位置，也可使用九宮格按鈕操作' : '3D 小鎮：拖曳旋轉、滾輪縮放，方向鍵旋轉，加減鍵縮放');
      redraw();
    }
    on(edit, 'click', toggleEditing);
    on(undo, 'click', () => {
      if (!history.length) return;
      stopGesture(false);
      order = history.pop();
      clearSelection(); applyLayout(); persist();
    });
    on(restore, 'click', () => {
      stopGesture(false);
      history.push([...order]);
      order = Array.from({ length: 9 }, (_, i) => i);
      clearSelection(); applyLayout(); persist();
    });
    on(window, 'message', (event) => {
      if (event.source !== window.parent || event.data?.channel !== CHANNEL) return;
      if (event.data.type === 'load' && !touched && valid(event.data.order)) {
        order = [...event.data.order]; applyLayout(); app.refit();
        say('已還原你上次的小鎮排列。');
      } else if (event.data.type === 'saved') {
        say(event.data.ok ? '排列已儲存在這個瀏覽器。' : '排列已更新；瀏覽器未允許儲存，離開後會重設。');
      }
    });
    if (window.parent !== window) {
      window.parent.postMessage({ channel: CHANNEL, type: 'load' }, '*');
    } else {
      try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (valid(saved)) { order = saved; applyLayout(); app.refit(); }
      } catch { /* A missing, malformed, or unavailable save starts with the original layout. */ }
    }
    drawGrid();
    edit.disabled = false;
    say('試試重新排列，打造你的小鎮。');
    on(window, 'pagehide', (event) => {
      if (event.persisted) { stopGesture(false); return; }
      disposed = true;
      for (const cleanup of cleanups) cleanup();
      for (const mesh of [originMarker, targetMarker]) {
        scene.remove(mesh); mesh.geometry.dispose(); mesh.material.dispose();
      }
      panel.remove();
    });
  };
})();
