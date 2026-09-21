/* ================= utils.js =================
   Utilidades de tiempo y formato de números.
============================================================ */
"use strict";

/** "07:30" -> 7.5 ; "" o inválido -> null */
function hmToDec(str){
  if(!str) return null;
  const m = String(str).match(/^(\d{1,2}):(\d{2})$/);
  if(!m) return null;
  const h = +m[1], mi = +m[2];
  if(h > 23 || mi > 59) return null;
  return h + mi/60;
}

/** 1.25 -> "1:15" (admite negativos) */
function decToHM(dec){
  if(dec == null || isNaN(dec)) return "";
  const neg = dec < 0; dec = Math.abs(dec);
  let h = Math.floor(dec + 1e-9);
  let mi = Math.round((dec - h) * 60);
  if(mi === 60){ h++; mi = 0; }
  return (neg ? "-" : "") + h + ":" + String(mi).padStart(2,"0");
}

/** número -> string con 2 decimales */
function fmt(n){ return (Math.round(n * 100) / 100).toFixed(2); }

/** normaliza lo que el usuario teclea en una celda de hora:
    "730"->"07:30", "7.5"->"07:05"... si no reconoce, devuelve lo tecleado */
function normHora(v){
  v = String(v).trim();
  if(!v) return "";
  v = v.replace(/[.\-\s]/g, ":");
  let m = v.match(/^(\d{1,2}):?(\d{0,2})$/);
  if(!m){
    const d = v.replace(/\D/g, "");
    if(d.length === 3) return "0" + d[0] + ":" + d.slice(1);
    if(d.length === 4) return d.slice(0,2) + ":" + d.slice(2);
    return v;
  }
  let h = m[1].padStart(2,"0"), mi = (m[2] || "0").padStart(2,"0");
  if(+h > 23 || +mi > 59) return v;
  return h + ":" + mi;
}
