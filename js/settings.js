/* ================= settings.js =================
   Modal de "Ajustes avanzados": días laborables, topes, media jornada,
   tolerancia de extras y feriados regionales de Arequipa.
============================================================ */
"use strict";

function abrirConfig(){
  const cont = document.getElementById("diasSemana");
  cont.innerHTML = "";
  [1,2,3,4,5,6,0].forEach(dw => {
    const on = cfg.diasLaborables.includes(dw);
    const b = document.createElement("button");
    b.textContent = DIAS[dw].slice(0,3);
    b.className = on ? "primary" : "";
    b.dataset.dw = dw;
    b.onclick = () => b.classList.toggle("primary");
    cont.appendChild(b);
  });

  const sel = document.getElementById("cDiaMedio");
  sel.innerHTML = "";
  [1,2,3,4,5,6,0].forEach(dw => {
    const o = document.createElement("option");
    o.value = dw; o.textContent = DIAS[dw];
    if(dw === cfg.diaMedio) o.selected = true;
    sel.appendChild(o);
  });

  document.getElementById("cTopeCompleto").value = cfg.topeCompleto;
  document.getElementById("cTopeMedio").value    = cfg.topeMedio;
  document.getElementById("cTolerancia").value   = cfg.toleranciaExtraMin || 0;
  document.getElementById("cTarifaN").value      = cfg.tarifaNormal;
  document.getElementById("cTarifaE").value      = cfg.tarifaExtra;
  document.getElementById("cMoneda").value       = cfg.moneda || "S/";
  document.getElementById("cCorreo").value       = cfg.correoDestino || "";
  document.getElementById("cArequipa").checked   = !!cfg.feriadosArequipa;
  document.getElementById("dlgConfig").showModal();
}

function restaurarDefaults(){
  if(!confirm("¿Restaurar todos los ajustes a los valores originales?")) return;
  cfg = Object.assign({}, CFG_DEFAULT);
  saveCfg();
  abrirConfig();     // recarga los campos del modal con los valores por defecto
  refrescar();
}

function guardarConfig(){
  const dias = [...document.querySelectorAll("#diasSemana button.primary")].map(b => +b.dataset.dw);
  cfg.diasLaborables    = dias.length ? dias : [1,2,3,4,5,6];
  cfg.diaMedio          = +document.getElementById("cDiaMedio").value;
  cfg.topeCompleto      = parseFloat(document.getElementById("cTopeCompleto").value) || 8.5;
  cfg.topeMedio         = parseFloat(document.getElementById("cTopeMedio").value)    || 5.5;
  cfg.toleranciaExtraMin= parseFloat(document.getElementById("cTolerancia").value)   || 0;
  cfg.tarifaNormal      = parseFloat(document.getElementById("cTarifaN").value) || 0;
  cfg.tarifaExtra       = parseFloat(document.getElementById("cTarifaE").value) || 0;
  cfg.moneda            = (document.getElementById("cMoneda").value || "S/").trim();
  cfg.correoDestino     = (document.getElementById("cCorreo").value || "").trim();
  cfg.feriadosArequipa  = document.getElementById("cArequipa").checked;
  saveCfg();
  document.getElementById("dlgConfig").close();
  // recalcular feriados del año por si cambió lo de Arequipa
  estado.feriados = feriadosPeru(estado.anio, cfg.feriadosArequipa);
  refrescar();
}
