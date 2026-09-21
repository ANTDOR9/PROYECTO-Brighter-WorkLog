/* ================= render.js =================
   Generación del mes, pintado de la tabla y edición de celdas.
============================================================ */
"use strict";

/** genera (o recarga desde localStorage) el mes según los campos del formulario */
function generarMes(preferGuardado){
  estado.empleado = document.getElementById("fEmpleado").value;
  estado.mes      = +document.getElementById("fMes").value;
  estado.anio     = +document.getElementById("fAnio").value;

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
      baja: g.baja || "", desc: g.desc || ""
    });
  }
  render();
}

/** pinta toda la tabla y los paneles de resumen */
function render(){
  document.getElementById("tblTitulo").textContent =
    "Resumen de horas — " + (estado.empleado.trim() || "(sin nombre)") +
    " · " + MESES[estado.mes] + " " + estado.anio;
  document.getElementById("lTopeD").textContent = fmt(cfg.topeCompleto);
  document.getElementById("lTopeS").textContent = fmt(cfg.topeMedio);

  const tb = document.getElementById("tbody");
  tb.innerHTML = "";
  let sT=0, sN=0, sE=0, sB=0, sTot=0, bal=0, meta=0;

  estado.dias.forEach((d, idx) => {
    const c = calcDia(d);
    const t = tipoDia(d);
    bal  += c.balanceDia;
    meta += c.meta;
    sT += c.trab; sN += c.normales; sE += c.extra; sB += c.baja; sTot += c.total;

    const tr = document.createElement("tr");
    tr.className = (t === "domingo" ? "domingo" : t === "feriado" ? "feriado" : t === "sabado" ? "sabado" : "");
    if(c.extra > 0) tr.className += " tiene-extra";
    if(c.baja  > 0) tr.className += " tiene-baja";

    const editable = (t !== "domingo" && t !== "feriado");
    const inp = (field, val) =>
      `<input class="cellinput" data-i="${idx}" data-f="${field}" value="${val || ""}" placeholder="--:--" ${editable ? "" : "disabled"}>`;

    const balCls   = c.balanceDia > 0.0001 ? "bal-pos" : (c.balanceDia < -0.0001 ? "bal-neg" : "muted-num");
    const extraCls = (d.extraManual != null) ? "calc" : "muted-num";

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
      <td><input class="cellinput descinput" data-i="${idx}" data-f="desc" value="${(d.desc || "").replace(/"/g,'&quot;')}" placeholder="—"></td>
      <td class="calc">${fmt(c.total)}</td>
      <td class="${balCls}">${c.valido && c.meta > 0 ? (c.balanceDia >= 0 ? "+" : "") + fmt(c.balanceDia) : "—"}</td>`;
    tb.appendChild(tr);
  });

  // pie de tabla
  document.getElementById("tTrab").textContent  = fmt(sT);
  document.getElementById("tNorm").textContent  = fmt(sN);
  document.getElementById("tExtra").textContent = fmt(sE);
  document.getElementById("tBaja").textContent  = fmt(sB);
  document.getElementById("tTotal").textContent = fmt(sTot);
  const tBal = document.getElementById("tBal");
  tBal.textContent = (bal >= 0 ? "+" : "") + fmt(bal);
  tBal.className = bal > 0.0001 ? "bal-pos" : (bal < -0.0001 ? "bal-neg" : "muted-num");

  // panel derecho
  document.getElementById("kHoras").textContent = fmt(sT);
  document.getElementById("kMeta").textContent  = fmt(meta);
  document.getElementById("kNorm").textContent  = fmt(sN);
  document.getElementById("kExtra").textContent = fmt(sE);
  document.getElementById("kBaja").textContent  = fmt(sB);
  const kBal = document.getElementById("kBal");
  kBal.textContent = (bal >= 0 ? "+" : "") + fmt(bal);
  kBal.style.color = bal > 0.0001 ? "var(--pos)" : (bal < -0.0001 ? "var(--neg)" : "var(--muted)");

  const bm = document.getElementById("balMsg");
  if(bal > 0.0001)      bm.innerHTML = `Hay <b>${fmt(bal)} h</b> de exceso acumulado → se pagarán como extra al cerrar el mes.`;
  else if(bal < -0.0001) bm.innerHTML = `Faltan <b>${fmt(-bal)} h</b> para cubrir la meta del mes.`;
  else                   bm.textContent = "Las horas trabajadas cubren exactamente la meta.";

  bindInputs();
  saveEstado();
}

/* ---------- edición de celdas ---------- */
function bindInputs(){
  document.querySelectorAll(".cellinput").forEach(inp => {
    inp.addEventListener("change", onEdit);
    if(["ent","sal","ent2","sal2"].includes(inp.dataset.f)){
      inp.addEventListener("blur", e => { e.target.value = normHora(e.target.value); });
    }
  });
}

function onEdit(e){
  const i = +e.target.dataset.i, f = e.target.dataset.f;
  const d = estado.dias[i];
  const v = e.target.value;
  if(["ent","sal","ent2","sal2"].includes(f)){
    d[f] = normHora(v);
  } else if(f === "extra"){
    if(v.trim() === "") d.extraManual = null;                 // vacío → volver a sugerido
    else { const n = parseFloat(v.replace(",",".")); d.extraManual = isNaN(n) ? null : n; }
  } else if(f === "baja"){
    const n = parseFloat(v.replace(",",".")); d.baja = isNaN(n) ? "" : n;
  } else if(f === "desc"){
    d.desc = v;
  }
  render();
}
