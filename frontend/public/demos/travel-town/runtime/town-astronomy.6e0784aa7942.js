/* Real observer/time adapter for the supplied town renderer. No network at runtime. */
(() => {
  const Core = globalThis.TownSkyCore, A = globalThis.Astronomy;
  const DISTANCE = 100;
  const OVERVIEW_DISTANCE = 30;
  const PLAYBACK_MINUTES_PER_SECOND = 30;
  let location = Core.locations[0], instant = new Date(), live = true;
  let snapshot = Core.sample(A, location, instant), version = 0;
  let app, THREE, disposed = false, skyView = false, timer, viewOffset = -1;
  let playing = false, playbackElapsed = 0, playbackEnd, playButton;
  const cleanups = [], eventCache = new Map();
  const $ = id => document.getElementById(id);
  const on = (target, event, handler, options) => {
    target.addEventListener(event, handler, options);
    cleanups.push(() => target.removeEventListener(event, handler, options));
  };
  const local = () => Core.localParts(instant, location.timeZone);
  function dayEvents() {
    const date = local().date, key = `${location.id}:${date}`;
    if (!eventCache.has(key)) {
      if (eventCache.size > 32) eventCache.clear();
      eventCache.set(key, Core.events(A, location, date));
    }
    return eventCache.get(key);
  }

  function sync() {
    if (!$('sky-location')) return;
    const p = local(), events = dayEvents();
    $('sky-location').value = location.id;
    if (document.activeElement !== $('sky-date')) $('sky-date').value = p.date;
    $('time').textContent = p.time;
    $('daynight').value = String(p.minutes);
    $('daynight').setAttribute('aria-valuetext', `${p.date} ${p.time}，${location.city}當地時間`);
    $('sky-mode').textContent = live ? '跟隨現在' : '時間預覽';
    if (playing) $('sky-mode').textContent = '日夜播放';
    if (playButton) {
      playButton.textContent = playing ? '暫停播放' : '播放日夜';
      playButton.setAttribute('aria-pressed', String(playing));
    }
    $('sky-live').setAttribute('aria-pressed', String(live));
    $('sky-observer').textContent = `${location.city} · ${snapshot.label}`;
    const bodyInfo = (name, body) => `${name} ${body.visible ? `方位 ${body.azimuth.toFixed(1)}°／高度 ${body.altitude.toFixed(1)}°` : '地平線下'}`;
    $('sky-bodies').textContent = `${bodyInfo('太陽', snapshot.sun)} · ${bodyInfo('月亮', snapshot.moon)}`;
    $('sky-phase').textContent = `${snapshot.phaseName} · 月面照亮 ${(snapshot.illuminatedFraction * 100).toFixed(1)}%`;
    const keys = { day: 'sunrise', dusk: 'noon', night: 'sunset', 'sky-moonrise': 'moonrise', 'sky-moonset': 'moonset' };
    const labels = { sunrise: '日出', noon: '正午', sunset: '日落', moonrise: '月出', moonset: '月落' };
    const ready = !!app?.state.townData;
    for (const [id, key] of Object.entries(keys)) {
      const date = events[key], button = $(id);
      button.disabled = !ready || !date;
      button.title = date ? `${labels[key]} ${Core.localParts(date, location.timeZone).time}` : `當天沒有${labels[key]}`;
    }
    $('sky-sun-view').disabled = !ready || !snapshot.sun.visible;
    $('sky-moon-view').disabled = !ready || snapshot.sun.visible || !snapshot.moon.visible;
    $('sky-events').textContent = Object.entries(events).map(([key, date]) =>
      `${labels[key]} ${date ? Core.localParts(date, location.timeZone).time : '當天無'}`).join(' · ');
    $('sky-coordinates').textContent = `${location.latitude.toFixed(5)}°N, ${location.longitude.toFixed(5)}°E · ${location.timeZone}`;
    $('sky-location-source').href = location.source;
  }

  function refresh() {
    if (disposed) return;
    if (live) instant = new Date();
    const previousVisible = snapshot.sun.visible || snapshot.moon.visible;
    snapshot = Core.sample(A, location, instant);
    version++;
    sync();
    if (skyView && app?.state.townData) {
      if (snapshot[skyView].visible && (skyView !== 'moon' || !snapshot.sun.visible)) viewBody(skyView);
      else app.refit();
    } else if (!playing && app?.state.townData && previousVisible !== (snapshot.sun.visible || snapshot.moon.visible)) {
      app.refit();
    }
    app?.invalidate();
  }
  function restoreView() {
    skyView = false;
    if (app?.state.controls) {
      app.state.controls.minPolarAngle = .12;
      app.state.controls.maxPolarAngle = Math.PI * .485;
    }
  }
  function selectTile(index) {
    stopPlayback();
    restoreView();
    if (Core.locations[index]) { location = Core.locations[index]; refresh(); }
  }
  function setMinutes(minutes) {
    if (!Number.isFinite(minutes)) return;
    stopPlayback();
    live = false;
    instant = Core.dateFromLocal(local().date, Core.clamp(Math.round(minutes), 0, 1439), location.timeZone);
    refresh();
  }
  function goEvent(key) {
    const date = dayEvents()[key];
    if (!date) return;
    stopPlayback();
    live = false;
    instant = new Date(date);
    refresh();
  }

  function stopPlayback() { playing = false; playbackElapsed = 0; }
  function togglePlayback() {
    if (playing) { stopPlayback(); app.refit(); sync(); app.invalidate(); return; }
    live = false;
    const p = local();
    if (p.minutes >= 1439) instant = Core.dateFromLocal(p.date, 0, location.timeZone);
    playbackEnd = Core.dateFromLocal(local().date, 1439, location.timeZone);
    playing = true; playbackElapsed = 0;
    app.refit(); refresh();
  }
  function advance(delta) {
    if (!playing || disposed) return false;
    if (document.body.classList.contains('town-is-editing')) { stopPlayback(); sync(); return false; }
    playbackElapsed += delta;
    if (playbackElapsed < .25) return true;
    instant = new Date(Math.min(+playbackEnd, +instant + playbackElapsed * PLAYBACK_MINUTES_PER_SECOND * 60000));
    playbackElapsed = 0;
    if (+instant >= +playbackEnd) stopPlayback();
    refresh();
    return playing;
  }
  function fitBounds(bounds) {
    if (skyView || document.body.classList.contains('town-is-editing') || (!playing && !snapshot.sun.visible && !snapshot.moon.visible)) return bounds;
    const fitted = bounds.clone(), { Vector3 } = THREE;
    fitted.expandByPoint(new Vector3(-OVERVIEW_DISTANCE, .35, -OVERVIEW_DISTANCE));
    fitted.expandByPoint(new Vector3(OVERVIEW_DISTANCE, OVERVIEW_DISTANCE + .35, OVERVIEW_DISTANCE));
    return fitted;
  }

  function frame({ Vector3, Color }) {
    const s = snapshot, d = s.daylight, n = s.night;
    const blend = (night, day, dusk) => {
      const c = new Color(night).lerp(new Color(day), d);
      return dusk ? c.lerp(new Color(dusk), s.sunset * .7) : c;
    };
    const sunAlt = s.sun.altitude;
    // Clear-sky artistic exposure: the astronomical directions are exact, but
    // display luminance is not a weather/photometric simulation.
    const airMass = sunAlt > 0 ? 1 / (Math.sin(sunAlt * Math.PI / 180) +
      .50572 * Math.pow(sunAlt + 6.07995, -1.6364)) : Infinity;
    const moonFlux = Math.pow(10, -.4 * (s.moonMagnitude + 12.74));
    const vec = v => new Vector3(v.x, v.y, v.z);
    const key = new Color('#ff8545').lerp(new Color('#fff4df'), Core.smooth(0, 25, sunAlt));
    return {
      night: n, ...s, sky: blend('#080f20', '#b9d8e9', '#e0a486'),
      zenith: blend('#040816', '#659cce', '#8a739b'),
      horizon: blend('#17233b', '#e8ebe0', '#ffd4a1'),
      ground: blend('#242e41', '#c3c9c0', '#b0a091'),
      hemi: blend('#7890b9', '#c5def7', '#d0bcd6'), key, moonColor: new Color('#dce5f7'),
      keyIntensity: sunAlt > 0 ? 4.4 * Math.exp(-.12 * (airMass - 1)) : 0,
      moonIntensity: s.moon.altitude > 0 ? .045 * moonFlux * Core.smooth(0, 15, s.moon.altitude) : 0,
      hemiIntensity: .025 + .94 * d + .12 * (1 - n) * (1 - d),
      fillIntensity: 0, environmentIntensity: .015 + .52 * d,
      exposure: .96 + .32 * n, lampPower: 13 * (1 - Core.smooth(-8, -2, s.sun.geometricAltitude)),
      sunDirection: vec(s.sun.direction), moonDirection: vec(s.moon.direction),
      sunPosition: vec(s.sun.direction).multiplyScalar(DISTANCE),
      moonPosition: vec(s.moon.direction).multiplyScalar(DISTANCE),
      sunOpacity: s.sun.visible ? 1 : 0, moonOpacity: !s.sun.visible && s.moon.visible ? 1 : 0,
    };
  }

  function prepareAtmosphere(atmosphere) {
    const { ShaderMaterial, SphereGeometry, PlaneGeometry, Color, Vector3, AdditiveBlending } = THREE;
    const vertexShader = 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}';
    const horizon = `uniform float altitude;uniform float radius;uniform vec2 horizonAxes;
      varying vec2 vUv;bool outside(vec2 p){return dot(p,p)>1.||altitude+radius*dot(horizonAxes,p)<0.;}`;
    const oldSun = atmosphere.sun.material, oldMoon = atmosphere.moon.material;
    const moonMap = oldMoon.uniforms.map.value;
    atmosphere.sun.geometry.dispose();
    atmosphere.sun.geometry = new SphereGeometry(1, 64, 40);
    atmosphere.sun.name = 'Sun_Photosphere';
    atmosphere.sun.material = new ShaderMaterial({ transparent: true, depthWrite: false, toneMapped: false,
      uniforms: { opacity: { value: 1 }, discColor: { value: new Color('#fff4df') },
        altitude: { value: 0 }, radius: { value: 0 }, displayRadius: { value: 1 }, centerY: { value: 0 } },
      vertexShader: `varying vec3 vSurface;varying vec3 vNormal;varying vec3 vDirection;varying float vWorldY;
        void main(){vSurface=normal;vNormal=mat3(modelMatrix)*normal;
        vec4 world=modelMatrix*vec4(position,1.);vDirection=world.xyz-cameraPosition;vWorldY=world.y;
        gl_Position=projectionMatrix*viewMatrix*world;}`,
      // A self-luminous photosphere, with approximate limb darkening and fine
      // procedural granulation. These are illustrative, not current solar data.
      fragmentShader: `uniform vec3 discColor;uniform float opacity;
        uniform float altitude;uniform float radius;uniform float displayRadius;uniform float centerY;
        varying vec3 vSurface;varying vec3 vNormal;varying vec3 vDirection;varying float vWorldY;
        float hash(vec3 p){return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453);}
        float noise(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
          return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),
            mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),
            mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
        void main(){vec3 ray=normalize(vDirection);if(altitude+radius*(vWorldY-centerY)/displayRadius<0.)discard;
        float mu=max(0.,dot(normalize(vNormal),-ray));
        vec3 surface=normalize(vSurface);
        float detail=1.-smoothstep(.3,1.,length(fwidth(surface*160.)));
        float grain=.96+.08*mix(.5,noise(surface*160.),detail);
        grain*=.985+.03*noise(surface*24.);
        vec3 color=discColor*(.5+.5*pow(mu,.55))*grain;
        gl_FragColor=vec4(color,opacity);
        #include <colorspace_fragment>
        }` });
    // The bundled atmosphere still copies the visual sun's color on each frame.
    atmosphere.sun.material.color = new Color();
    atmosphere.sunHalo.name = 'Sun_Atmospheric_Glow';
    atmosphere.moon.geometry.dispose();
    atmosphere.moon.geometry = new PlaneGeometry(2, 2);
    atmosphere.moon.material = new ShaderMaterial({ transparent: true, depthWrite: false,
      toneMapped: false, blending: AdditiveBlending,
      uniforms: { map: { value: moonMap }, opacity: { value: 1 }, altitude: { value: 0 }, radius: { value: 0 },
        horizonAxes: { value: { x: 0, y: 1 } }, lightDirection: { value: new Vector3() }, brightness: { value: 1 } },
      vertexShader, fragmentShader: `${horizon}uniform sampler2D map;uniform float opacity;
        uniform vec3 lightDirection;uniform float brightness;
        void main(){vec2 p=vUv*2.-1.;if(outside(p))discard;
        vec3 normal=vec3(p,sqrt(max(0.,1.-dot(p,p))));
        float lit=max(0.,dot(normal,lightDirection));
        vec3 c=texture2D(map,vUv).rgb*vec3(.87,.92,1.)*pow(lit,.65)*brightness;
        gl_FragColor=vec4(c,opacity);
        #include <colorspace_fragment>
        }` });
    oldSun.dispose(); oldMoon.dispose();
  }

  function render(atmosphere, camera) {
    if (!THREE || disposed) return;
    // Center the scene in the space above the time controls. The camera's full
    // viewport aspect and celestial bearings stay unchanged.
    const panel = document.querySelector('.sky-controls');
    const landscape = innerHeight <= 520 && innerWidth >= 721;
    const offsetX = landscape ? -Math.round((panel?.offsetWidth || 0) / 2) : 0;
    const offset = landscape ? 0 : Math.round(Math.min(innerHeight * .24, (panel?.offsetHeight || 0) / 2));
    if (offset !== viewOffset || camera.view?.offsetX !== offsetX || camera.view?.fullWidth !== innerWidth || camera.view?.fullHeight !== innerHeight) {
      camera.setViewOffset(innerWidth, innerHeight, offsetX, offset, innerWidth, innerHeight);
      viewOffset = offset;
    }
    const { Vector3 } = THREE;
    const bodies = [[atmosphere.sun, snapshot.sun], [atmosphere.moon, snapshot.moon]];
    for (const [mesh, body] of bodies) {
      const dir = new Vector3(body.direction.x, body.direction.y, body.direction.z);
      const distance = skyView ? DISTANCE : OVERVIEW_DISTANCE;
      const observer = skyView ? camera.position : new Vector3(0, .35, 0);
      mesh.position.copy(observer).addScaledVector(dir, distance);
      if (mesh === atmosphere.moon) mesh.lookAt(camera.position);
      const isSun = mesh === atmosphere.sun;
      // A sphere's silhouette subtends asin(radius / distance); the flat lunar
      // disc uses atan instead. Keep both apparent sizes astronomically correct.
      const radius = skyView ? distance * (isSun ? Math.sin(body.angularRadius) : Math.tan(body.angularRadius)) : 2.4;
      mesh.scale.set(radius, radius, isSun ? radius : 1);
      const right = new Vector3(1, 0, 0).applyQuaternion(mesh.quaternion);
      const up = new Vector3(0, 1, 0).applyQuaternion(mesh.quaternion);
      const front = new Vector3(0, 0, 1).applyQuaternion(mesh.quaternion);
      const u = mesh.material.uniforms;
      u.altitude.value = body.altitude * Math.PI / 180;
      u.radius.value = body.angularRadius;
      if (mesh === atmosphere.moon) {
        u.altitude.value = body.altitude * Math.PI / 180;
        u.radius.value = body.angularRadius;
        u.horizonAxes.value.x = right.y;
        u.horizonAxes.value.y = up.y;
        const light = new Vector3(snapshot.moonSunDirection.x, snapshot.moonSunDirection.y, snapshot.moonSunDirection.z);
        u.lightDirection.value.set(light.dot(right), light.dot(up), light.dot(front));
        if (!skyView) {
          // The overview is a magnified position marker. Preserve the true lunar
          // phase rather than inventing parallax from its display-scale distance.
          const z = 2 * snapshot.illuminatedFraction - 1;
          const xy = Math.hypot(u.lightDirection.value.x, u.lightDirection.value.y) || 1;
          const scale = Math.sqrt(Math.max(0, 1 - z * z)) / xy;
          u.lightDirection.value.set(u.lightDirection.value.x * scale, u.lightDirection.value.y * scale, z);
        }
        u.brightness.value = .85 - .5 * snapshot.daylight;
      } else {
        u.displayRadius.value = radius;
        u.centerY.value = mesh.position.y;
        u.opacity.value = body.visible ? 1 : 0;
        u.discColor.value.set('#ff9952').lerp(new THREE.Color('#fff8dc'), Core.smooth(0, 15, body.altitude));
      }
    }
    const editing = document.body.classList.contains('town-is-editing');
    atmosphere.sun.visible = !editing && snapshot.sun.visible;
    atmosphere.moon.visible = !editing && !snapshot.sun.visible && snapshot.moon.visible;
    atmosphere.sunHalo.position.copy(atmosphere.sun.position);
    const haloSize = skyView ? DISTANCE * Math.tan(snapshot.sun.angularRadius) * 8 : 10;
    atmosphere.sunHalo.scale.set(haloSize, haloSize, 1);
    atmosphere.sunHalo.visible = !editing && snapshot.sun.altitude > 0;
    atmosphere.sunHalo.material.opacity = snapshot.sun.visible ? (skyView ? .8 : .5) : 0;
    const compass = $('sky-north');
    if (compass && app) {
      const origin = app.state.controls.target.clone();
      const north = origin.clone().add(new Vector3(0, 0, -10)).project(camera);
      const center = origin.project(camera);
      compass.style.transform = `rotate(${Math.atan2(north.x - center.x, north.y - center.y) * 180 / Math.PI}deg)`;
    }
  }

  function viewBody(name) {
    const body = snapshot[name];
    if (!app?.state.townData || !body.visible || (name === 'moon' && snapshot.sun.visible)) return;
    const { controls, camera } = app.state;
    skyView = name;
    $('detail').hidden = true;
    controls.minPolarAngle = .01;
    controls.maxPolarAngle = Math.PI - .01;
    controls.minDistance = 1;
    controls.maxDistance = 300;
    // Consume rotation/dolly inertia before setting an exact astronomical
    // bearing. A leftover orbit delta can move the Sun away from the center.
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.update();
    // Keep the camera at the observer and look along the actual celestial bearing.
    const pos = camera.position.clone();
    controls.target.copy(pos).addScaledVector(new THREE.Vector3(body.direction.x, body.direction.y, body.direction.z), 40);
    camera.position.copy(pos);
    controls.update();
    controls.enableDamping = damping;
    app.invalidate();
  }

  globalThis.TownAstronomy = {
    frame, render, selectTile, restoreView, setMinutes, goEvent, advance, fitBounds,
    get shadowVersion() { return version; },
    get state() { return { snapshot, live, instant: new Date(instant), skyView, disposed, playing }; },
    get sceneState() { return app?.state; },
    refresh,
  };
  window.installTownAstronomy = async (townApp, constructors) => {
    app = townApp; THREE = constructors;
    if (!app.state.atmosphere) return;
    prepareAtmosphere(app.state.atmosphere);
    playButton = document.createElement('button'); playButton.id = 'sky-play'; playButton.type = 'button';
    playButton.textContent = '播放日夜'; playButton.setAttribute('aria-pressed', 'false'); playButton.disabled = true;
    playButton.title = '從目前時間加速播放到當日 23:59；按「現在」可恢復即時天空';
    document.querySelector('.sky-look').append(playButton);
    on(playButton, 'click', togglePlayback);
    for (const l of Core.locations) {
      const option = document.createElement('option'); option.value = l.id;
      option.textContent = `${l.city} · ${l.name}`; $('sky-location').append(option);
    }
    on($('sky-location'), 'change', () => {
      const index = Core.locations.findIndex(l => l.id === $('sky-location').value);
      if (index >= 0) app.focusTile(index);
    });
    on($('sky-date'), 'change', () => {
      const input = $('sky-date');
      if (!input.value || !input.checkValidity()) return;
      stopPlayback();
      try { instant = Core.dateFromLocal(input.value, local().minutes, location.timeZone); live = false; refresh(); }
      catch { sync(); }
    });
    on($('sky-live'), 'click', () => { stopPlayback(); live = true; refresh(); app.refit(); });
    on($('sky-moonrise'), 'click', () => goEvent('moonrise'));
    on($('sky-moonset'), 'click', () => goEvent('moonset'));
    on($('sky-sun-view'), 'click', () => viewBody('sun'));
    on($('sky-moon-view'), 'click', () => viewBody('moon'));
    on(document.querySelector('.sky-details'), 'toggle', () => app.invalidate());
    on(document, 'visibilitychange', () => { if (!document.hidden && live) refresh(); });
    on(window, 'pageshow', () => { if (live) refresh(); });
    on(window, 'pagehide', event => { if (!event.persisted) dispose(); });
    function dispose() {
      if (disposed) return;
      disposed = true; clearInterval(timer);
      stopPlayback(); playButton?.remove();
      for (const cleanup of cleanups) cleanup();
    }
    timer = setInterval(() => { if (live && !document.hidden && !app.state.disposed) refresh(); }, 15000);
    // Expose a small documented diagnostic surface for scene-level verification.
    TownAstronomy.preview = date => { stopPlayback(); live = false; instant = new Date(date); refresh(); };
    TownAstronomy.dispose = dispose;
    refresh();
    await app.ready;
    if (!disposed && !app.state.disposed) { playButton.disabled = false; app.refit(); sync(); }
  };
})();
