<script setup lang="ts">
import { tripItineraries, type TripSummary, type TripId } from '~/data/trips';
import { scheduledTrips, tripsOnDate, tripEnd, tripDayIndex, monthWeeks, weekSegments, shiftMonth } from '~/utils/trip-calendar';
import '~/assets/css/trip-calendar.css';
const props = defineProps<{ trips: TripSummary[]; ready: boolean }>();
const emit = defineEmits<{ open: [id: TripId, day: number]; showList: [] }>();
const asset=useAsset();
function taipeiToday(){
  const parts=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  return ['year','month','day'].map(type=>parts.find(part=>part.type===type)!.value).join('-');
}
const today=useState('trip-calendar-today',taipeiToday);
const month=ref(today.value.slice(0,7)), selected=ref(today.value);
onMounted(()=>{
  const current=taipeiToday(), previous=today.value;
  today.value=current;
  if(selected.value===previous){selected.value=current;month.value=current.slice(0,7);}
});
const scheduled=computed(()=>scheduledTrips(props.trips));
const weeks=computed(()=>monthWeeks(month.value).map(days=>({days,segments:weekSegments(scheduled.value,days)})));
const selectedTrips=computed(()=>tripsOnDate(scheduled.value,selected.value));
const monthTrips=computed(()=>scheduled.value.filter(t=>t.startDate<=month.value+'-31' && tripEnd(t)>=month.value+'-01'));
const monthTitle=computed(()=>`${Number(month.value.slice(5))}月`);
const selectedTitle=computed(()=>`${Number(selected.value.slice(5,7))}月${Number(selected.value.slice(8))}日 星期${'日一二三四五六'[new Date(selected.value+'T00:00:00Z').getUTCDay()]}`);
const nextTrip=computed(()=>scheduled.value.find(t=>t.startDate>=today.value));
const colors=['#387be3','#a568c5','#e18e32','#429d80','#d86280'];
function color(trip:TripSummary){let code=0;for(const char of trip.id)code+=char.charCodeAt(0);return colors[code%colors.length]!;}
function selectDate(date:string){selected.value=date;month.value=date.slice(0,7);}
function move(delta:number){month.value=shiftMonth(month.value,delta);selected.value=month.value+'-01';}
function setMonth(event:Event){const value=(event.target as HTMLInputElement).value;if(/^\d{4}-\d{2}$/.test(value)){month.value=value;selected.value=value+'-01';}}
function schedule(trip:TripSummary){return tripItineraries[trip.id]?.[tripDayIndex(trip,selected.value)];}
</script>
<template>
  <section class="trip-calendar" aria-label="所有行程日曆">
    <div class="calendar-toolbar"><div class="calendar-month-title"><span>{{ month.slice(0,4) }} 年</span><h2>{{ monthTitle }}</h2></div><div class="calendar-controls"><label class="calendar-jump">選月份<input type="month" aria-label="跳至月份" :value="month" @change="setMonth"/></label><button aria-label="上個月" @click="move(-1)">‹</button><button class="calendar-today" @click="selectDate(today)">今天</button><button aria-label="下個月" @click="move(1)">›</button></div></div>
    <div class="calendar-layout"><div class="calendar-month">
      <div class="calendar-weekdays"><span v-for="label in ['日','一','二','三','四','五','六']" :key="label">{{ label }}</span></div>
      <div v-for="week in weeks" :key="week.days[0]" class="calendar-week">
        <div class="calendar-date-row"><button v-for="date in week.days" :key="date" :class="{'outside-month':!date.startsWith(month),'is-today':date===today,'is-selected':date===selected}" :aria-label="date+(date===today?'，今天':'')" :aria-pressed="date===selected" @click="selectDate(date)"><span>{{ Number(date.slice(-2)) }}</span></button></div>
        <div class="calendar-events" :style="{minHeight:Math.max(1,...week.segments.map(s=>s.lane+1))*27+'px'}"><button v-for="segment in week.segments" :key="segment.trip.id" class="calendar-event" :class="{'continues-before':segment.continuesBefore,'continues-after':segment.continuesAfter}" :style="{'--event-color':color(segment.trip),gridColumn:`${segment.start+1} / ${segment.end+2}`,gridRow:segment.lane+1}" :aria-label="segment.trip.title+' '+segment.trip.dateLabel" @click="selectDate(segment.trip.startDate<week.days[0]! ? week.days[0]! : segment.trip.startDate)">{{ segment.trip.title }}</button></div>
      </div>
      <div class="calendar-month-note">本月 {{ monthTrips.length }} 趟旅行<span>只顯示已設定日期的行程</span></div>
    </div>
    <aside class="calendar-agenda"><div class="calendar-agenda-heading"><span>{{ selected===today?'今天':'當日行程' }}</span><h3>{{ selectedTitle }}</h3></div>
      <div v-if="!selectedTrips.length" class="calendar-empty"><span aria-hidden="true">☀</span><strong>這天沒有旅行安排</strong><p>留一點空白，給下一次出發。</p><button v-if="nextTrip && selected!==nextTrip.startDate" @click="selectDate(nextTrip.startDate)">查看下一趟旅行 →</button></div>
      <article v-for="trip in selectedTrips" :key="trip.id" class="calendar-day-trip" :style="{'--event-color':color(trip)}"><img :src="asset(trip.cover)" :alt="trip.location"/><div><span>第 {{ tripDayIndex(trip,selected)+1 }} 天／共 {{ trip.dayCount }} 天</span><h4>{{ trip.title }}</h4><p>{{ schedule(trip)?.area }}</p></div><ol><li v-for="stop in schedule(trip)?.stops" :key="stop.id"><time>{{ stop.time }}</time><span>{{ stop.name }}</span></li></ol><button :disabled="!ready" @click="emit('open',trip.id,tripDayIndex(trip,selected))">開啟這天行程 <span>↗</span></button></article>
      <details class="calendar-all-trips"><summary>所有已排程旅行 · {{ scheduled.length }}</summary><button v-for="trip in scheduled" :key="trip.id" @click="selectDate(trip.startDate)"><i :style="{background:color(trip)}"/><span><strong>{{ trip.title }}</strong><small>{{ trip.dateLabel }}</small></span><span>›</span></button></details>
      <button class="calendar-drafts" @click="emit('showList')">查看全部行程與未定日期的計畫 →</button>
    </aside></div>
  </section>
</template>
