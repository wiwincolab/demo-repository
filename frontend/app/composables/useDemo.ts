import { tripItineraries, tripAlternatives, tripSummaries, type TripId } from '~/data/trips';
import { groupPrice, plans, isMemberList } from '~/utils/commerce';
import type { TripDay, Member, Usage } from '~/types/trip';
interface TripDemoState { days: TripDay[]; members: Member[]; usage: Usage; adjusted: boolean; previousStop: TripDay['stops'][0] | null; generated: boolean }
const blankState = (): TripDemoState => ({days:[],members:[],usage:'normal',adjusted:false,previousStop:null,generated:false});
function initialState(id:TripId):TripDemoState { return {...blankState(),days:structuredClone(tripItineraries[id]),members:[{name:'Scott（你）',paid:false,price:299}]}; }
export function useDemo() {
    const {activeId,activeTrip}=useTripContext();
    const states=useState<Record<TripId,TripDemoState>>('trip-demo-v2',()=>({tokyo:initialState('tokyo'),kansai:initialState('kansai'),fuji:initialState('fuji')}));
    const storageReady=useState('trip-demo-ready-v2',()=>false);
    const empty=blankState();
    function field<K extends keyof TripDemoState>(key:K){return computed({get:()=>activeId.value?states.value[activeId.value][key]:empty[key],set:(value:TripDemoState[K])=>{if(activeId.value)states.value[activeId.value][key]=value;}});}
    const days=field('days'), members=field('members'), usage=field('usage'), adjusted=field('adjusted'), previousStop=field('previousStop'), generated=field('generated');
    onMounted(()=>{
      if(storageReady.value)return;
      try{
        const cached=JSON.parse(sessionStorage.getItem('chictrip-demo-by-trip-v2')||'null');
        for(const trip of tripSummaries){
          const value=cached?.[trip.id], target=states.value[trip.id];
          if(isMemberList(value?.members))target.members=value.members;
          if(['light','normal','heavy'].includes(value?.usage))target.usage=value.usage;
          target.generated=value?.generated===true;
          if(value?.adjusted===true){target.previousStop=structuredClone(tripItineraries[trip.id][0]!.stops[1]!);target.days[0]!.stops[1]=structuredClone(tripAlternatives[trip.id]);target.adjusted=true;}
        }
        if(!cached){const legacy=JSON.parse(sessionStorage.getItem('chictrip-mobile-members')||'null');if(isMemberList(legacy))states.value.tokyo.members=legacy;}
      }catch{}
      storageReady.value=true;
    });
    watch(states,value=>{if(storageReady.value)try{sessionStorage.setItem('chictrip-demo-by-trip-v2',JSON.stringify(value));}catch{}},{deep:true});
    const toast = useState('toast-message', () => '');
    const toastVersion = useState('toast-version', () => 0);
    watch(activeId,()=>{toast.value='';});
    const group = computed(() => groupPrice(members.value));
    const plan = computed(() => {
      const base=plans[usage.value], count=activeTrip.value?.dayCount||5;
      const ranges={light:[.4,.8],normal:[1,1.6],heavy:[3,4.4]}[usage.value];
      return {...base,range:`${Math.ceil(ranges[0]!*count)}–${Math.ceil(ranges[1]!*count)}`,desc:`共 ${{light:1,normal:2,heavy:5}[usage.value]*count}GB 高速額度 · 每日重置`};
    });
    const eligible = computed(() => members.value[0]?.paid === true);
    function notify(message: string) {
        toast.value = message;
        const version = ++toastVersion.value;
        if (import.meta.client)
            setTimeout(() => { if (version === toastVersion.value)
                toast.value = ''; }, 3000);
    }
    function addMember() {
        if(!activeId.value)return;
        if (members.value.length >= 8)
            return;
        const names=['Scott（你）',...(activeTrip.value?.companions||[]),'小晴','小恩','小凱','小文'];
        members.value.push({ name: names[members.value.length]||`旅伴 ${members.value.length}`, paid: false, price: 299 });
        notify('旅伴已加入共編，尚未購買 eSIM');
    }
    function buy(index: number) {
        const member = members.value[index];
        if (!member || member.paid)
            return;
        member.paid = true;
        member.price = index === 0 ? plan.value.price : 299;
        notify(group.value.count === 4 ? '4 人購買，已解鎖每人 NT$20 旅伴折扣' : '已完成示範購買');
    }
    function applyAdjustment() {
        if(!activeId.value||!days.value[0]?.stops[1])return;
        if (!adjusted.value)
            previousStop.value = structuredClone(toRaw(days.value[0]!.stops[1]!));
        days.value[0]!.stops[1] = structuredClone(tripAlternatives[activeId.value]);
        adjusted.value = true;
    }
    function undoAdjustment() {
        if (!previousStop.value)
            return;
        const name=previousStop.value.name;
        days.value[0]!.stops[1] = previousStop.value;
        previousStop.value = null;
        adjusted.value = false;
        notify('已回到原本的'+name);
    }
    function reset() {
        if(!activeId.value)return;
        members.value = [{ name: 'Scott（你）', paid: false, price: 299 }];
        generated.value = false;
        notify('組隊模擬已重設為 1 人共編、0 人購買');
    }
    return { days, members, usage, adjusted, generated, group, plan, eligible, toast, notify, addMember, buy, applyAdjustment, undoAdjustment, reset };
}
export function useAsset() {
    const base = useRuntimeConfig().app.baseURL;
    return (path: string) => base + path.replace(/^\//, '');
}
