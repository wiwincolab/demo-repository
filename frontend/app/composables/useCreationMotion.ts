import { gsap } from 'gsap';

/** Own every interaction tween, including those started after mounting. */
export function useCreationMotion(root: Ref<HTMLElement | undefined>) {
  let context: gsap.Context | undefined;
  const reduced = ref(false);
  let preference: MediaQueryList | undefined;
  const update = () => { reduced.value = preference?.matches ?? false; };
  onMounted(() => {
    preference = matchMedia('(prefers-reduced-motion: reduce)');
    update(); preference.addEventListener('change', update);
    context = gsap.context(() => {}, root.value);
  });
  function animate(fn: (duration: (seconds: number) => number) => void) {
    context?.add(() => fn(seconds => reduced.value ? 0 : seconds));
  }
  onBeforeUnmount(() => { context?.revert(); preference?.removeEventListener('change', update); });
  return { gsap, animate, reduced };
}
