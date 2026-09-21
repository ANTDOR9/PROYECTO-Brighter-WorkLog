/* ================= storage.js =================
   Persistencia local (localStorage). Todo va envuelto en try/catch
   porque en algunos contextos el almacenamiento puede fallar.
============================================================ */
"use strict";

function loadCfg(){
  try{
    const r = localStorage.getItem(LS_CFG);
    if(r) return Object.assign({}, CFG_DEFAULT, JSON.parse(r));
  }catch(e){}
  return Object.assign({}, CFG_DEFAULT);
}

function saveCfg(){
  try{ localStorage.setItem(LS_CFG, JSON.stringify(cfg)); }catch(e){}
}

/** clave única por empleado + año-mes */
function dataKey(){
  return estado.empleado.trim().toUpperCase() + "||" + estado.anio + "-" + estado.mes;
}

function loadAll(){
  try{ return JSON.parse(localStorage.getItem(LS_DATA) || "{}"); }
  catch(e){ return {}; }
}

function saveEstado(){
  if(!estado.empleado.trim()) return;
  try{
    const all = loadAll();
    all[dataKey()] = {
      empleado: estado.empleado, mes: estado.mes, anio: estado.anio,
      dias: estado.dias.map(d => ({
        ent:d.ent, sal:d.sal, ent2:d.ent2, sal2:d.sal2,
        extraManual:d.extraManual, baja:d.baja, desc:d.desc, nota:d.nota
      }))
    };
    localStorage.setItem(LS_DATA, JSON.stringify(all));
    setSaved("Guardado ✓ " + new Date().toLocaleTimeString("es-PE",{hour:"2-digit",minute:"2-digit"}));
  }catch(e){
    setSaved("No se pudo guardar localmente");
  }
}

function setSaved(t){
  const el = document.getElementById("savedNote");
  if(el) el.textContent = t;
}
