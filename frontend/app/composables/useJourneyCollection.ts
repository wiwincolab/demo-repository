import { journeyStops, emptyJourney, restoreJourney } from '~/data/journey';
export function useJourneyCollection() {
  const state=useState('kansai-journey-collection',emptyJourney);
  const ready=useState('kansai-journey-storage-ready',()=>false);
  const key='chictrip-kansai-collection-v1';
  const {notify}=useDemo();
  const savedStops=computed(()=>journeyStops.filter(stop=>stop.id!=='usj'||state.value.usjSaved));
  const collectionCount=computed(()=>savedStops.value.length+Number(state.value.friendAccepted));
  onMounted(()=>{
    if(ready.value)return;
    try{state.value=restoreJourney(JSON.parse(localStorage.getItem(key)||'null'));}catch{/* Local storage is optional. */}
    ready.value=true;
  });
  function persist(){try{localStorage.setItem(key,JSON.stringify(state.value));}catch{notify('這次操作已完成，但瀏覽器暫時無法保存紀錄。');}}
  function markCreated(){state.value.usjCreated=true;persist();}
  function saveUsj(){if(!state.value.usjCreated)return;state.value.usjSaved=true;state.value.savedAt ||= new Date().toISOString();persist();}
  function setNote(note:string){state.value.note=note.trim().slice(0,240);persist();}
  function acceptFriend(reply=''){if(!state.value.usjSaved||state.value.friendAccepted)return;state.value.friendAccepted=true;state.value.friendReply=reply.trim().slice(0,240);state.value.exchangedAt=new Date().toISOString();persist();}
  function placeFriend(value:boolean){if(!state.value.friendAccepted)return;state.value.friendPlaced=value;persist();}
  return{stops:journeyStops,state,ready,savedStops,collectionCount,markCreated,saveUsj,setNote,acceptFriend,placeFriend};
}
