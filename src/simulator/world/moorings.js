import { bodyPoint, axes } from '../physics/vessel.js';
export const PLAYER_CLEATS = [
    { forward: 6.5, across: 2.05 }, { forward: -7, across: 2.2 },
    { forward: 3, across: 2.45 }, { forward: -3, across: 2.45 },
];
// Choose real shore fittings with an outward lead, so ropes don't cut through the deck.
export function playerMoorings(state, mission, bollards) {
    const side = mission.side, a = axes(state.heading);
    const specs = [[0, 18, 1, 'Largo de proa'], [1, -18, -1, 'Largo de popa'], [0, -10, -1, 'Esprín de proa'], [1, 10, 1, 'Esprín de popa'], [2, 4, 0, 'Través de proa'], [3, -4, 0, 'Través de popa']];
    return specs.map(([index, offset, direction, name], i) => {
        const cleat = PLAYER_CLEATS[index], starboard = side * cleat.across;
        const p = bodyPoint(state, cleat.forward, starboard);
        const candidates = bollards.filter(b => Math.sign(b.x) === side).filter(b => {
            const dx = b.x - p.x, dy = b.y - p.y;
            const outward = (dx * a.sx + dy * a.sy) * side;
            const along = dx * a.fx + dy * a.fy;
            return outward > .15 && (!direction || along * direction > .8);
        }).sort((a, b) => Math.abs(a.y - (mission.targetY + offset)) - Math.abs(b.y - (mission.targetY + offset)));
        const shore = candidates[0];
        if (!shore) return null;
        return { forward: cleat.forward, starboard, shore, rest: Math.hypot(p.x - shore.x, p.y - shore.y), secured: false, order: i + 1, name };
    }).filter(Boolean);
}
export function decorativeMoorings(boat) {
    const l=boat.length,side=boat.shore.axis==='y'?-1:1;
    return [[l*.34,l*.65,'Largo de proa'],[-l*.34,-l*.65,'Largo de popa'],[l*.3,-l*.1,'Esprín de proa'],[-l*.3,l*.1,'Esprín de popa'],[l*.1,l*.1,'Través de proa'],[-l*.1,-l*.1,'Través de popa']].map(([forward,lead,name])=>({forward,across:side*boat.beam*.4,name,shore:boat.shore.axis==='y'?{x:boat.x+lead,y:boat.shore.value}:{x:boat.shore.value,y:boat.y+lead}}));
}
