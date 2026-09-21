/* ================= config.js =================
   Constantes globales, configuración por defecto y estado compartido.
   Se cargan como <script> clásicos, así que todo vive en el ámbito global.
============================================================ */
"use strict";

const DIAS  = ["Domingo","Lunes","Martes","Miércoles","Jueves","Viernes","Sábado"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

const LS_CFG  = "bwl_config_v1";
const LS_DATA = "bwl_data_v1";

/* configuración por defecto (editable en "Ajustes avanzados") */
const CFG_DEFAULT = {
  diasLaborables:[1,2,3,4,5,6],   // 0=Dom ... 6=Sáb  → lunes a sábado
  diaMedio:6,                     // sábado = media jornada
  topeCompleto:8.5,
  topeMedio:5.5
};

/* configuración activa (se rellena en app.js tras cargar de localStorage) */
let cfg = Object.assign({}, CFG_DEFAULT);

/* estado en memoria del mes que se está editando */
let estado = { empleado:"", mes:0, anio:2026, dias:[] };
