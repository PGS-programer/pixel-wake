export const MISSIONS = [
    { id: 1, title: 'Primer atraque', description: 'Entra por la bocana y atraca por estribor en el muelle E-02.', side: 1, targetX: 70.2, targetY: 57, wind: { x: 0, y: 0 }, current: { x: 0, y: 0 }, precision: 5 },
    { id: 2, title: 'La banda de babor', description: 'Mismo puerto, otra perspectiva. Atraca en W-02 por babor.', side: -1, targetX: -70.2, targetY: 57, wind: { x: 0, y: 0 }, current: { x: 0, y: 0 }, precision: 5 },
    { id: 3, title: 'Control de estribor', description: 'Afina la posición longitudinal y la alineación en E-02.', side: 1, targetX: 70.2, targetY: 57, wind: { x: 0, y: 0 }, current: { x: 0, y: 0 }, precision: 3 },
    { id: 4, title: 'Entre dos barcos', description: 'Un hueco de 30 metros. Anticipa la arrancada y usa poca máquina.', side: 1, targetX: 70.2, targetY: 57, wind: { x: 0, y: 0 }, current: { x: 0, y: 0 }, precision: 2, tight: true },
    { id: 5, title: 'Viento de través', description: 'Viento hacia el este de 6 m/s y corriente hacia el norte de 0,25 m/s.', side: -1, targetX: -70.2, targetY: 57, wind: { x: 6, y: 0 }, current: { x: 0, y: .25 }, precision: 3 },
];
export function createHarbor(mission) {
    const boxes = [
        { id: 'Dique oeste', x: -65, y: -65, w: 60, h: 12, kind: 'breakwater' },
        { id: 'Dique este', x: 65, y: -65, w: 60, h: 12, kind: 'breakwater' },
        { id: 'Muelle oeste', x: -85, y: 28, w: 20, h: 210, kind: 'quay' },
        { id: 'Muelle este', x: 85, y: 28, w: 20, h: 210, kind: 'quay' },
        { id: 'Muelle norte', x: 0, y: 135, w: 190, h: 14, kind: 'quay' },
        { id: 'Pantalán de servicio', x: -40, y: 93, w: 55, h: 5, kind: 'pier' },
        { id: 'Lancha atracada', x: -42, y: 83, w: 12, h: 4, kind: 'boat' },
        { id: 'Boya roja', x: -28, y: -87, w: 2.4, h: 2.4, kind: 'red' },
        { id: 'Boya verde', x: 28, y: -87, w: 2.4, h: 2.4, kind: 'green' },
    ];
    if (mission.tight) for (const y of [34, 80]) boxes.push({ id: `Barco vecino ${y}`, x: 70.5, y, w: 5, h: 16, kind: 'boat' });
    // Soft, finite-depth fenders are actual collision objects in front of each quay.
    for (const side of [-1, 1]) for (let y = -35; y <= 115; y += 8) boxes.push({ id: 'Defensa', x: side * 74.5, y, w: 1, h: 2, kind: 'fender', soft: true });
    return { boxes, mission, depth: 7.2, start: { x: 0, y: -185, heading: 0 },
        bollards: [-1, 1].flatMap(side => [35, 45, 54, 57, 60, 69, 79].map(y => ({ x: side * 76, y }))) };
}
