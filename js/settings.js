/* ================= settings.js =================
   Modal de "Ajustes avanzados": días laborables, topes y media jornada.
============================================================ */
"use strict";

function abrirConfig(){
  // botones de días de la semana (orden Lun..Dom)
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

  // selector de día de media jornada
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
  document.getElementById("dlgConfig").showModal();
}

function guardarConfig(){
  const dias = [...document.querySelectorAll("#diasSemana button.primary")].map(b => +b.dataset.dw);
  cfg.diasLaborables = dias.length ? dias : [1,2,3,4,5,6];
  cfg.diaMedio      = +document.getElementById("cDiaMedio").value;
  cfg.topeCompleto  = parseFloat(document.getElementById("cTopeCompleto").value) || 8.5;
  cfg.topeMedio     = parseFloat(document.getElementById("cTopeMedio").value)    || 5.5;
  saveCfg();
  document.getElementById("dlgConfig").close();
  render();
}
