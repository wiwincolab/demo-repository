const loading = new Map<string, Promise<void>>();
/** Load the vendored MapLibre / Three bundles only when the atlas is opened. */
export function loadScript(src: string): Promise<void> {
    if (!import.meta.client)
        return Promise.resolve();
    if (loading.has(src))
        return loading.get(src)!;
    const promise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => { loading.delete(src); reject(new Error('Cannot load ' + src)); };
        document.head.appendChild(script);
    });
    loading.set(src, promise);
    return promise;
}
