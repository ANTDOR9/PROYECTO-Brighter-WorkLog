/* ================= calc.js =================
   Motor de cálculo: clasificación del día y horas por día.
   Cada día tiene turnos: [{ent, sal}, ...] (sin límite).
============================================================ */
"use strict";

/** normaliza un día viejo (ent/sal/ent2/sal2) al modelo de turnos */
function normalizarDia(g){
  if(g && Array.isArray(g.turnos)) return g.turnos.map(t => ({ ent:t.ent||"", sal:t.sal||"" }));
  // compatibilidad con datos antiguos
  const t = [];
  if(g && (g.ent || g.sal))   t.push({ ent:g.ent||"",  sal:g.sal||""  });
  if(g && (g.ent2 || g.sal2)) t.push({ ent:g.ent2||"", sal:g.sal2||"" });
  while(t.length < 2) t.push({ ent:"", sal:"" });   // mínimo 2 turnos visibles
  return t;
}

/** nombre del feriado para ese día (o null) — usa estado.feriados */
function nombreFeriado(d){
  const clave = claveFecha(estado.anio, estado.mes, d.dia);
  return estado.feriados[clave] || null;
}

/** "completo" | "sabado" (media jornada) | "domingo" (no laborable) | "feriado" */
function tipoDia(d){
  if(d.tipoManual) return d.tipoManual;               // el usuario lo cambió a mano
  const desc = (d.desc || "").trim().toUpperCase();
  if(desc.includes("FERIADO") || nombreFeriado(d)) return "feriado";
  if(d.dow === 0) return "domingo";
  if(!cfg.diasLaborables.includes(d.dow)) return "domingo";
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
  let trab = 0, valido = false;
  (d.turnos || []).forEach(t => {
    const e = hmToDec(t.ent), s = hmToDec(t.sal);
    if(e != null && s != null && s >= e){ trab += (s - e); valido = true; }
  });

  const meta = metaDia(d);
  const normales = Math.min(trab, meta);

  const tol = (cfg.toleranciaExtraMin || 0) / 60;
  let extraSug = Math.max(0, trab - meta);
  if(extraSug > 0 && extraSug < tol) extraSug = 0;

  const extra = (d.extraManual != null) ? d.extraManual : extraSug;
  const baja  = parseFloat(d.baja) || 0;
  const total = normales + extra;
  const balanceDia = valido ? (trab - meta) : 0;

  return { trab, meta, normales, extraSug, extra, baja, total, valido, balanceDia };
}

/** totales del mes */
function calcMes(){
  let sT=0, sN=0, sE=0, sB=0, sTot=0, bal=0, meta=0;
  estado.dias.forEach(d => {
    const c = calcDia(d);
    sT+=c.trab; sN+=c.normales; sE+=c.extra; sB+=c.baja; sTot+=c.total;
    bal+=c.balanceDia; meta+=c.meta;
  });
  return { trab:sT, normales:sN, extras:sE, baja:sB, total:sTot, balance:bal, meta };
}

/** máximo de turnos en el mes (para exportar columnas) */
function maxTurnos(){
  return estado.dias.reduce((m,d) => Math.max(m, (d.turnos||[]).length), 2);
}
