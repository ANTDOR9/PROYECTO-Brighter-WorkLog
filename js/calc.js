/* ================= calc.js =================
   Motor de cálculo: clasificación del día y horas por día.
============================================================ */
"use strict";

/** nombre del feriado para ese día (o null) — usa estado.feriados */
function nombreFeriado(d){
  const clave = claveFecha(estado.anio, estado.mes, d.dia);
  return estado.feriados[clave] || null;
}

/** "completo" | "sabado" (media jornada) | "domingo" (no laborable) | "feriado" */
function tipoDia(d){
  const desc = (d.desc || "").trim().toUpperCase();
  if(desc.includes("FERIADO") || nombreFeriado(d)) return "feriado";
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

  const meta = metaDia(d);
  const normales = Math.min(trab, meta);

  // extra sugerido, con tolerancia configurable (minutos)
  const tol = (cfg.toleranciaExtraMin || 0) / 60;
  let extraSug = Math.max(0, trab - meta);
  if(extraSug > 0 && extraSug < tol) extraSug = 0;

  const extra = (d.extraManual != null) ? d.extraManual : extraSug;
  const baja  = parseFloat(d.baja) || 0;
  const total = normales + extra;
  const balanceDia = valido ? (trab - meta) : 0;   // + exceso / − falta

  return { trab, meta, normales, extraSug, extra, baja, total, valido, balanceDia };
}

/** totales del mes (reutilizado por tabla, calendario y exportación) */
function calcMes(){
  let sT=0, sN=0, sE=0, sB=0, sTot=0, bal=0, meta=0;
  estado.dias.forEach(d => {
    const c = calcDia(d);
    sT+=c.trab; sN+=c.normales; sE+=c.extra; sB+=c.baja; sTot+=c.total;
    bal+=c.balanceDia; meta+=c.meta;
  });
  return { trab:sT, normales:sN, extras:sE, baja:sB, total:sTot, balance:bal, meta };
}
