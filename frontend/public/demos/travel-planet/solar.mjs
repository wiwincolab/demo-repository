// Approximate NOAA fractional-year solar model. UTC instant, not browser time zone.
const RAD = Math.PI / 180;
export function sunPosition(date = new Date()) {
  const year = date.getUTCFullYear();
  const start = Date.UTC(year, 0, 1);
  const day = Math.floor((date.getTime() - start) / 86400000) + 1;
  const minutes = date.getUTCHours() * 60 + date.getUTCMinutes() + date.getUTCSeconds() / 60;
  const yearDays = (Date.UTC(year + 1, 0, 1) - start) / 86400000;
  const g = 2 * Math.PI / yearDays * (day - 1 + (minutes / 60 - 12) / 24);
  const equation = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2*g) - 0.040849 * Math.sin(2*g));
  const declination = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2*g) + 0.000907 * Math.sin(2*g) - 0.002697 * Math.cos(3*g) + 0.00148 * Math.sin(3*g);
  const longitude = ((180 - minutes / 4 - equation / 4 + 540) % 360) - 180;
  return { longitude, latitude: declination / RAD, x: Math.cos(declination)*Math.cos(longitude*RAD), y: Math.sin(declination), z: Math.cos(declination)*Math.sin(longitude*RAD) };
}
export function daylightAt(lat, lng, date = new Date()) {
  const sun = sunPosition(date);
  return Math.sin(lat*RAD)*sun.y + Math.cos(lat*RAD)*(Math.cos(lng*RAD)*sun.x + Math.sin(lng*RAD)*sun.z) > Math.sin(-0.833*RAD);
}
export function localTime(timeZone, date = new Date()) {
  return new Intl.DateTimeFormat('zh-TW',{timeZone,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(date);
}
