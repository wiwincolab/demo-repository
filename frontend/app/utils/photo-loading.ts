// Covers Vue images and DOM images created by map markers without changing layouts.
export function observePhotoLoading(root: Document) {
  const pending = new WeakMap<HTMLImageElement, {source: string; busy: string | null}>();
  const isImage = (value: EventTarget | null): value is HTMLImageElement => value instanceof Element && value.tagName === 'IMG';
  const source = (img: HTMLImageElement) => [img.getAttribute('src'), img.getAttribute('srcset')].join('|');
  const visible = typeof IntersectionObserver === 'undefined' ? null : new IntersectionObserver(entries => {
    for (const entry of entries) if (isImage(entry.target) && entry.target.dataset.photoState === 'loading') entry.target.dataset.photoVisible = String(entry.isIntersecting);
  }, {rootMargin: '80px'});
  function finish(img: HTMLImageElement, failed: boolean, reveal = true) {
    const tracked = pending.get(img);
    if (!tracked) return;
    img.dataset.photoState = failed ? 'error' : 'loaded';
    img.dataset.photoReveal = String(!failed && reveal);
    delete img.dataset.photoVisible;
    if (tracked.busy === null) img.removeAttribute('aria-busy'); else img.setAttribute('aria-busy', tracked.busy);
    visible?.unobserve(img);
  }
  function track(img: HTMLImageElement) {
    const raw = img.getAttribute('src') || img.getAttribute('srcset') || '';
    if (!raw || img.dataset.photoLoading === 'off' || /\.svg(?:[?#]|$)/i.test(raw)) {
      const tracked=pending.get(img);
      if(tracked){if(tracked.busy===null)img.removeAttribute('aria-busy');else img.setAttribute('aria-busy',tracked.busy);visible?.unobserve(img);pending.delete(img);}
      delete img.dataset.photoState;delete img.dataset.photoVisible;delete img.dataset.photoReveal;
      return;
    }
    const previous = pending.get(img), current = source(img);
    if (previous?.source === current) {
      if (img.dataset.photoState === 'loading') visible?.observe(img);
      return;
    }
    pending.set(img, {source: current, busy: previous ? previous.busy : img.getAttribute('aria-busy')});
    img.dataset.photoReveal = 'false';
    if (img.complete) { finish(img, img.naturalWidth === 0, false); return; }
    img.dataset.photoState = 'loading';
    img.dataset.photoVisible = String(!visible);
    img.setAttribute('aria-busy', 'true');
    visible?.observe(img);
  }
  function images(node: Node, callback: (img: HTMLImageElement) => void) {
    if (isImage(node)) callback(node);
    if (node instanceof Element) node.querySelectorAll<HTMLImageElement>('img').forEach(callback);
  }
  function loaded(event: Event) {if (isImage(event.target)) {track(event.target);if(event.target.complete && event.target.naturalWidth > 0)finish(event.target,false);}}
  function failed(event: Event) {if (isImage(event.target)) {track(event.target);finish(event.target,true);}}
  root.querySelectorAll<HTMLImageElement>('img').forEach(track);
  root.addEventListener('load', loaded, true);
  root.addEventListener('error', failed, true);
  const changes = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'attributes' && isImage(record.target)) track(record.target);
      else {
        record.removedNodes.forEach(node => images(node, img => visible?.unobserve(img)));
        record.addedNodes.forEach(node => images(node, track));
      }
    }
  });
  changes.observe(root.documentElement, {childList: true, subtree: true, attributes: true, attributeFilter: ['src', 'srcset']});
  return () => {changes.disconnect();visible?.disconnect();root.removeEventListener('load',loaded,true);root.removeEventListener('error',failed,true);};
}
