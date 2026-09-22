/* ================= export.js =================
   Descargas: Excel (.xlsx real con SheetJS → sin advertencias) e Imprimir.
   Si SheetJS no está disponible (sin internet), cae en un .xls simple.
   El formato oficial completo (firmas, PDF, Word) llega en Fase 3.
============================================================ */
"use strict";

function _nombreArchivo(ext){
  const emp = (estado.empleado.trim() || "Empleado").replace(/\s+/g, "_");
  return "Horas_" + emp + "_" + MESES[estado.mes] + "_" + estado.anio + "." + ext;
}

function exportarExcel(){
  const emp = estado.empleado.trim() || "Empleado";
  const per = MESES[estado.mes] + " " + estado.anio;
  const m = calcMes();

  // ---- filas de datos ----
  const encab = ["Día","Fecha","Entrada","Salida","Entrada 2","Salida 2",
                 "H. Trab.","H. Normales","H. Extras","H. Baja","Descripción","Total","Nota"];
  const filas = estado.dias.map(d => {
    const c = calcDia(d);
    const fer = nombreFeriado(d);
    return [
      DIAS[d.dow],
      String(d.dia).padStart(2,"0")+"/"+String(estado.mes+1).padStart(2,"0")+"/"+estado.anio,
      d.ent||"", d.sal||"", d.ent2||"", d.sal2||"",
      c.valido?+fmt(c.trab):"", c.meta>0?+fmt(c.normales):"",
      c.extra>0?+fmt(c.extra):"", c.baja>0?+fmt(c.baja):"",
      fer || d.desc || "", +fmt(c.total), d.nota||""
    ];
  });
  const totales = ["TOTALES","","","","","",
      +fmt(m.trab), +fmt(m.normales), +fmt(m.extras), +fmt(m.baja),
      "Balance: "+(m.balance>=0?"+":"")+fmt(m.balance), +fmt(m.total), ""];

  // ---- SheetJS (xlsx real) ----
  if(typeof XLSX !== "undefined"){
    const aoa = [
      ["RESUMEN DE HORAS — " + emp + " · " + per],
      [],
      encab,
      ...filas,
      totales,
      [],
      [],
      ["_______________________________","","","","Firma del empleado","","",
       "","_______________________________","","","Firma del jefe de área"]
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!merges"] = [{ s:{r:0,c:0}, e:{r:0,c:12} }];        // título combinado
    ws["!cols"] = encab.map((h,i) => ({ wch: i===0?11 : i===1?12 : i===10?16 : i===12?22 : 9 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Horas");
    XLSX.writeFile(wb, _nombreArchivo("xlsx"));
    return;
  }

  // ---- Fallback sin internet: .xls (HTML) ----
  let trs = "";
  filas.forEach(f => { trs += "<tr>" + f.map(v => `<td>${v}</td>`).join("") + "</tr>"; });
  const html = `<html><head><meta charset="UTF-8"></head><body>
    <table border="1"><tr><th colspan="13">RESUMEN DE HORAS — ${emp} · ${per}</th></tr>
    <tr>${encab.map(h=>`<th>${h}</th>`).join("")}</tr>${trs}
    <tr>${totales.map(v=>`<td><b>${v}</b></td>`).join("")}</tr></table></body></html>`;
  const blob = new Blob([html], { type:"application/vnd.ms-excel" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = _nombreArchivo("xls");
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function imprimir(){ window.print(); }
