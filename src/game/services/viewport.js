// Observe the actual parent, including dynamic mobile viewport/orientation changes.
// Refresh the input transform together with the canvas display size.
export function watchViewport(game, parent) {
    if (!parent) return;
    let frame = 0;
    const refresh = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
            const bounds = parent.getBoundingClientRect();
            if (bounds.width && bounds.height) game.scale.setParentSize(bounds.width, bounds.height);
        });
    };
    const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(refresh) : null;
    observer?.observe(parent);
    window.addEventListener('resize', refresh);
    refresh();
    game.events.once('destroy', () => {
        cancelAnimationFrame(frame);
        observer?.disconnect();
        window.removeEventListener('resize', refresh);
    });
}
