import { readPoiSnapshot } from '../../utils/poi-store.ts';
export default defineEventHandler(async event=>{
  try {setHeader(event,'Cache-Control','public, max-age=60');return await readPoiSnapshot();}
  catch(error:any) {if(error.code==='ENOENT')throw createError({statusCode:404,statusMessage:'POI snapshot not imported'});throw error;}
});
