import { journeyStops, emptyJourney } from '~/data/journey';
export function useJourneyCollection() {
  const state=useState('kansai-journey-collection',emptyJourney);
  const ready=useState('kansai-journey-storage-ready',()=>false);
  const savedStops=computed(()=>journeyStops.filter(stop=>stop.id!=='usj'||state.value.usjSaved));
  const collectionCount=computed(()=>savedStops.value.length+Number(state.value.friendAccepted));
  onMounted(()=>{
    if(ready.value)return;
    ready.value=true;
  });
  function markCreated(){state.value.usjCreated=true;}
  function saveUsj(){if(!state.value.usjCreated)return;state.value.usjSaved=true;state.value.savedAt ||= new Date().toISOString();}
  function setNote(note:string){state.value.note=note.trim().slice(0,240);}
  function acceptFriend(reply=''){if(!state.value.usjSaved||state.value.friendAccepted)return;state.value.friendAccepted=true;state.value.friendReply=reply.trim().slice(0,240);state.value.exchangedAt=new Date().toISOString();}
  function placeFriend(value:boolean){if(!state.value.friendAccepted)return;state.value.friendPlaced=value;}
  return{stops:journeyStops,state,ready,savedStops,collectionCount,markCreated,saveUsj,setNote,acceptFriend,placeFriend};
}
