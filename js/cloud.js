/* ================= cloud.js =================
   Conexión con Supabase: autenticación y guardado de registros en la nube.
   La clave publishable es segura en el navegador porque las tablas están
   protegidas con Row Level Security (RLS).

   Si la librería de Supabase no carga (sin internet), la app cae en
   MODO LOCAL automáticamente (guardado en el navegador).
============================================================ */
"use strict";

const SUPABASE_URL = "https://gtundpdbhcboalklabpz.supabase.co";
const SUPABASE_KEY = "sb_publishable_xnrrvGAi65ez6nrEKrsy5Q_7_mjhSFS";

let sb = null;                 // cliente de supabase
let usuarioActual = null;      // { id, email }
let perfilActual = null;       // { nombre, rol }
let MODO_NUBE = false;         // true si hay sesión activa en la nube

function cloudLibDisponible(){ return typeof window.supabase !== "undefined"; }

function initCloud(){
  if(!cloudLibDisponible()) return false;
  try{
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    return true;
  }catch(e){ console.warn("No se pudo iniciar Supabase:", e); return false; }
}

/* ---------- autenticación ---------- */
async function cloudSesion(){
  if(!sb) return null;
  const { data } = await sb.auth.getSession();
  return data && data.session ? data.session : null;
}

async function cloudSignUp(email, pass, nombre){
  if(!sb) throw new Error("Sin conexión a la nube");
  const { data, error } = await sb.auth.signUp({
    email, password: pass, options: { data: { nombre } }
  });
  if(error) throw error;
  return data;
}

async function cloudSignIn(email, pass){
  if(!sb) throw new Error("Sin conexión a la nube");
  const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
  if(error) throw error;
  return data;
}

async function cloudSignOut(){
  if(sb) await sb.auth.signOut();
  usuarioActual = null; perfilActual = null; MODO_NUBE = false;
}

async function cloudCargarPerfil(){
  if(!sb || !usuarioActual) return null;
  const { data } = await sb.from("perfiles").select("nombre, rol").eq("id", usuarioActual.id).maybeSingle();
  perfilActual = data || { nombre:"", rol:"registrador" };
  return perfilActual;
}

function esAdmin(){ return perfilActual && perfilActual.rol === "admin"; }

/* ---------- registros ---------- */
async function cloudCargarRegistro(empleado, anio, mes){
  if(!sb || !usuarioActual) return null;
  const { data, error } = await sb.from("registros_mes")
    .select("dias")
    .eq("user_id", usuarioActual.id).eq("empleado", empleado.trim().toUpperCase())
    .eq("anio", anio).eq("mes", mes).maybeSingle();
  if(error){ console.warn("cargar registro:", error.message); return null; }
  return data ? { dias: data.dias } : null;
}

async function cloudGuardarRegistro(empleado, anio, mes, dias){
  if(!sb || !usuarioActual) return false;
  const { error } = await sb.from("registros_mes").upsert({
    user_id: usuarioActual.id,
    empleado: empleado.trim().toUpperCase(),
    anio, mes, dias, actualizado_en: new Date().toISOString()
  }, { onConflict: "user_id,empleado,anio,mes" });
  if(error){ console.warn("guardar registro:", error.message); return false; }
  return true;
}

/* listar los meses guardados del usuario actual (para el historial) */
async function cloudListarMisRegistros(){
  if(!sb || !usuarioActual) return [];
  const { data } = await sb.from("registros_mes")
    .select("empleado, anio, mes, actualizado_en")
    .eq("user_id", usuarioActual.id)
    .order("actualizado_en", { ascending:false });
  return data || [];
}

/* cargar un registro específico de cualquier usuario (solo admin lo logra por RLS) */
async function cloudCargarRegistroPorUsuario(userId, empleado, anio, mes){
  if(!sb) return null;
  const { data } = await sb.from("registros_mes").select("dias")
    .eq("user_id", userId).eq("empleado", empleado).eq("anio", anio).eq("mes", mes).maybeSingle();
  return data ? { dias: data.dias } : null;
}

/* lista para la administradora: todos los registros visibles + nombre del dueño */
async function cloudListarTodos(){
  if(!sb) return [];
  const { data, error } = await sb.from("registros_mes")
    .select("empleado, anio, mes, actualizado_en, user_id, perfiles(nombre)")
    .order("actualizado_en", { ascending:false });
  if(error){ console.warn("listar todos:", error.message); return []; }
  return data || [];
}
