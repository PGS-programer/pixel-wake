// Small fictitious Mediterranean harbour. Navigation coordinates: east X, north Y.
export const PORT = Object.freeze({ quayX: 62, northY: 100, gateY: -48, entryY: -32, entranceHalfWidth: 28, targetY: 24 });
const calm = { wind: { x: 0, y: 0 }, current: { x: 0, y: 0 } };
const easy = { minGap: .4, maxGap: 5.5, angleDeg: 16, surge: .28, sway: .16, yaw: .012, hold: 2, safeSpeed: .33, finalSpeedKn: 2.5 };
const normal = { minGap: .4, maxGap: 4.5, angleDeg: 12, surge: .25, sway: .14, yaw: .010, hold: 2.5, safeSpeed: .29, finalSpeedKn: 2 };
const advanced = { minGap: .4, maxGap: 3.8, angleDeg: 10, surge: .22, sway: .12, yaw: .008, hold: 3, safeSpeed: .26, finalSpeedKn: 2 };
export const MISSIONS = [
    { id: 1, title: 'Primer atraque', description: 'Sigue E-02: muelle a ESTRIBOR, tu costado derecho. Zona amplia y aguas tranquilas.', side: 1, targetX: 57.1, targetY: PORT.targetY, ...calm, precision: 9, docking: easy, zoneLength: 39, zoneWidth: 10.5, start: { x: 0, y: -91, heading: 0 } },
    { id: 2, title: 'La banda de babor', description: 'Busca W-02: muelle a BABOR, tu costado izquierdo. Espacio amplio para corregir.', side: -1, targetX: -57.1, targetY: PORT.targetY, ...calm, precision: 8, docking: easy, zoneLength: 37, zoneWidth: 10.5, start: { x: 0, y: -91, heading: 0 } },
    { id: 3, title: 'Control de estribor', description: 'Vuelve a E-02 por ESTRIBOR. Afina la alineación sin prisas.', side: 1, targetX: 57.1, targetY: PORT.targetY, ...calm, precision: 6, docking: normal, zoneLength: 33, zoneWidth: 9 },
    { id: 4, title: 'Entre dos barcos', description: 'E-02 por ESTRIBOR, con barcos vecinos y un hueco de más de 40 m.', side: 1, targetX: 57.1, targetY: PORT.targetY, ...calm, precision: 4, docking: advanced, tight: true, zoneLength: 29, zoneWidth: 8 },
    { id: 5, title: 'Viento de través', description: 'W-02 por BABOR. Viento hacia el este de 6 m/s, corriente norte de 0,25 m/s.', side: -1, targetX: -57.1, targetY: PORT.targetY, wind: { x: 6, y: 0 }, current: { x: 0, y: .25 }, precision: 5, docking: normal, zoneLength: 31, zoneWidth: 9 },
];
export function createHarbor(mission) {
    const boxes = [
        { id: 'Dique oeste', x: -51, y: PORT.gateY, w: 42, h: 10, kind: 'breakwater' },
        { id: 'Dique este', x: 51, y: PORT.gateY, w: 42, h: 10, kind: 'breakwater' },
        { id: 'Muelle oeste', x: -68, y: 26, w: 12, h: 148, kind: 'quay' },
        { id: 'Muelle este', x: 68, y: 26, w: 12, h: 148, kind: 'quay' },
        { id: 'Muelle norte', x: 0, y: 106, w: 148, h: 12, kind: 'quay' },
        { id: 'Pantalán pesquero', x: -49, y: 68, w: 26, h: 3, kind: 'pier' },
        { id: 'Boya roja', x: -30, y: -62, w: 2.4, h: 2.4, kind: 'red' },
        { id: 'Boya verde', x: 30, y: -62, w: 2.4, h: 2.4, kind: 'green' },
    ];
    // Physical boxes and rendered vessels originate from the same dimensions.
    const boats = [
        { id: 'Llaüt Brisa', x: -45, y: 61.8, length: 11, beam: 3.5, heading: Math.PI / 2, type: 'fishing', color: '#2f6874', shore: { axis: 'y', value: 67.4 } },
        { id: 'Velero Alzina', x: -46, y: 94, length: 13, beam: 3.8, heading: Math.PI / 2, type: 'sail', color: '#e3e4d9', shore: { axis: 'y', value: 101 } },
        { id: 'Velero Cala', x: -24, y: 94.4, length: 11.5, beam: 3.5, heading: Math.PI / 2, type: 'sail', color: '#e1dccd', shore: { axis: 'y', value: 101 } },
        { id: 'Lancha Sal', x: -3, y: 94.8, length: 9.5, beam: 3.1, heading: Math.PI / 2, type: 'leisure', color: '#eee6ce', shore: { axis: 'y', value: 101 } },
        { id: 'Pesquero Marí', x: 18, y: 94.2, length: 12, beam: 4, heading: Math.PI / 2, type: 'fishing', color: '#647d67', shore: { axis: 'y', value: 101 } },
        { id: 'Servicio Far', x: 42, y: 93.7, length: 14, beam: 4.2, heading: Math.PI / 2, type: 'work', color: '#b87550', shore: { axis: 'y', value: 101 } },
        { id: 'Lancha Tramuntana', x: 57.5, y: 76, length: 10, beam: 3.2, heading: 0, type: 'leisure', color: '#f1e6d5', shore: { axis: 'x', value: 63 } },
    ];
    if (mission.tight) for (const y of [-3, 51]) boats.push({ id: `Vecino ${y}`, x: 57.5, y, length: 13, beam: 3.6, heading: 0, type: 'sail', color: '#d4e2de', shore: { axis: 'x', value: 63 } });
    for (const boat of boats) {
        const north = Math.abs(Math.cos(boat.heading)) > .5;
        boxes.push({ id: boat.id, x: boat.x, y: boat.y, w: north ? boat.beam : boat.length, h: north ? boat.length : boat.beam, kind: 'boat', vessel: boat });
    }
    for (const side of [-1, 1]) for (let y = -34; y <= 94; y += 8) boxes.push({ id: `Defensa ${side}/${y}`, x: side * (PORT.quayX - .4), y, w: .8, h: 1.4, kind: 'fender', soft: true });
    const bollards = [-1, 1].flatMap(side => Array.from({ length: 30 }, (_, i) => -22 + i * 4).map(y => ({ x: side * (PORT.quayX + 1), y })));
    return { boxes, boats, mission, depth: 7.2, port: PORT, bollards, start: mission.start || { x: 0, y: -101, heading: 0 } };
}
