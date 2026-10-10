import { sunPosition, daylightAt, localTime } from './solar.mjs';
'use strict';
const SITE_URL='https://travel-planet-card-james.satinyjelly4.chatgpt.site/wardrobe/?view=planet';
const trips=[
{id:'tokyo',zone:'Asia/Tokyo',city:'東京',country:'日本',flag:'🇯🇵',lat:35.6762,lng:139.6503,title:'東京・把日常過成風景',days:5,date:'2026.04.03 — 04.07',image:'tokyo.jpg',subtitle:'淺草的早晨，與富士山下的慢時光。',stops:[['淺草與隅田川','穿過雷門，在老街吃一份剛出爐的人形燒。'],['上野與谷中','博物館、老屋咖啡，把午後留給散步。'],['河口湖一日遊','從東京出發，收藏富士山與湖水的倒影。'],['表參道與代官山','設計小店、書店，和一杯喜歡的咖啡。'],['東京車站','買一份伴手禮，把回憶裝進行李。']]},
{id:'taipei',zone:'Asia/Taipei',city:'台北',country:'台灣',flag:'🇹🇼',lat:25.033,lng:121.5654,title:'台北・巷弄裡的小旅行',days:3,date:'2026.02.20 — 02.22',image:'taipei.png',subtitle:'不用走得很遠，也能遇見新的風景。',stops:[['大稻埕','迪化街的老屋、茶香，與碼頭夕陽。'],['中山與赤峰街','走訪小店，為自己挑一張明信片。'],['象山與信義','沿步道往上走，等待城市慢慢亮起。']]},
{id:'seoul',zone:'Asia/Seoul',city:'首爾',country:'韓國',flag:'🇰🇷',lat:37.5665,lng:126.978,title:'首爾・咖啡與城市散步',days:4,date:'2025.11.06 — 11.09',image:'seoul.jpg',subtitle:'在銀杏葉落下的季節，慢慢認識首爾。',stops:[['景福宮與西村','走過宮牆，到巷子裡喝一杯熱拿鐵。'],['聖水洞','舊工廠裡的新靈感，挑一間喜歡的咖啡店。'],['北村與安國','韓屋、工藝小店，還有剛烤好的麵包。'],['漢江散步','把最後一個午後留給河岸與微風。']]}
];
const mascots=[{id:'asakusa',name:'淺草祭典客',city:'tokyo',place:'東京・淺草',description:'穿上靛藍法被，提著小燈籠，陪你穿過雷門，發現老街裡的小驚喜。'}, {id:'fuji',name:'富士山看山派',city:'tokyo',place:'東京行程・河口湖',description:'戴好雪山毛帽，握著暖暖的熱飲，陪你等雲後面的富士山。'}, {id:'taipei',name:'台北旅伴',city:'taipei',place:'台灣・台北',description:'從巷弄早餐到城市夜色，每一次轉彎，都是新的發現。'}, {id:'seoul',name:'首爾旅伴',city:'seoul',place:'韓國・首爾',description:'走進韓屋小巷，收藏咖啡香和銀杏樹下的午後。'}];
const $=s=>document.querySelector(s);
let solarUniform;
let globe,selected='tokyo',activeTab='trips',rotating=!matchMedia('(prefers-reduced-motion: reduce)').matches,toastTimer;
const duration=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:1000;
function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),2500)}
function updateRotation(){if(globe)globe.controls().autoRotate=rotating;$('#rotate').setAttribute('aria-pressed',String(rotating));$('#rotate').setAttribute('aria-label',rotating?'暫停地球自轉':'開始地球自轉');$('#rotate').textContent=rotating?'Ⅱ':'▷'}
function chooseCity(id,fly=true){const t=trips.find(t=>t.id===id);if(!t)return;selected=id;document.querySelectorAll('.city-selector [data-city]').forEach(b=>b.classList.toggle('selected',b.dataset.city===id));document.querySelectorAll('.globe-pin').forEach(b=>b.classList.toggle('active',b.dataset.city===id));$('#selected-place').innerHTML=`<img src="assets/${t.image}" alt="${t.city}旅程封面"><div><div class="place-meta">${t.flag} ${t.country} / ${t.days} DAYS</div><h3>${t.city}・${t.days} 日慢旅行</h3><p>${t.date}</p><span class="city-time" data-city-clock="${t.id}"></span></div><button data-trip="${id}">探索行程 ↗</button>`;updateSolarClock();if(globe&&fly){rotating=false;updateRotation();globe.pointOfView({lat:t.lat,lng:t.lng,altitude:$('#globe').clientWidth<500?2.2:1.85},duration())}}
function renderCollection(tab){activeTab=tab;document.querySelectorAll('[data-tab]').forEach(b=>{const on=b.dataset.tab===tab;b.setAttribute('aria-selected',String(on));b.tabIndex=on?0:-1});$('#collection-content').setAttribute('aria-labelledby','tab-'+tab);$('#collection-content').innerHTML=tab==='trips'?`<div class="trips-grid">${trips.map(t=>`<button class="trip-tile" data-trip="${t.id}"><div class="trip-image"><img src="assets/${t.image}" alt="${t.city}旅程封面" loading="lazy"><span>${t.flag} ${t.country} · ${t.days} 天</span></div><div class="trip-copy"><small>${t.date}</small><h3>${t.title}</h3><p>${t.subtitle}</p><div><span>打開這段旅行</span><span>↗</span></div></div></button>`).join('')}</div>`:`<div class="mascot-grid">${mascots.map(m=>`<button class="mascot-tile" data-mascot="${m.id}"><img src="assets/${m.id}.png" alt="${m.name}" loading="lazy"><h3>${m.name}</h3><p>${m.place} · 已收藏 ↗</p></button>`).join('')}</div>`}
function showTrip(id){const t=trips.find(t=>t.id===id);if(!t)return;chooseCity(id);$('#detail-content').innerHTML=`<img class="detail-cover" src="assets/${t.image}" alt="${t.city}旅行封面"><p class="eyebrow">${t.flag} ${t.country} · ${t.days} DAYS · 示意旅程</p><h2>${t.title}</h2><p class="detail-description">${t.date}<br>${t.subtitle}</p><ol class="timeline">${t.stops.map((s,i)=>`<li><span class="day">DAY 0${i+1}</span><div><h3>${s[0]}</h3><p>${s[1]}</p></div></li>`).join('')}</ol><button class="primary-button" id="back-to-globe">在地球上看看 ${t.city} ↗</button>`;$('#detail-dialog').showModal()}
function showMascot(id){const m=mascots.find(m=>m.id===id);if(!m)return;$('#detail-content').innerHTML=`<img class="mascot-detail" src="assets/${m.id}.png" alt="${m.name}"><p class="eyebrow">MY TRAVEL COMPANION · 示意收藏</p><h2>${m.name}</h2><p class="detail-description">${m.place}<br>${m.description}</p><button class="primary-button" style="margin-top:22px" id="mascot-trip" data-target="${m.city}">看看我們一起走過的行程 ↗</button>`;$('#detail-dialog').showModal()}
document.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.city)chooseCity(b.dataset.city);if(b.dataset.trip)showTrip(b.dataset.trip);if(b.dataset.mascot)showMascot(b.dataset.mascot);if(b.dataset.tab)renderCollection(b.dataset.tab);if(b.hasAttribute('data-share'))$('#share-dialog').showModal();if(b.classList.contains('close'))b.closest('dialog').close();if(b.id==='rotate'){rotating=!rotating;updateRotation()}if(b.id==='zoom-in'&&globe){const p=globe.pointOfView();globe.pointOfView({...p,altitude:Math.max(.75,p.altitude*.8)},duration()/2)}if(b.id==='zoom-out'&&globe){const p=globe.pointOfView();globe.pointOfView({...p,altitude:Math.min(3.6,p.altitude*1.2)},duration()/2)}if(b.id==='sun-view'&&globe){const sun=sunPosition(new Date());rotating=false;updateRotation();globe.pointOfView({lat:12,lng:((sun.longitude+90+540)%360)-180,altitude:$('#globe').clientWidth<500?2.3:2.05},duration())}if(b.id==='reset'&&globe){globe.pointOfView({lat:27,lng:128,altitude:$('#globe').clientWidth<500?2.3:2.05},duration());rotating=!matchMedia('(prefers-reduced-motion: reduce)').matches;updateRotation()}if(b.id==='see-mascots'){renderCollection('mascots');$('#collection').scrollIntoView({behavior:duration()?'smooth':'instant'})}if(b.id==='back-to-globe'){$('#detail-dialog').close();$('#planet').scrollIntoView({behavior:duration()?'smooth':'instant'});chooseCity(selected)}if(b.id==='mascot-trip'){$('#detail-dialog').close();showTrip(b.dataset.target)}if(b.id==='copy-link'){try{await navigator.clipboard.writeText(SITE_URL+'#planet');toast('星球連結已複製')}catch{toast('無法自動複製，請複製瀏覽器網址')}}});
document.querySelectorAll('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close()}}));
$('.tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();renderCollection(e.key==='Home'?'trips':e.key==='End'?'mascots':activeTab==='trips'?'mascots':'trips');$('#tab-'+activeTab).focus()}});
function initGlobe(){try{if(typeof Globe!=='function')throw Error('地球程式尚未載入');const el=$('#globe');globe=new Globe(el,{animateIn:!matchMedia('(prefers-reduced-motion: reduce)').matches,rendererConfig:{alpha:true,antialias:true}}).width(el.clientWidth).height(el.clientHeight).backgroundColor('rgba(0,0,0,0)').globeImageUrl('assets/earth.jpg').showAtmosphere(true).atmosphereColor('#8bccbb').atmosphereAltitude(.16).htmlElementsData(trips).htmlLat('lat').htmlLng('lng').htmlAltitude(.045).htmlElement(t=>{const b=document.createElement('button');b.className='globe-pin'+(t.id===selected?' active':'');b.dataset.city=t.id;b.textContent=t.city;b.setAttribute('aria-label','探索'+t.city+'旅行');return b}).arcsData(trips.filter(t=>t.id!=='taipei').map(t=>({startLat:25.033,startLng:121.5654,endLat:t.lat,endLng:t.lng}))).arcColor(()=>['#92e5d1','#e5c553']).arcStroke(.35).arcAltitude(.14).arcDashLength(.55).arcDashGap(.3).arcDashAnimateTime(rotating?2200:0).ringsData(trips).ringLat('lat').ringLng('lng').ringColor(()=> '#f7e399').ringMaxRadius(1.5).ringPropagationSpeed(1).ringRepeatPeriod(1700).onGlobeReady(()=>{$('#globe-status').hidden=true;installSolarMaterial()});globe.pointOfView({lat:27,lng:128,altitude:$('#globe').clientWidth<500?2.3:2.05},0);globe.renderer().setPixelRatio(Math.min(devicePixelRatio,2));const c=globe.controls();c.autoRotateSpeed=.12;c.enablePan=false;c.minDistance=175;c.maxDistance=460;updateRotation();c.addEventListener('start',()=>{rotating=false;updateRotation()});new ResizeObserver(()=>{globe.width(el.clientWidth).height(el.clientHeight)}).observe(el);setTimeout(()=>{if(!$('#globe-status').hidden){$('#globe-status').textContent='地球載入較慢，仍可用下方城市按鈕探索行程。'}},14000);if(matchMedia('(prefers-reduced-motion: reduce)').matches)globe.ringsData([]);document.addEventListener('visibilitychange',()=>document.hidden?globe.pauseAnimation():globe.resumeAnimation());}catch(error){$('#globe-status').textContent='這個瀏覽器暫時無法顯示 3D 地球，請使用下方城市按鈕探索行程。';console.error(error)}}
chooseCity(selected,false);renderCollection('trips');updateRotation();initGlobe();
setInterval(updateSolarClock,30000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateSolarClock()});


function updateSolarClock(){
  const now = new Date();
  if (solarUniform) Object.assign(solarUniform.value,sunPosition(now));
  document.querySelectorAll('[data-city-clock]').forEach(el=>{const t=trips.find(t=>t.id===el.dataset.cityClock);el.textContent=`${daylightAt(t.lat,t.lng,now)?'☀ 日間':'☾ 夜間'} · ${t.city} ${localTime(t.zone,now)}`});
  const badge=$('.orbit-badge');if(badge)badge.textContent='◐ 即時日照 · 每 30 秒更新';
}
function installSolarMaterial(){
  const material=globe.globeMaterial();
  if(!material.map)return;
  const night=new material.map.constructor();
  night.colorSpace=material.map.colorSpace;night.flipY=material.map.flipY;
  const img=new Image();
  img.onload=()=>{night.image=img;night.needsUpdate=true;solarUniform={value:sunPosition(new Date())};
    material.onBeforeCompile=shader=>{
      shader.uniforms.travelSun=solarUniform;shader.uniforms.travelNight={value:night};
      shader.fragmentShader='uniform vec3 travelSun; uniform sampler2D travelNight;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>',`
        float lat = (vMapUv.y - 0.5) * 3.14159265359;
        float lng = (vMapUv.x - 0.5) * 6.28318530718;
        vec3 earthNormal = vec3(cos(lat)*cos(lng), sin(lat), cos(lat)*sin(lng));
        float daylight = smoothstep(-0.10, 0.10, dot(earthNormal, normalize(travelSun)));
        vec3 nightColor = texture2D(travelNight, vMapUv).rgb;
        vec3 dayColor = texture2D(map, vMapUv).rgb;
        outgoingLight = mix(nightColor * 1.35 + vec3(0.006,0.012,0.025), dayColor, daylight);
        #include <opaque_fragment>
      `);
    };
    material.customProgramCacheKey=()=> 'travel-solar-v1';material.needsUpdate=true;
    updateSolarClock();
  };
  img.onerror=()=>{toast('夜景貼圖載入失敗，暫時顯示日間地圖')};
  img.src='assets/earth-night.jpg';
}
// The same isolated experience lives inside the existing wardrobe page.
if(new URLSearchParams(location.search).get('embed')==='1'){
  document.body.classList.add('embedded');
  const reportHeight=()=>parent.postMessage({type:'travel-planet:height',height:Math.ceil(document.body.getBoundingClientRect().height)},location.origin);
  new ResizeObserver(reportHeight).observe(document.body);
  window.addEventListener('load',reportHeight);
}
