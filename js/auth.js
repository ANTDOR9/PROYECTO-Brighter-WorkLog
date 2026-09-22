/* ================= auth.js =================
   Pantalla de inicio de sesión, barra de usuario y vista de administradora.
============================================================ */
"use strict";

let _soloLectura = false;   // cuando la admin abre el registro de otra persona

async function initAuth(){
  const conectado = initCloud();

  if(!conectado){
    // Sin librería/nube → modo local (respaldo)
    MODO_NUBE = false;
    ocultarAuth();
    mostrarBarraUsuario(null);
    arrancarApp();
    return;
  }

  const ses = await cloudSesion();
  if(ses){
    usuarioActual = { id: ses.user.id, email: ses.user.email };
    MODO_NUBE = true;
    await cloudCargarPerfil();
    ocultarAuth();
    mostrarBarraUsuario(usuarioActual);
    arrancarApp();
  }else{
    mostrarAuth();
  }
}

function mostrarAuth(){
  const ov = document.getElementById("authOverlay");
  ov.classList.remove("oculto");
  try{
    const last = localStorage.getItem("bwl_lastuser");
    if(last){ document.getElementById("authUser").value = last; document.getElementById("authPass").focus(); }
    else document.getElementById("authUser").focus();
  }catch(e){}
}
function ocultarAuth(){ document.getElementById("authOverlay").classList.add("oculto"); }
function authError(msg){ const e=document.getElementById("authMsg"); e.textContent = msg || ""; e.style.color="var(--red)"; }
function authInfo(msg){ const e=document.getElementById("authMsg"); e.textContent = msg || ""; e.style.color="var(--teal)"; }

/** convierte lo escrito en un correo para Supabase.
    - si ya trae "@", se usa tal cual (correo completo)
    - si es solo un nombre de usuario, se le agrega @brighter.local */
function usuarioAEmail(u){
  u = u.trim().toLowerCase();
  if(u.includes("@")) return u;
  return u.replace(/[^a-z0-9._-]/g, "") + "@brighter.local";
}

async function accionAuth(tipo){   // 'in' | 'up'
  const usuario = document.getElementById("authUser").value.trim();
  const pass    = document.getElementById("authPass").value;
  if(!usuario || !pass){ authError("Escribe usuario y contraseña."); return; }
  const email = usuarioAEmail(usuario);
  authInfo("Procesando…");
  try{
    if(tipo === "up"){
      const d = await cloudSignUp(email, pass, usuario);
      if(!d.session){
        try{ await cloudSignIn(email, pass); }catch(e){ authError("Cuenta creada. Ahora pulsa Ingresar."); return; }
      }
    }else{
      await cloudSignIn(email, pass);
    }
    try{ localStorage.setItem("bwl_lastuser", usuario); }catch(e){}
    const ses = await cloudSesion();
    if(!ses){ authError("No se pudo iniciar sesión. Revisa tus datos."); return; }
    usuarioActual = { id: ses.user.id, email: ses.user.email };
    MODO_NUBE = true;
    await cloudCargarPerfil();
    ocultarAuth();
    mostrarBarraUsuario(usuarioActual);
    arrancarApp();
  }catch(e){ authError(e.message || "Error de autenticación."); }
}

async function cambiarUsuario(){
  await cloudSignOut();
  mostrarBarraUsuario(null);
  document.getElementById("authPass").value = "";
  authInfo("");
  mostrarAuth();
}

function mostrarBarraUsuario(u){
  const box = document.getElementById("userBox");
  if(!box) return;
  if(!u){ box.innerHTML = MODO_NUBE ? "" : '<span class="user-chip local">Modo local</span>'; return; }
  const nombre = (perfilActual && perfilActual.nombre) ? perfilActual.nombre : u.email;
  const admin = esAdmin();
  box.innerHTML =
    `<span class="user-chip">${admin ? "★ " : ""}${nombre}${admin ? " · Admin" : ""}</span>` +
    (admin ? `<button class="ghost" onclick="abrirAdmin()">Ver todos</button>` : "") +
    `<button class="ghost" onclick="cambiarUsuario()">Cambiar de usuario</button>`;
}

/* ---------- vista de administradora ---------- */
async function abrirAdmin(){
  const dlg = document.getElementById("dlgAdmin");
  const cont = document.getElementById("adminLista");
  cont.innerHTML = "<p class='hint'>Cargando…</p>";
  dlg.showModal();
  const filas = await cloudListarTodos();
  if(!filas.length){ cont.innerHTML = "<p class='hint'>Aún no hay registros de otros usuarios.</p>"; return; }
  cont.innerHTML = "";
  filas.forEach(f => {
    const quien = (f.perfiles && f.perfiles.nombre) ? f.perfiles.nombre : "(usuario)";
    const row = document.createElement("button");
    row.className = "admin-row";
    row.innerHTML = `<span><b>${f.empleado}</b> · ${MESES[f.mes]} ${f.anio}</span><span class="admin-quien">${quien}</span>`;
    row.onclick = () => abrirRegistroDe(f);
    cont.appendChild(row);
  });
}

async function abrirRegistroDe(f){
  document.getElementById("dlgAdmin").close();
  const reg = await cloudCargarRegistroPorUsuario(f.user_id, f.empleado, f.anio, f.mes);
  document.getElementById("fEmpleado").value = f.empleado;
  document.getElementById("fMes").value = f.mes;
  document.getElementById("fAnio").value = f.anio;
  estado.empleado = f.empleado; estado.mes = f.mes; estado.anio = f.anio;
  estado.feriados = feriadosPeru(estado.anio, cfg.feriadosArequipa);
  const ndias = new Date(estado.anio, estado.mes+1, 0).getDate();
  estado.dias = [];
  for(let i=1;i<=ndias;i++){
    const dow = new Date(estado.anio, estado.mes, i).getDay();
    const g = (reg && reg.dias && reg.dias[i-1]) ? reg.dias[i-1] : {};
    estado.dias.push({ dia:i, dow, turnos:normalizarDia(g),
      extraManual:(g.extraManual!==undefined?g.extraManual:null), baja:g.baja||"", desc:g.desc||"", nota:g.nota||"", tipoManual:g.tipoManual||null });
  }
  _soloLectura = true;
  renderTabla(); if(typeof renderCalendario==="function") renderCalendario(); renderResumenLateral();
  cambiarModo("escritorio");
  setSaved("Vista de administradora (solo lectura) — " + (f.perfiles && f.perfiles.nombre ? f.perfiles.nombre : ""));
}
