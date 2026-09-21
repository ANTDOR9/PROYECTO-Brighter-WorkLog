/* ================= carousel.js =================
   MODO CALENDARIO: carrusel horizontal de tarjetas glass, una por día.
   Cada tarjeta permite registrar marcas y una nota editable.
   Al final del mes hay una tarjeta especial de "Cierre de mes" con
   los accesos directos de descarga.
============================================================ */
"use strict";

const ICONO = {
  reloj: '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  nota:  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v12l-4 4H4z"/><path d="M16 20v-4h4"/></svg>',
  descargar: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M7 10l5 5 5-5"/><path d="M5 21h14"/></svg>',
  imprimir:  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V3h12v6"/><rect x="6" y="13" width="12" height="8"/><path d="M6 17H3v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6h-3"/></svg>',
  tabla: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 10h18M9 4v16"/></svg>'
};

function chipEstado(t, fer){
  if(fer) return `<span class="cal-chip f">${fer}</span>`;
  if(t === "domingo") return `<span class="cal-chip d">Domingo</span>`;
  if(t === "sabado")  return `<span class="cal-chip s">Media jornada</span>`;
  return `<span class="cal-chip c">Jornada completa</span>`;
}

function renderCalendario(){
  const track = document.getElementById("calTrack");
  if(!track) return;
  const scrollPrev = track.scrollLeft;
  track.innerHTML = "";

  // título del calendario
  const tit = document.getElementById("calTitulo");
  if(tit) tit.textContent = (estado.empleado.trim() || "(sin nombre)") + " · " + MESES[estado.mes] + " " + estado.anio;

  estado.dias.forEach((d, idx) => {
    const c = calcDia(d);
    const t = tipoDia(d);
    const fer = nombreFeriado(d);
    const editable = (t !== "domingo" && t !== "feriado");

    const card = document.createElement("div");
    card.className = "cal-card glass" +
      (t === "domingo" ? " es-domingo" : t === "feriado" ? " es-feriado" : t === "sabado" ? " es-sabado" : "") +
      (c.extra > 0 ? " con-extra" : "");

    const marca = (f, val, ph) =>
      `<input class="cal-time" data-i="${idx}" data-f="${f}" value="${val || ""}" placeholder="${ph}" ${editable ? "" : "disabled"}>`;

    const balTxt = (c.valido && c.meta > 0)
      ? `<span class="${c.balanceDia>=0?'bal-pos':'bal-neg'}">${c.balanceDia>=0?"+":""}${fmt(c.balanceDia)} h</span>`
      : "";

    card.innerHTML = `
      <div class="cal-top">
        <div class="cal-dow">${DIAS[d.dow]}</div>
        <div class="cal-fecha"><span class="cal-num">${String(d.dia).padStart(2,"0")}</span><span class="cal-mes">${MESES[estado.mes].slice(0,3).toUpperCase()}</span></div>
      </div>
      ${chipEstado(t, fer)}
      <div class="cal-marcas">
        <label>Entrada</label><label>Salida</label>
        ${marca("ent", d.ent, "--:--")}${marca("sal", d.sal, "--:--")}
        <label>Entrada 2</label><label>Salida 2</label>
        ${marca("ent2", d.ent2, "--:--")}${marca("sal2", d.sal2, "--:--")}
      </div>
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

  // ---- tarjeta especial: cierre de mes ----
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

  track.scrollLeft = scrollPrev;
  bindCalInputs();
}

function bindCalInputs(){
  document.querySelectorAll("#calTrack .cal-time, #calTrack .cal-nota").forEach(inp => {
    inp.addEventListener("change", e => {
      const track = document.getElementById("calTrack");
      const sp = track.scrollLeft;
      aplicarEdicion(+e.target.dataset.i, e.target.dataset.f, e.target.value);
      refrescar();
      track.scrollLeft = sp;
    });
  });
}

/* navegación del carrusel */
function calScroll(dir){
  const track = document.getElementById("calTrack");
  const card = track.querySelector(".cal-card");
  const paso = card ? card.offsetWidth + 16 : 260;
  track.scrollBy({ left: dir * paso, behavior: "smooth" });
}
