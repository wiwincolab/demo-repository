import { initialWallet, readPointsWallet, redeemPoints, type PointsProduct, type Payment } from '~/utils/points';
import type { Stop } from '~/types/trip';
const key='chictrip-points-demo-v1';
export function usePointsWallet(){
 const wallet=useState('points-wallet-v1',initialWallet),ready=useState('points-ready-v1',()=>false),error=useState('points-error-v1',()=>''),busy=useState('points-busy-v1',()=>false);
 function load(){try{const raw=localStorage.getItem(key);wallet.value=raw?readPointsWallet(JSON.parse(raw)):initialWallet();error.value='';ready.value=true;}catch{error.value='點數紀錄無法讀取，暫停兌換以保留原紀錄。';ready.value=false;}}
 onMounted(()=>{load();window.addEventListener('storage',sync);});onBeforeUnmount(()=>{if(import.meta.client)window.removeEventListener('storage',sync);});
 function sync(e:StorageEvent){if(e.key===key)load();}
 async function redeem(p:PointsProduct,payment:Payment,tripId:string,target?:Stop){
  if(!ready.value||busy.value)return false;busy.value=true;error.value='';
  try{
   if(!navigator.locks)throw new Error('此瀏覽器不支援安全儲存示範交易，請改用新版瀏覽器。');
   await navigator.locks.request(key,async()=>{const raw=localStorage.getItem(key);const fresh=raw?readPointsWallet(JSON.parse(raw)):initialWallet();const next=redeemPoints(fresh,p,payment,tripId,target,crypto.randomUUID());localStorage.setItem(key,JSON.stringify(next));wallet.value=next;});return true;
  }catch(e){error.value=e instanceof Error?e.message:'儲存失敗，未扣除示範點數。';return false;}finally{busy.value=false;}
 }
 return {wallet,ready,error,busy,redeem};
}
