/* ================= app.js =================
   Arranque: controles, cambio de modo (Calendario ⇄ Escritorio),
   gesto "arrastra hacia abajo" y generación del mes inicial.
============================================================ */
"use strict";

/* ---------- cambio de modo ---------- */
function cambiarModo(modo){
  const cal = document.getElementById("vistaCalendario");
  const esc = document.getElementById("vistaEscritorio");
  const mostrar = (el) => { el.classList.remove("oculto"); requestAnimationFrame(()=>el.classList.add("entrando")); setTimeout(()=>el.classList.remove("entrando"),380); };
  const ocultar = (el) => { el.classList.add("oculto"); };

  if(modo === "escritorio"){ ocultar(cal); mostrar(esc); }
  else { ocultar(esc); mostrar(cal); }

  document.querySelectorAll("#segModo button").forEach(b =>
    b.classList.toggle("on", b.dataset.modo === modo));
  try{ localStorage.setItem(LS_MODO, modo); }catch(e){}
}

/* ---------- gesto de arrastre hacia abajo ---------- */
function initGesto(){
  const zona = document.getElementById("pullHint");
  const cal  = document.getElementById("vistaCalendario");
  if(!zona) return;
  let y0 = null, dy = 0;

  const start = (y) => { y0 = y; dy = 0; cal.style.transition = "none"; };
  const move  = (y) => {
    if(y0 == null) return;
    dy = Math.max(0, y - y0);
    cal.style.transform = "translateY(" + Math.min(dy, 90) + "px)";
    cal.style.opacity = String(1 - Math.min(dy, 90)/180);
    zona.classList.toggle("activo", dy > 60);
  };
  const end = () => {
    if(y0 == null) return;
    cal.style.transition = "";
    cal.style.transform = "";
    cal.style.opacity = "";
    if(dy > 60) cambiarModo("escritorio");
    zona.classList.remove("activo");
    y0 = null;
  };

  zona.addEventListener("pointerdown", e => { start(e.clientY); zona.setPointerCapture(e.pointerId); });
  zona.addEventListener("pointermove", e => move(e.clientY));
  zona.addEventListener("pointerup", end);
  zona.addEventListener("pointercancel", end);
  zona.addEventListener("click", () => { if(dy === 0) cambiarModo("escritorio"); });
}

/* ---------- init ---------- */
function init(){
  cfg = loadCfg();
  initTema();

  const selM = document.getElementById("fMes");
  MESES.forEach((m, i) => { const o=document.createElement("option"); o.value=i; o.textContent=m; selM.appendChild(o); });
  const now = new Date();
  selM.value = now.getMonth();
  document.getElementById("fAnio").value = now.getFullYear();

  // eventos generales
  document.getElementById("btnGenerar").onclick = () => generarMes(true);
  document.getElementById("fEmpleado").addEventListener("change", () => { if(estado.dias.length) generarMes(true); });
  document.getElementById("btnConfig").onclick        = abrirConfig;
  document.getElementById("btnGuardarConfig").onclick = guardarConfig;
  document.getElementById("btnCerrarConfig").onclick  = () => document.getElementById("dlgConfig").close();

  // segmented + carrusel
  document.querySelectorAll("#segModo button").forEach(b => b.onclick = () => cambiarModo(b.dataset.modo));
  document.getElementById("calPrev").onclick = () => calScroll(-1);
  document.getElementById("calNext").onclick = () => calScroll(1);
  initGesto();

  // botones de la pantalla de login
  document.getElementById("btnLogin").onclick  = () => accionAuth("in");
  document.getElementById("btnSignup").onclick = () => accionAuth("up");
  document.getElementById("btnCerrarAdmin").onclick = () => document.getElementById("dlgAdmin").close();

  // la app arranca después de resolver la sesión (auth.js)
  initAuth();
}

/** llamado por auth.js una vez resuelto el inicio de sesión (o modo local) */
function arrancarApp(){
  generarMes(false);
  let modo = "calendario";
  try{ modo = localStorage.getItem(LS_MODO) || "calendario"; }catch(e){}
  cambiarModo(modo);
}

document.addEventListener("DOMContentLoaded", init);
