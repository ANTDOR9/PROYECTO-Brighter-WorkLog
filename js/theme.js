/* ================= theme.js =================
   Selector de estilo visual, con 3 temas que se ciclan con un botón:
     1) vidrio  (por defecto): carrusel de fondos con efecto vidrio
     2) claro   : blanco con difuminados suaves
     3) oscuro  : gris pizarra oscuro
   El tema elegido se recuerda en localStorage.
============================================================ */
"use strict";

const LS_THEME = "bwl_theme_v1";
const TEMAS = ["vidrio", "claro", "oscuro"];
const TEMA_LBL = { vidrio:"Fondo 1", claro:"Fondo 2", oscuro:"Fondo 3" };
const ICONO_TEMA = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 0 0 18 4 4 0 0 0 0-8 3 3 0 0 1 0-6z"/></svg>';

/* fondos del carrusel (tema vidrio). 5.svg se omite por su peso (~37 MB);
   para añadirlo, incluye "assets/fondos/5.svg" en esta lista. */
const FONDOS = [
  "assets/fondos/1.svg",
  "assets/fondos/2.svg",
  "assets/fondos/3.svg",
  "assets/fondos/4.svg"
];

let _bgTimer = null, _bgIdx = 0;

function aplicarTema(t){
  document.body.setAttribute("data-theme", t);
  try{ localStorage.setItem(LS_THEME, t); }catch(e){}
  const btn = document.getElementById("btnTema");
  if(btn) btn.innerHTML = ICONO_TEMA + " <span>" + TEMA_LBL[t] + "</span>";
  if(t === "vidrio") iniciarCarruselFondo();
  else detenerCarruselFondo();
}

function ciclarTema(){
  const actual = document.body.getAttribute("data-theme") || "vidrio";
  const i = TEMAS.indexOf(actual);
  aplicarTema(TEMAS[(i + 1) % TEMAS.length]);
}

function iniciarCarruselFondo(){
  const cont = document.getElementById("bgCarousel");
  if(!cont) return;
  if(cont.children.length === 0){
    FONDOS.forEach((src, i) => {
      const s = document.createElement("div");
      s.className = "bg-slide" + (i === 0 ? " on" : "");
      s.style.backgroundImage = "url('" + src + "')";
      cont.appendChild(s);
    });
    _bgIdx = 0;
  }
  if(_bgTimer) return;
  _bgTimer = setInterval(() => {
    const slides = cont.children;
    if(slides.length < 2) return;
    slides[_bgIdx].classList.remove("on");
    _bgIdx = (_bgIdx + 1) % slides.length;
    slides[_bgIdx].classList.add("on");
  }, 13000);
}

function detenerCarruselFondo(){
  if(_bgTimer){ clearInterval(_bgTimer); _bgTimer = null; }
}

function initTema(){
  let t = "vidrio";
  try{ t = localStorage.getItem(LS_THEME) || "vidrio"; }catch(e){}
  const btn = document.getElementById("btnTema");
  if(btn) btn.onclick = ciclarTema;
  aplicarTema(t);
}
