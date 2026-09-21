/* ================= app.js =================
   Arranque: rellena controles, engancha eventos y genera el mes inicial.
   Debe cargarse al final (depende de todos los demás módulos).
============================================================ */
"use strict";

function init(){
  cfg = loadCfg();

  // opciones de mes
  const selM = document.getElementById("fMes");
  MESES.forEach((m, i) => {
    const o = document.createElement("option");
    o.value = i; o.textContent = m;
    selM.appendChild(o);
  });

  const now = new Date();
  selM.value = now.getMonth();
  document.getElementById("fAnio").value = now.getFullYear();

  // eventos
  document.getElementById("btnGenerar").onclick = () => generarMes(true);
  document.getElementById("fEmpleado").addEventListener("change", () => {
    if(estado.dias.length) generarMes(true);
  });
  document.getElementById("btnConfig").onclick        = abrirConfig;
  document.getElementById("btnGuardarConfig").onclick = guardarConfig;
  document.getElementById("btnCerrarConfig").onclick  = () => document.getElementById("dlgConfig").close();

  generarMes(false);
}

document.addEventListener("DOMContentLoaded", init);
