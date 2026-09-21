/* ================= holidays.js =================
   Feriados de Perú calculados por año (sin depender de internet).
   Incluye los feriados nacionales fijos, los móviles de Semana Santa
   (Jueves y Viernes Santo, derivados de la Pascua) y, opcionalmente,
   los regionales de Arequipa (Aniversario, 15 de agosto).
============================================================ */
"use strict";

/** Domingo de Pascua por el algoritmo de Butcher/Meeus */
function domingoPascua(anio){
  const a = anio % 19,
        b = Math.floor(anio / 100), c = anio % 100,
        d = Math.floor(b / 4), e = b % 4,
        f = Math.floor((b + 8) / 25),
        g = Math.floor((b - f + 1) / 3),
        h = (19 * a + b - d - g + 15) % 30,
        i = Math.floor(c / 4), k = c % 4,
        l = (32 + 2 * e + 2 * i - h - k) % 7,
        m = Math.floor((a + 11 * h + 22 * l) / 451),
        mes = Math.floor((h + l - 7 * m + 114) / 31),
        dia = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, dia);
}

function claveFecha(anio, mes, dia){ // mes 0-based → "YYYY-MM-DD"
  return anio + "-" + String(mes + 1).padStart(2,"0") + "-" + String(dia).padStart(2,"0");
}

/**
 * Devuelve un objeto { "YYYY-MM-DD": "Nombre del feriado" } para el año dado.
 * @param {number} anio
 * @param {boolean} incluirArequipa  añade el Aniversario de Arequipa (15 ago)
 */
function feriadosPeru(anio, incluirArequipa){
  const f = {};

  // --- Feriados nacionales fijos ---
  const fijos = [
    [0,  1,  "Año Nuevo"],
    [4,  1,  "Día del Trabajo"],
    [5,  7,  "Batalla de Arica y Día de la Bandera"],
    [5,  29, "San Pedro y San Pablo"],
    [6,  28, "Fiestas Patrias"],
    [6,  29, "Fiestas Patrias"],
    [7,  6,  "Batalla de Junín"],
    [7,  30, "Santa Rosa de Lima"],
    [9,  8,  "Combate de Angamos"],
    [10, 1,  "Todos los Santos"],
    [11, 8,  "Inmaculada Concepción"],
    [11, 9,  "Batalla de Ayacucho"],
    [11, 25, "Navidad"]
  ];
  fijos.forEach(([m,d,nombre]) => { f[claveFecha(anio,m,d)] = nombre; });

  // --- Móviles: Semana Santa ---
  const pascua = domingoPascua(anio);
  const jueves = new Date(pascua); jueves.setDate(pascua.getDate() - 3);
  const viernes = new Date(pascua); viernes.setDate(pascua.getDate() - 2);
  f[claveFecha(anio, jueves.getMonth(),  jueves.getDate())]  = "Jueves Santo";
  f[claveFecha(anio, viernes.getMonth(), viernes.getDate())] = "Viernes Santo";

  // --- Regional Arequipa ---
  if(incluirArequipa){
    f[claveFecha(anio, 7, 15)] = "Aniversario de Arequipa";
  }

  return f;
}
