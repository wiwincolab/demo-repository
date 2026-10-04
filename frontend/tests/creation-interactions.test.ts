import test from 'node:test';
import assert from 'node:assert/strict';
import { creationPhotos, creationStyles, photoById, styleForPhoto, workForPhoto } from '../app/data/creation.ts';
import { stickerKit } from '../app/data/creation-motifs.ts';

test('interactive creation previews stay available for Nara and styles without a preset',()=>{
  for(const photo of creationPhotos)for(const style of creationStyles){
    assert(styleForPhoto(photo,style.id).interactive,`${photo.id}/${style.id} needs an operable preview`);
    assert.equal(workForPhoto(photo,style.id).source,photo.source);
  }
});
test('Nara and Fuji stickers use their own independent motifs; arbitrary photos remain their own sticker',()=>{
  const nara=stickerKit(workForPhoto(photoById('nara-deer')!,'sticker'));
  const fuji=stickerKit(workForPhoto(photoById('fuji-blue')!,'sticker'));
  assert.equal(nara.motifs.length,6);assert.equal(fuji.motifs.length,6);
  assert(nara.motifs[0]!.name.includes('小鹿'));assert.equal(fuji.motifs[0]!.name,'富士山');
  assert.notEqual(nara.sheet,fuji.sheet);
  const custom=stickerKit(workForPhoto(photoById('usj-panorama')!,'sticker'));
  assert.equal(custom.sheet,'assets/memory/references/usj-nintendo-source.png');
  assert.equal(custom.motifs.length,1);
  for(const kit of [nara,fuji])for(const motif of kit.motifs){
    const [x,y,w,h]=motif.box.split(' ').map(Number) as [number,number,number,number];
    assert(x>=0&&y>=0&&w>0&&h>0&&x+w<=kit.width&&y+h<=kit.height);
  }
});
