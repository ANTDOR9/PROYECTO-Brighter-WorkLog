/* ================= calc.js =================
   Motor de cálculo: clasificación del día y horas por día.
============================================================ */
"use strict";

/** "completo" | "sabado" (media jornada) | "domingo" (no laborable) | "feriado" */
function tipoDia(d){
  const desc = (d.desc || "").trim().toUpperCase();
  if(desc.includes("FERIADO")) return "feriado";
  if(d.dow === 0) return "domingo";
  if(!cfg.diasLaborables.includes(d.dow)) return "domingo"; // no laborable → sin meta
  if(d.dow === cfg.diaMedio) return "sabado";
  return "completo";
}

/** meta (tope) de horas del día según su tipo */
function metaDia(d){
  const t = tipoDia(d);
  if(t === "feriado" || t === "domingo") return 0;
  if(t === "sabado") return cfg.topeMedio;
  return cfg.topeCompleto;
}

/** cálculo completo de un día → objeto con todos los subtotales */
function calcDia(d){
  const e  = hmToDec(d.ent),  s  = hmToDec(d.sal);
  const e2 = hmToDec(d.ent2), s2 = hmToDec(d.sal2);

  let trab = 0, valido = false;
  if(e  != null && s  != null && s  >= e ){ trab += (s  - e ); valido = true; }
  if(e2 != null && s2 != null && s2 >= e2){ trab += (s2 - e2); valido = true; }

  const meta     = metaDia(d);
  const normales = Math.min(trab, meta);
  const extraSug = Math.max(0, trab - meta);
  const extra    = (d.extraManual != null) ? d.extraManual : extraSug;
  const baja     = parseFloat(d.baja) || 0;
  const total    = normales + extra;
  const balanceDia = valido ? (trab - meta) : 0;   // + exceso / − falta

  return { trab, meta, normales, extraSug, extra, baja, total, valido, balanceDia };
}
