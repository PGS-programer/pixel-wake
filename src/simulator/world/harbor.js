// Small fictitious Mediterranean harbour. Navigation coordinates: east X, north Y.
export const PORT = Object.freeze({ quayX: 50, northY: 86, gateY: -30, entryY: -17, entranceHalfWidth: 25, targetY: 25 });
const calm = { wind: { x: 0, y: 0 }, current: { x: 0, y: 0 } };
const easy = { minGap: .4, maxGap: 5.5, angleDeg: 16, surge: .28, sway: .16, yaw: .012, hold: 2, safeSpeed: .33, finalSpeedKn: 2.5 };
const normal = { minGap: .4, maxGap: 4.5, angleDeg: 12, surge: .25, sway: .14, yaw: .010, hold: 2.5, safeSpeed: .29, finalSpeedKn: 2 };
const advanced = { minGap: .4, maxGap: 3.8, angleDeg: 10, surge: .22, sway: .12, yaw: .008, hold: 3, safeSpeed: .26, finalSpeedKn: 2 };
export const MISSIONS = [
    { id: 1, title: 'Primer atraque', description: 'E-02 está a estribor, a unos 32 m. Corrige el rumbo, reduce arrancada y alinéate con la franja iluminada.', side: 1, targetX: 45.4, targetY: PORT.targetY, ...calm, precision: 9, docking: easy, zoneLength: 43, zoneWidth: 11.5, start: { x: 26, y: 0, heading: .45 } },
    { id: 2, title: 'La banda de babor', description: 'W-02 a babor, a unos 32 m. Practica la maniobra por el costado izquierdo, con espacio para corregir.', side: -1, targetX: -45.4, targetY: PORT.targetY, ...calm, precision: 8, docking: easy, zoneLength: 41, zoneWidth: 11.5, start: { x: -26, y: 0, heading: -.45 } },
    { id: 3, title: 'Control de estribor', description: 'E-02 a estribor. Empiezas en la dársena: combina las dos hélices y afina la alineación.', side: 1, targetX: 45.4, targetY: PORT.targetY, ...calm, precision: 6, docking: normal, zoneLength: 37, zoneWidth: 10, start: { x: 21, y: -1, heading: .65 } },
    { id: 4, title: 'Entre dos barcos', description: 'E-02 a estribor, entre dos yates. Conserva margen de proa y popa y entra muy despacio.', side: 1, targetX: 45.4, targetY: PORT.targetY, ...calm, precision: 4, docking: advanced, tight: true, zoneLength: 34, zoneWidth: 9.5, start: { x: 22, y: 2, heading: .55 } },
    { id: 5, title: 'Viento de través', description: 'W-02 a babor. Compensa viento al este de 6 m/s y corriente norte de 0,25 m/s desde el inicio.', side: -1, targetX: -45.4, targetY: PORT.targetY, wind: { x: 6, y: 0 }, current: { x: 0, y: .25 }, precision: 5, docking: normal, zoneLength: 37, zoneWidth: 10, start: { x: -23, y: 0, heading: -.55 } },
];
export function createHarbor(mission) {
    const boxes = [
        { id: 'Dique oeste', x: -42, y: PORT.gateY, w: 36, h: 9, kind: 'breakwater' },
        { id: 'Dique este', x: 42, y: PORT.gateY, w: 36, h: 9, kind: 'breakwater' },
        { id: 'Muelle oeste', x: -56, y: 28, w: 12, h: 116, kind: 'quay' },
        { id: 'Muelle este', x: 56, y: 28, w: 12, h: 116, kind: 'quay' },
        { id: 'Muelle norte', x: 0, y: 92, w: 124, h: 12, kind: 'quay' },
        { id: 'Ribera de la marina', x: 80, y: 45, w: 48, h: 158, kind: 'shore' },
        { id: 'Pantalán ouest', x: -38, y: 64, w: 24, h: 3, kind: 'pier' },
        { id: 'Boya roja', x: -24, y: -42, w: 2.4, h: 2.4, kind: 'red' },
        { id: 'Boya verde', x: 24, y: -42, w: 2.4, h: 2.4, kind: 'green' },
    ];
    // Physical boxes and rendered vessels originate from the same dimensions.
    const boats = [
        { id: 'Llaüt Brisa', x: -35, y: 57.8, length: 11, beam: 3.5, heading: Math.PI / 2, type: 'fishing', color: '#2f6874', shore: { axis: 'y', value: 63.4 } },
        { id: 'Velero Alzina', x: -36, y: 80, length: 13, beam: 3.8, heading: Math.PI / 2, type: 'sail', color: '#e3e4d9', shore: { axis: 'y', value: 87 } },
        { id: 'Velero Cala', x: -16, y: 80.4, length: 11.5, beam: 3.5, heading: Math.PI / 2, type: 'sail', color: '#e1dccd', shore: { axis: 'y', value: 87 } },
        { id: 'Yate Nacre', x: 4, y: 80, length: 15, beam: 4.4, heading: Math.PI / 2, type: 'yacht', color: '#f2efe6', shore: { axis: 'y', value: 87 } },
        { id: 'Yate Sirocco', x: 26, y: 80, length: 15, beam: 4.4, heading: Math.PI / 2, type: 'yacht', color: '#dbd7cc', shore: { axis: 'y', value: 87 } },
        { id: 'Servicio Far', x: 45.5, y: 75.5, length: 10, beam: 3.2, heading: 0, type: 'work', color: '#547c82', shore: { axis: 'x', value: 51 } },
        { id: 'Lancha Tramuntana', x: -45.5, y: -13, length: 10, beam: 3.2, heading: Math.PI, type: 'leisure', color: '#f1e6d5', shore: { axis: 'x', value: -51 } },
    ];
    for(const x of [-46,-26,-6,15,38]) boxes.push({id:`Finger ${x}`,x,y:81,w:1.2,h:10,kind:'finger'});
    if (mission.tight) for (const y of [-4, 55]) boats.push({ id: `Vecino ${y}`, x: 45.5, y, length: 13, beam: 3.6, heading: 0, type: 'yacht', color: '#d4e2de', shore: { axis: 'x', value: 51 } });
    for (const boat of boats) {
        const north = Math.abs(Math.cos(boat.heading)) > .5;
        boxes.push({ id: boat.id, x: boat.x, y: boat.y, w: north ? boat.beam : boat.length, h: north ? boat.length : boat.beam, kind: 'boat', vessel: boat });
    }
    for (const side of [-1, 1]) for (let y = -22; y <= 82; y += 8) boxes.push({ id: `Defensa ${side}/${y}`, x: side * (PORT.quayX - .4), y, w: .8, h: 1.4, kind: 'fender', soft: true });
    const bollards = [-1, 1].flatMap(side => Array.from({ length: 27 }, (_, i) => -18 + i * 4).map(y => ({ x: side * (PORT.quayX + 1), y })));
    return { boxes, boats, mission, depth: 7.2, port: PORT, bollards, start: mission.start || { x: 0, y: 0, heading: 0 } };
}
