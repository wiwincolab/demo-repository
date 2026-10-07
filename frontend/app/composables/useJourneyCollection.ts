import { journeyStops, emptyJourney } from '~/data/journey';
import { photoById, workForPhoto } from '~/data/creation';
export function useJourneyCollection() {
  const state=useState('kansai-journey-collection',emptyJourney);
  const ready=useState('kansai-journey-storage-ready',()=>false);
  // 場景與交換照樣記在 state（場景裡的旅伴、留言要用），收藏本身寫進 useCreation，各頁才算得到同一份
  const { record }=useCreation();
  const savedStops=computed(()=>journeyStops.filter(stop=>stop.id!=='usj'||state.value.usjSaved));
  const collectionCount=computed(()=>savedStops.value.length+Number(state.value.friendAccepted));
  onMounted(()=>{
    if(ready.value)return;
    ready.value=true;
  });
  function markCreated(){state.value.usjCreated=true;}
  function saveUsj(){
    if(!state.value.usjCreated)return;
    state.value.usjSaved=true;state.value.savedAt ||= new Date().toISOString();
    record({...workForPhoto(photoById('usj-scene')!,'scene'),id:'journey-usj-scene',createdAt:state.value.savedAt});
  }
  function setNote(note:string){state.value.note=note.trim().slice(0,240);}
  function acceptFriend(reply=''){
    if(!state.value.usjSaved||state.value.friendAccepted)return;
    state.value.friendAccepted=true;state.value.friendReply=reply.trim().slice(0,240);state.value.exchangedAt=new Date().toISOString();
    record({...workForPhoto(photoById('usj-panorama')!,'companion','James'),id:'journey-usj-companion',receivedFrom:'james',createdAt:state.value.exchangedAt});
  }
  function placeFriend(value:boolean){if(!state.value.friendAccepted)return;state.value.friendPlaced=value;}
  return{stops:journeyStops,state,ready,savedStops,collectionCount,markCreated,saveUsj,setNote,acceptFriend,placeFriend};
}
