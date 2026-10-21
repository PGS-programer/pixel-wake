export class Tutorial {
    constructor(){this.index=0;this.hidden=false;this.rudderMoved=false;}
    update(s,controls,mission){
        if(this.hidden)return;
        if(Math.abs(s.rudder)>.1)this.rudderMoved=true;
        const steps=[
            ['Mira desde el puente','Arrastra el ratón o el dedo sobre el cristal. 1 / 2 / 3 cambian al centro y a las bandas. Z acerca los instrumentos.',controls.looked],
            ['Dos motores independientes','Mantén W para babor y O para estribor. Cada palanca conserva su mando al soltar. También puedes arrastrar las palancas 3D.',s.port.lever>.18&&s.starboard.lever>.18],
            ['Conserva la arrancada','N ordena punto muerto a ambos motores. Observa cómo el barco sigue avanzando.',Math.abs(s.port.lever)<.055&&Math.abs(s.starboard.lever)<.055],
            ['Máquina atrás','Mantén S y L. El engranaje pasa por neutral y espera antes de invertir. Es frenado por empuje, no un freno instantáneo.',s.port.shaft<-.12&&s.starboard.shaft<-.12],
            ['Timón y flujo','Pon N. Usa ← o → hasta al menos 6°. ↑ ordena volver a la vía. Sin flujo, el timón por sí solo no hace girar el barco.',this.rudderMoved&&Math.abs(s.rudder)<.025&&Math.abs(s.rudderOrder)<.01],
            ['Maniobra con dos hélices','Da un poco de W y L: babor avante, estribor atrás. Observa el giro. Usa N al terminar.',s.port.shaft>.12&&s.starboard.shaft<-.12],
            ['Tu puesto está cerca','Ya estás dentro de la marina. La flecha y la baliza señalan tu amarre; usa pequeños impulsos para corregir rumbo y acercarte.',mission.entered],
            ['Aproximación al muelle','La zona translúcida señala tu puesto. Reduce antes de llegar. Controla SOG y la distancia de banda; 2/3 permiten asomarte.',mission.phase==='posicionamiento'],
            ['Prepara el amarre',`Queda paralelo, a ${mission.config.docking.minGap}–${mission.config.docking.maxGap} m y casi detenido. Ambos mandos en N durante ${mission.config.docking.hold} s. Pulsa M cuando la zona se vuelva verde.`,mission.lines.length>0],
            ['Tripulación trabajando','Los largos, esprines y traveses se aseguran en sus bolardos. Conserva la posición segura hasta terminar.',mission.finished],
        ];
        if(steps[this.index]?.[2]&&this.index<steps.length-1)this.index++;
        this.current=steps[this.index];this.total=steps.length;
    }
}
