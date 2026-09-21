/* ================= render.js =================
   Generación del mes y pintado del MODO ESCRITORIO (tabla).
   El calendario carrusel vive en carousel.js.
   refrescar() re-pinta ambos modos y los resúmenes, y guarda.
============================================================ */
"use strict";

/** genera (o recarga desde localStorage) el mes según los campos del formulario */
function generarMes(preferGuardado){
  estado.empleado = document.getElementById("fEmpleado").value;
  estado.mes      = +document.getElementById("fMes").value;
  estado.anio     = +document.getElementById("fAnio").value;

  // feriados del año (nacionales + Semana Santa + Arequipa opcional)
  estado.feriados = feriadosPeru(estado.anio, cfg.feriadosArequipa);

  let guardado = null;
  if(preferGuardado && estado.empleado.trim()){
    const all = loadAll();
    guardado = all[dataKey()] || null;
  }

  const ndias = new Date(estado.anio, estado.mes + 1, 0).getDate();
  estado.dias = [];
  for(let i = 1; i <= ndias; i++){
    const fecha = new Date(estado.anio, estado.mes, i);
    const dow = fecha.getDay();
    const g = (guardado && guardado.dias && guardado.dias[i-1]) ? guardado.dias[i-1] : {};
    estado.dias.push({
      dia:i, dow,
      ent:  g.ent  || "", sal:  g.sal  || "",
      ent2: g.ent2 || "", sal2: g.sal2 || "",
      extraManual: (g.extraManual !== undefined ? g.extraManual : null), // null = usar sugerido
      baja: g.baja || "", desc: g.desc || "", nota: g.nota || ""
    });
  }
  refrescar();
}

/** re-pinta todo (tabla + calendario + resúmenes) y guarda */
function refrescar(){
  renderTabla();
  if(typeof renderCalendario === "function") renderCalendario();
  renderResumenLateral();
  saveEstado();
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
    tr.className = (t === "domingo" ? "domingo" : t === "feriado" ? "feriado" : t === "sabado" ? "sabado" : "");
    if(d.dow === 1 && idx !== 0) tr.className += " semana-inicio";   // separación entre semanas
    if(c.extra > 0) tr.className += " tiene-extra";
    if(c.baja  > 0) tr.className += " tiene-baja";

    const editable = (t !== "domingo" && t !== "feriado");
    const inp = (field, val) =>
      `<input class="cellinput" data-i="${idx}" data-f="${field}" value="${val || ""}" placeholder="--:--" ${editable ? "" : "disabled"}>`;

    const balCls   = c.balanceDia > 0.0001 ? "bal-pos" : (c.balanceDia < -0.0001 ? "bal-neg" : "muted-num");
    const extraCls = (d.extraManual != null) ? "calc" : "muted-num";
    const descVal  = fer ? fer : (d.desc || "");

    tr.innerHTML = `
      <td class="col-dia">${DIAS[d.dow]}</td>
      <td class="col-fecha">${String(d.dia).padStart(2,"0")}/${String(estado.mes+1).padStart(2,"0")}</td>
      <td>${inp("ent",  d.ent)}</td>
      <td>${inp("sal",  d.sal)}</td>
      <td>${inp("ent2", d.ent2)}</td>
      <td>${inp("sal2", d.sal2)}</td>
      <td class="calc">${c.valido ? fmt(c.trab) : "—"}</td>
      <td class="calc">${c.meta > 0 ? fmt(c.normales) : "—"}</td>
      <td class="col-extra"><input class="cellinput ${extraCls}" data-i="${idx}" data-f="extra"
           value="${c.extra > 0 ? fmt(c.extra) : (d.extraManual != null ? fmt(d.extraManual) : "")}"
           placeholder="${c.extraSug > 0 ? fmt(c.extraSug) : "0.00"}" ${editable ? "" : "disabled"}
           title="Sugerido: ${fmt(c.extraSug)}"></td>
      <td class="col-baja"><input class="cellinput" data-i="${idx}" data-f="baja" value="${d.baja || ""}" placeholder="0.00" ${editable ? "" : "disabled"}></td>
      <td><input class="cellinput descinput" data-i="${idx}" data-f="desc" value="${descVal.replace(/"/g,'&quot;')}" placeholder="—" ${fer ? "readonly title='Feriado automático'" : ""}></td>
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

/* ---------- resumen lateral (compartido) ---------- */
function renderResumenLateral(){
  const m = calcMes();
  document.getElementById("kHoras").textContent = fmt(m.trab);
  document.getElementById("kMeta").textContent  = fmt(m.meta);
  document.getElementById("kNorm").textContent  = fmt(m.normales);
  document.getElementById("kExtra").textContent = fmt(m.extras);
  document.getElementById("kBaja").textContent  = fmt(m.baja);
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
  document.querySelectorAll("#tbody .cellinput").forEach(inp => {
    inp.addEventListener("change", onEdit);
    if(["ent","sal","ent2","sal2"].includes(inp.dataset.f)){
      inp.addEventListener("blur", e => { e.target.value = normHora(e.target.value); });
    }
  });
}

/** aplica una edición al día `i`, campo `f`, valor `v` (usado por tabla y calendario) */
function aplicarEdicion(i, f, v){
  const d = estado.dias[i];
  if(["ent","sal","ent2","sal2"].includes(f)){
    d[f] = normHora(v);
  } else if(f === "extra"){
    if(String(v).trim() === "") d.extraManual = null;                 // vacío → volver a sugerido
    else { const n = parseFloat(String(v).replace(",",".")); d.extraManual = isNaN(n) ? null : n; }
  } else if(f === "baja"){
    const n = parseFloat(String(v).replace(",",".")); d.baja = isNaN(n) ? "" : n;
  } else if(f === "desc"){
    d.desc = v;
  } else if(f === "nota"){
    d.nota = v;
  }
}

function onEdit(e){
  aplicarEdicion(+e.target.dataset.i, e.target.dataset.f, e.target.value);
  refrescar();
}
