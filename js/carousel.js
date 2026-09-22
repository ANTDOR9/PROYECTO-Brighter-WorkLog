/* ================= carousel.js =================
   MODO CALENDARIO: carrusel de tarjetas glass, una por día.
   Turnos dinámicos, nota, cambio de tipo de día y foco (agranda la
   tarjeta seleccionada y oscurece el resto). Tarjeta de cierre de mes.
============================================================ */
"use strict";

const ICONO = {
  reloj: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  nota:  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/></svg>',
  descargar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  imprimir:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8"/><path d="M6 17H3v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6h-3"/></svg>',
  tabla: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>'
};

let _calActiva = null;   // índice de la tarjeta con foco

function renderCalendario(){
  const track = document.getElementById("calTrack");
  if(!track) return;
  const scrollPrev = track.scrollLeft;
  track.innerHTML = "";

  const tit = document.getElementById("calTitulo");
  if(tit) tit.textContent = (estado.empleado.trim() || "(sin nombre)") + " · " + MESES[estado.mes] + " " + estado.anio;

  estado.dias.forEach((d, idx) => {
    const c = calcDia(d);
    const t = tipoDia(d);
    const fer = nombreFeriado(d);

    const card = document.createElement("div");
    card.className = "cal-card glass" +
      (t==="domingo"?" es-domingo":t==="feriado"?" es-feriado":t==="sabado"?" es-sabado":"") +
      (c.extra>0?" con-extra":"") + (_calActiva===idx?" activa":"");
    card.dataset.i = idx;

    let turnos = '<div class="cal-turnos">';
    d.turnos.forEach((tt, ti) => {
      turnos +=
        `<div class="cal-turno">
           <input type="time" class="cal-time" data-i="${idx}" data-t="${ti}" data-k="ent" value="${tt.ent||""}">
           <span class="tsep">–</span>
           <input type="time" class="cal-time" data-i="${idx}" data-t="${ti}" data-k="sal" value="${tt.sal||""}">
           ${d.turnos.length>1?`<button class="tdel" onclick="quitarTurno(${idx},${ti})" title="Quitar">×</button>`:""}
         </div>`;
    });
    turnos += `<button class="tadd" onclick="agregarTurno(${idx})">+ turno</button></div>`;

    const balTxt = (c.valido && c.meta>0)
      ? `<span class="${c.balanceDia>=0?'bal-pos':'bal-neg'}">${c.balanceDia>=0?"+":""}${fmt(c.balanceDia)} h</span>` : "";

    card.innerHTML = `
      ${_calActiva===idx?'<button class="cal-cerrar" onclick="calFoco(null,event)">×</button>':''}
      <div class="cal-top">
        <div class="cal-dow">${DIAS[d.dow]}</div>
        <div class="cal-fecha"><span class="cal-num">${String(d.dia).padStart(2,"0")}</span><span class="cal-mes">${MESES[estado.mes].slice(0,3).toUpperCase()}</span></div>
      </div>
      <button class="cal-chip tc-${t}" onclick="abrirTipoDia(${idx})" title="Clic para cambiar el tipo de día">${tipoLabel(t)}${fer?" · "+fer:""}</button>
      ${turnos}
      <div class="cal-horas">
        <span>${ICONO.reloj} ${c.valido ? fmt(c.trab)+" h" : "—"}</span>
        ${c.extra>0?`<span class="cal-extra">+${fmt(c.extra)} extra</span>`:""}
        ${balTxt}
      </div>
      <div class="cal-notabox">
        <div class="cal-notalbl">${ICONO.nota} Nota</div>
        <textarea class="cal-nota" data-i="${idx}" data-f="nota" rows="2" placeholder="Escribe una nota para este día…">${(d.nota||"").replace(/</g,"&lt;")}</textarea>
      </div>`;
    track.appendChild(card);
  });

  // tarjeta de cierre de mes
  const m = calcMes();
  const cierre = document.createElement("div");
  cierre.className = "cal-card cal-cierre glass";
  cierre.innerHTML = `
    <div class="cierre-badge">Fin de ${MESES[estado.mes]}</div>
    <h3>Resumen laboral</h3>
    <div class="cierre-grid">
      <div><span class="n">${fmt(m.trab)}</span><span class="l">Trabajadas</span></div>
      <div><span class="n">${fmt(m.normales)}</span><span class="l">Normales</span></div>
      <div><span class="n">${fmt(m.extras)}</span><span class="l">Extras</span></div>
      <div><span class="n ${m.balance>=0?'bal-pos':'bal-neg'}">${m.balance>=0?"+":""}${fmt(m.balance)}</span><span class="l">Balance</span></div>
    </div>
    <div class="cierre-btns">
      <button class="btn-glass" onclick="exportarExcel()">${ICONO.descargar} Descargar Excel</button>
      <button class="btn-glass" onclick="imprimir()">${ICONO.imprimir} Imprimir</button>
      <button class="btn-glass" onclick="cambiarModo('escritorio')">${ICONO.tabla} Ver en modo escritorio</button>
    </div>
    <div class="cierre-hint">Aquí se cierran las cuentas del mes: los excesos compensan las faltas y el neto se paga como extra.</div>`;
  track.appendChild(cierre);

  track.classList.toggle("modo-foco", _calActiva !== null);
  track.scrollLeft = scrollPrev;
  bindCalInputs();
}

/* foco: agranda una tarjeta y oscurece el resto */
function calFoco(idx, ev){
  if(ev) ev.stopPropagation();
  _calActiva = idx;
  renderCalendario();
}

function bindCalInputs(){
  // clic en la tarjeta (no en inputs/botones) → foco
  document.querySelectorAll("#calTrack .cal-card:not(.cal-cierre)").forEach(card => {
    card.addEventListener("click", e => {
      if(e.target.closest("input,textarea,button")) return;
      calFoco(+card.dataset.i, e);
    });
  });
  document.querySelectorAll("#calTrack .cal-time").forEach(inp => {
    inp.addEventListener("change", e => {
      const sp = document.getElementById("calTrack").scrollLeft;
      aplicarTurno(+e.target.dataset.i, +e.target.dataset.t, e.target.dataset.k, e.target.value);
      refrescar(); document.getElementById("calTrack").scrollLeft = sp;
    });
  });
  document.querySelectorAll("#calTrack .cal-nota").forEach(inp => {
    inp.addEventListener("change", e => {
      const sp = document.getElementById("calTrack").scrollLeft;
      aplicarEdicion(+e.target.dataset.i, e.target.dataset.f, e.target.value);
      refrescar(); document.getElementById("calTrack").scrollLeft = sp;
    });
  });
}

function calScroll(dir){
  const track = document.getElementById("calTrack");
  const card = track.querySelector(".cal-card");
  const paso = card ? card.offsetWidth + 16 : 260;
  track.scrollBy({ left: dir * paso, behavior: "smooth" });
}
