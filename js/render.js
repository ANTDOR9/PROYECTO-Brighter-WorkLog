/* ================= render.js =================
   Generación del mes, MODO ESCRITORIO (tabla) y edición compartida.
============================================================ */
"use strict";

/* etiqueta corta del tipo de día */
function tipoLabel(t){
  return t==="completo"?"Completo" : t==="sabado"?"Media jornada" : t==="feriado"?"Feriado" : "No laborable";
}

/** genera (o recarga desde la nube/localStorage) el mes según el formulario */
async function generarMes(preferGuardado){
  if(typeof _soloLectura !== "undefined") _soloLectura = false;
  estado.empleado = document.getElementById("fEmpleado").value;
  estado.mes      = +document.getElementById("fMes").value;
  estado.anio     = +document.getElementById("fAnio").value;
  estado.feriados = feriadosPeru(estado.anio, cfg.feriadosArequipa);

  let guardado = null;
  if(preferGuardado && estado.empleado.trim()){
    if(MODO_NUBE){ try{ guardado = await cloudCargarRegistro(estado.empleado, estado.anio, estado.mes); }catch(e){} }
    if(!guardado){ const all = loadAll(); guardado = all[dataKey()] || null; }
  }

  const ndias = new Date(estado.anio, estado.mes + 1, 0).getDate();
  estado.dias = [];
  for(let i = 1; i <= ndias; i++){
    const dow = new Date(estado.anio, estado.mes, i).getDay();
    const g = (guardado && guardado.dias && guardado.dias[i-1]) ? guardado.dias[i-1] : {};
    estado.dias.push({
      dia:i, dow,
      turnos: normalizarDia(g),
      extraManual: (g.extraManual !== undefined ? g.extraManual : null),
      baja: g.baja || "", desc: g.desc || "", nota: g.nota || "",
      tipoManual: g.tipoManual || null
    });
  }
  refrescar();
}

/** re-pinta todo y guarda */
function refrescar(){
  renderTabla();
  if(typeof renderCalendario === "function") renderCalendario();
  renderResumenLateral();
  saveEstado();
}

/* ---------- edición compartida (tabla + calendario) ---------- */
function aplicarEdicion(i, f, v){
  const d = estado.dias[i];
  if(f === "extra"){
    if(String(v).trim() === "") d.extraManual = null;
    else { const n = parseFloat(String(v).replace(",",".")); d.extraManual = isNaN(n) ? null : n; }
  } else if(f === "baja"){ const n = parseFloat(String(v).replace(",",".")); d.baja = isNaN(n) ? "" : n; }
  else if(f === "desc"){ d.desc = v; }
  else if(f === "nota"){ d.nota = v; }
}
function aplicarTurno(i, ti, k, v){
  const d = estado.dias[i];
  if(!d.turnos[ti]) d.turnos[ti] = { ent:"", sal:"" };
  d.turnos[ti][k] = v;
}
function agregarTurno(i){ estado.dias[i].turnos.push({ ent:"", sal:"" }); refrescar(); }
function quitarTurno(i, ti){ estado.dias[i].turnos.splice(ti,1); if(!estado.dias[i].turnos.length) estado.dias[i].turnos.push({ent:"",sal:""}); refrescar(); }

/* ---------- cambio de tipo de día (con aviso) ---------- */
let _tipoTarget = null;
function abrirTipoDia(i){
  _tipoTarget = i;
  const d = estado.dias[i];
  const t = tipoDia(d);
  document.getElementById("tipoDiaActual").textContent =
    DIAS[d.dow] + " " + String(d.dia).padStart(2,"0") + " · actualmente: " + tipoLabel(t);
  document.getElementById("dlgTipo").showModal();
}
function setTipoDia(tipo){
  if(_tipoTarget == null) return;
  // 'auto' quita el override; los demás lo fijan
  estado.dias[_tipoTarget].tipoManual = (tipo === "auto") ? null : tipo;
  document.getElementById("dlgTipo").close();
  refrescar();
}

/* ---------- MODO ESCRITORIO: tabla ---------- */
function renderTabla(){
  document.getElementById("tblTitulo").textContent =
    "Resumen de horas — " + (estado.empleado.trim() || "(sin nombre)") +
    " · " + MESES[estado.mes] + " " + estado.anio;
  document.getElementById("lTopeD").textContent = fmt(cfg.topeCompleto);
  document.getElementById("lTopeS").textContent = fmt(cfg.topeMedio);

  const tb = document.getElementById("tbody");
  tb.innerHTML = "";

  estado.dias.forEach((d, idx) => {
    const c = calcDia(d);
    const t = tipoDia(d);
    const fer = nombreFeriado(d);

    const tr = document.createElement("tr");
    tr.className = (t==="domingo"?"domingo":t==="feriado"?"feriado":t==="sabado"?"sabado":"");
    if(d.dow === 1 && idx !== 0) tr.className += " semana-inicio";
    if(c.extra > 0) tr.className += " tiene-extra";
    if(c.baja  > 0) tr.className += " tiene-baja";
    if(d.tipoManual) tr.className += " tipo-manual";

    // celda de turnos
    let turnosHtml = '<div class="turnos">';
    d.turnos.forEach((tt, ti) => {
      turnosHtml +=
        `<div class="turno">
           <input type="time" class="tinp" data-i="${idx}" data-t="${ti}" data-k="ent" value="${tt.ent||""}">
           <span class="tsep">–</span>
           <input type="time" class="tinp" data-i="${idx}" data-t="${ti}" data-k="sal" value="${tt.sal||""}">
           ${d.turnos.length>1?`<button class="tdel" title="Quitar turno" onclick="quitarTurno(${idx},${ti})">×</button>`:""}
         </div>`;
    });
    turnosHtml += `<button class="tadd" onclick="agregarTurno(${idx})">+ turno</button></div>`;

    const balCls   = c.balanceDia > 0.0001 ? "bal-pos" : (c.balanceDia < -0.0001 ? "bal-neg" : "muted-num");
    const extraCls = (d.extraManual != null) ? "calc" : "muted-num";
    const descVal  = fer ? fer : (d.desc || "");

    tr.innerHTML = `
      <td class="col-dia">
        <button class="tipo-chip tc-${t}" onclick="abrirTipoDia(${idx})" title="Clic para cambiar el tipo de día">${tipoLabel(t)}</button>
        <div class="dia-nombre">${DIAS[d.dow]} ${String(d.dia).padStart(2,"0")}/${String(estado.mes+1).padStart(2,"0")}</div>
      </td>
      <td class="col-turnos">${turnosHtml}</td>
      <td class="calc">${c.valido ? fmt(c.trab) : "—"}</td>
      <td class="calc">${c.meta > 0 ? fmt(c.normales) : "—"}</td>
      <td class="col-extra"><input class="cellinput ${extraCls}" data-i="${idx}" data-f="extra"
           value="${c.extra > 0 ? fmt(c.extra) : (d.extraManual != null ? fmt(d.extraManual) : "")}"
           placeholder="${c.extraSug > 0 ? fmt(c.extraSug) : "0.00"}" title="Sugerido: ${fmt(c.extraSug)}"></td>
      <td class="col-baja"><input class="cellinput" data-i="${idx}" data-f="baja" value="${d.baja || ""}" placeholder="0.00"></td>
      <td><input class="cellinput descinput" data-i="${idx}" data-f="desc" value="${descVal.replace(/"/g,'&quot;')}" placeholder="—" ${fer?"readonly":""}></td>
      <td class="calc">${fmt(c.total)}</td>
      <td class="${balCls}">${c.valido && c.meta > 0 ? (c.balanceDia >= 0 ? "+" : "") + fmt(c.balanceDia) : "—"}</td>`;
    tb.appendChild(tr);
  });

  const m = calcMes();
  document.getElementById("tTrab").textContent  = fmt(m.trab);
  document.getElementById("tNorm").textContent  = fmt(m.normales);
  document.getElementById("tExtra").textContent = fmt(m.extras);
  document.getElementById("tBaja").textContent  = fmt(m.baja);
  document.getElementById("tTotal").textContent = fmt(m.total);
  const tBal = document.getElementById("tBal");
  tBal.textContent = (m.balance >= 0 ? "+" : "") + fmt(m.balance);
  tBal.className = m.balance > 0.0001 ? "bal-pos" : (m.balance < -0.0001 ? "bal-neg" : "muted-num");

  bindInputs();
}

function renderResumenLateral(){
  const m = calcMes();
  const mon = cfg.moneda || "S/";
  document.getElementById("kPago").textContent = mon + " " + fmt(m.salario);
  document.getElementById("kPagoSub").textContent =
    `${fmt(m.normPag)} h normales + ${fmt(m.extrasPag)} h extras`;
  document.getElementById("kHoras").textContent   = fmt(m.trab);
  document.getElementById("kMeta").textContent    = fmt(m.meta);
  document.getElementById("kNormPag").textContent = fmt(m.normPag);
  document.getElementById("kExtraPag").textContent= fmt(m.extrasPag);
  document.getElementById("kBaja").textContent    = fmt(m.baja);
  const kBal = document.getElementById("kBal");
  kBal.textContent = (m.balance >= 0 ? "+" : "") + fmt(m.balance);
  kBal.style.color = m.balance > 0.0001 ? "var(--pos)" : (m.balance < -0.0001 ? "var(--neg)" : "var(--muted)");
  const bm = document.getElementById("balMsg");
  if(m.balance > 0.0001)      bm.innerHTML = `Hay <b>${fmt(m.balance)} h</b> de exceso acumulado → se pagarán como extra al cerrar el mes.`;
  else if(m.balance < -0.0001) bm.innerHTML = `Faltan <b>${fmt(-m.balance)} h</b> para cubrir la meta del mes.`;
  else                         bm.textContent = "Las horas trabajadas cubren exactamente la meta.";
}

/* ---------- edición de celdas (tabla) ---------- */
function bindInputs(){
  document.querySelectorAll("#tbody .tinp").forEach(inp => {
    inp.addEventListener("change", e => {
      const sp = window.scrollY;
      aplicarTurno(+e.target.dataset.i, +e.target.dataset.t, e.target.dataset.k, e.target.value);
      refrescar(); window.scrollTo(0, sp);
    });
  });
  document.querySelectorAll("#tbody .cellinput").forEach(inp => {
    inp.addEventListener("change", e => {
      const sp = window.scrollY;
      aplicarEdicion(+e.target.dataset.i, e.target.dataset.f, e.target.value);
      refrescar(); window.scrollTo(0, sp);
    });
  });
}
