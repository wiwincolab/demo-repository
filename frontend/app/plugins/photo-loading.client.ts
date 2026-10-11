import {observePhotoLoading} from '~/utils/photo-loading';
export default defineNuxtPlugin(() => {
  const dispose=observePhotoLoading(document);
  if(import.meta.hot)import.meta.hot.dispose(dispose);
});
