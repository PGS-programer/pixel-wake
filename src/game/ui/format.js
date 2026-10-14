export function formatNumber(value) {
    return Math.floor(value).toString().padStart(5, '0');
}
