import { readPoiSnapshot } from '../../../utils/poi-store.ts';
export default defineEventHandler(async event=>{
  try {setHeader(event,'Cache-Control','public, max-age=60');return await readPoiSnapshot(getRouterParam(event,'id'));}
  catch(error:any) {if(error.code==='ENOENT')throw createError({statusCode:404,statusMessage:'POI region not imported'});throw error;}
});
