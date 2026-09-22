/* ================= storage.js =================
   Guardado. Si hay sesión en la nube (MODO_NUBE) los registros van a
   Supabase; siempre se guarda además una copia local como respaldo/caché.
============================================================ */
"use strict";

function loadCfg(){
  try{
    const r = localStorage.getItem(LS_CFG);
    if(r) return Object.assign({}, CFG_DEFAULT, JSON.parse(r));
  }catch(e){}
  return Object.assign({}, CFG_DEFAULT);
}
function saveCfg(){ try{ localStorage.setItem(LS_CFG, JSON.stringify(cfg)); }catch(e){} }

/* clave local: usuario (o "local") + empleado + año-mes */
function dataKey(){
  const u = usuarioActual ? usuarioActual.id : "local";
  return u + "||" + estado.empleado.trim().toUpperCase() + "||" + estado.anio + "-" + estado.mes;
}
function loadAll(){
  try{ return JSON.parse(localStorage.getItem(LS_DATA) || "{}"); }
  catch(e){ return {}; }
}

/** cómo se guarda un día (turnos + extras + tipo manual) */
function serializarDia(d){
  return {
    turnos: (d.turnos||[]).map(t => ({ ent:t.ent||"", sal:t.sal||"" })),
    extraManual: d.extraManual, baja: d.baja, desc: d.desc, nota: d.nota,
    tipoManual: d.tipoManual || null
  };
}

/* caché local (siempre) */
function guardarLocal(){
  if(!estado.empleado.trim()) return;
  try{
    const all = loadAll();
    all[dataKey()] = {
      empleado: estado.empleado, mes: estado.mes, anio: estado.anio,
      dias: estado.dias.map(serializarDia)
    };
    localStorage.setItem(LS_DATA, JSON.stringify(all));
  }catch(e){}
}

/* guardado principal (local + nube con pequeño retardo para no saturar) */
let _saveTimer = null;
function saveEstado(){
  if(!estado.empleado.trim()) return;
  if(typeof _soloLectura !== "undefined" && _soloLectura) return;  // vista admin: no guardar
  guardarLocal();
  if(MODO_NUBE){
    setSaved("Guardando…");
    clearTimeout(_saveTimer);
    const emp = estado.empleado, an = estado.anio, me = estado.mes;
    const dias = estado.dias.map(serializarDia);
    _saveTimer = setTimeout(async () => {
      const ok = await cloudGuardarRegistro(emp, an, me, dias);
      setSaved(ok ? "Guardado en la nube ✓ " + _hora() : "Guardado local (sin nube)");
    }, 800);
  }else{
    setSaved("Guardado local ✓ " + _hora());
  }
}

function _hora(){ return new Date().toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}); }
function setSaved(t){ const el = document.getElementById("savedNote"); if(el) el.textContent = t; }
