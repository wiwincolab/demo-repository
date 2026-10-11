/* Astronomy Engine 2.1.19 adapter. North = -Z, east = +X, zenith = +Y. */
(() => {
  const RAD = Math.PI / 180;
  const AU_KM = 149597870.7;
  // Coordinates copied from the project's attributed OpenStreetMap POI snapshot.
  // The broad Fuji/lake scene observes from Oishi Park, on Lake Kawaguchi.
  // Elevation is explicitly a sea-level reference, not a surveyed terrain height.
  const locations = [
    ['TT001', '超級任天堂世界', '大阪', 34.6684259, 135.4301596, 'Asia/Tokyo', 'relation/21230390'],
    ['TT002', '道頓堀・固力果看板', '大阪', 34.668926, 135.5010546, 'Asia/Tokyo', 'node/3507545614'],
    ['TT003', '淺草寺', '東京', 35.713454, 139.7959524, 'Asia/Tokyo', 'way/173154847'],
    ['TT004', '清水寺', '京都', 34.9944239, 135.7844825, 'Asia/Tokyo', 'way/336641107'],
    ['TT005', '河口湖・大石公園', '山梨', 35.5232711, 138.7465421, 'Asia/Tokyo', 'way/1220560079'],
    ['TT006', '白川鄉', '岐阜', 36.2573454, 136.9068317, 'Asia/Tokyo', 'node/683765481'],
    ['TT007', '景福宮', '首爾', 37.5797662, 126.9769021, 'Asia/Seoul', 'relation/5501517'],
    ['TT008', '甘川文化村', '釜山', 35.0962903, 129.0087976, 'Asia/Seoul', 'way/382693934'],
    ['TT009', '城山日出峰', '濟州', 33.4588891, 126.9408178, 'Asia/Seoul', 'node/330006952'],
  ].map(([id, name, city, latitude, longitude, timeZone, osm]) => Object.freeze({
    id, name, city, latitude, longitude, timeZone, elevation: 0,
    source: `https://www.openstreetmap.org/${osm}`,
  }));
  const clamp = (x, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, x));
  const smooth = (lo, hi, x) => { const t = clamp((x - lo) / (hi - lo)); return t * t * (3 - 2 * t); };
  const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;
  const unit = (v) => { const d = Math.hypot(v.x, v.y, v.z); return { x: v.x / d, y: v.y / d, z: v.z / d }; };

  function localParts(date, timeZone) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}`,
      minutes: +parts.hour * 60 + +parts.minute, second: +parts.second };
  }

  function dateFromLocal(dateString, minutes, timeZone) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString) || !Number.isFinite(minutes) || minutes < 0 || minutes >= 1440) {
      throw new RangeError('日期或時間無效');
    }
    const midnight = Date.parse(`${dateString}T00:00:00Z`);
    if (!Number.isFinite(midnight) || new Date(midnight).toISOString().slice(0, 10) !== dateString) {
      throw new RangeError('日期無效');
    }
    const wallTime = midnight + Math.round(minutes) * 60000;
    let instant = wallTime;
    // Solve civil time against the named timezone, independent of browser timezone.
    for (let i = 0; i < 3; i++) {
      const p = localParts(new Date(instant), timeZone);
      const represented = Date.parse(`${p.date}T${p.time}:00Z`);
      instant += wallTime - represented;
    }
    return new Date(instant);
  }

  function direction(azimuth, altitude) {
    const az = azimuth * RAD, alt = altitude * RAD, cos = Math.cos(alt);
    return { x: Math.sin(az) * cos, y: Math.sin(alt), z: -Math.cos(az) * cos };
  }

  function sample(A, location, date) {
    if (!Number.isFinite(date.getTime())) throw new RangeError('日期無效');
    const observer = new A.Observer(location.latitude, location.longitude, location.elevation);
    const body = (name, radiusKm) => {
      const equ = A.Equator(name, date, observer, true, true);
      const apparent = A.Horizon(date, observer, equ.ra, equ.dec, 'normal');
      const airless = A.Horizon(date, observer, equ.ra, equ.dec, false);
      const angularRadius = Math.asin(radiusKm / (equ.dist * AU_KM));
      return { azimuth: apparent.azimuth, altitude: apparent.altitude,
        geometricAltitude: airless.altitude, direction: direction(apparent.azimuth, apparent.altitude),
        geometricDirection: direction(airless.azimuth, airless.altitude), distanceAU: equ.dist,
        angularRadius, visible: apparent.altitude + angularRadius / RAD > 0,
        equatorialVector: equ.vec };
    };
    const sun = body(A.Body.Sun, 695700), moon = body(A.Body.Moon, 1737.4);
    // Sunlight on the lunar surface: Moon->Sun, transformed from true equator of
    // date to the observer's north/west/zenith system. It is not a fixed shader light.
    const vector = new A.Vector(sun.equatorialVector.x - moon.equatorialVector.x,
      sun.equatorialVector.y - moon.equatorialVector.y,
      sun.equatorialVector.z - moon.equatorialVector.z, A.MakeTime(date));
    const hor = A.RotateVector(A.Rotation_EQD_HOR(date, observer), vector);
    const moonSunDirection = unit({ x: -hor.y, y: hor.z, z: -hor.x });
    const towardObserver = { x: -moon.geometricDirection.x, y: -moon.geometricDirection.y, z: -moon.geometricDirection.z };
    const illuminatedFraction = clamp((1 + dot(moonSunDirection, towardObserver)) / 2);
    const illumination = A.Illumination(A.Body.Moon, date);
    const phase = A.MoonPhase(date);
    const phaseName = phase < 1 || phase >= 359 ? '新月附近' : Math.abs(phase - 90) < 1 ? '上弦附近' :
      Math.abs(phase - 180) < 1 ? '滿月附近' : Math.abs(phase - 270) < 1 ? '下弦附近' :
      phase < 90 ? '眉月' : phase < 180 ? '盈凸月' : phase < 270 ? '虧凸月' : '殘月';
    const altitude = sun.geometricAltitude;
    const label = altitude >= 0 ? '日間' : altitude >= -6 ? '民用曙暮光' :
      altitude >= -12 ? '航海曙暮光' : altitude >= -18 ? '天文曙暮光' : '夜間';
    return { date: new Date(date), location, observer, sun, moon, moonSunDirection,
      illuminatedFraction, phase, phaseName, moonMagnitude: illumination.mag,
      daylight: smooth(-6, 12, altitude), night: 1 - smooth(-18, -6, altitude),
      sunset: smooth(-8, -1, altitude) * (1 - smooth(3, 18, altitude)), label };
  }

  function events(A, location, dateString) {
    const start = dateFromLocal(dateString, 0, location.timeZone);
    const end = dateFromLocal(dateString, 1439, location.timeZone).getTime() + 60000;
    const observer = new A.Observer(location.latitude, location.longitude, location.elevation);
    const sameDay = (time) => time && time.date.getTime() < end ? time.date : null;
    return {
      sunrise: sameDay(A.SearchRiseSet(A.Body.Sun, observer, 1, start, 1)),
      noon: sameDay(A.SearchHourAngle(A.Body.Sun, observer, 0, start).time),
      sunset: sameDay(A.SearchRiseSet(A.Body.Sun, observer, -1, start, 1)),
      moonrise: sameDay(A.SearchRiseSet(A.Body.Moon, observer, 1, start, 1)),
      moonset: sameDay(A.SearchRiseSet(A.Body.Moon, observer, -1, start, 1)),
    };
  }

  globalThis.TownSkyCore = Object.freeze({ locations: Object.freeze(locations), localParts,
    dateFromLocal, direction, sample, events, clamp, smooth, dot });
})();
