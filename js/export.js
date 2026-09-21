/* ================= export.js =================
   Descargas: Excel (.xls vía HTML, se abre en Excel sin librerías) e Imprimir.
   La exportación con el formato oficial completo (firmas, PDF, Word) llega en Fase 3.
============================================================ */
"use strict";

function _descargar(nombre, contenido, tipo){
  const blob = new Blob([contenido], { type: tipo });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportarExcel(){
  const emp = estado.empleado.trim() || "Empleado";
  const per = MESES[estado.mes] + " " + estado.anio;
  let filas = "";
  estado.dias.forEach(d => {
    const c = calcDia(d);
    const fer = nombreFeriado(d);
    const desc = fer || d.desc || "";
    filas += `<tr>
      <td>${DIAS[d.dow]}</td>
      <td>${String(d.dia).padStart(2,"0")}/${String(estado.mes+1).padStart(2,"0")}/${estado.anio}</td>
      <td>${d.ent||""}</td><td>${d.sal||""}</td><td>${d.ent2||""}</td><td>${d.sal2||""}</td>
      <td>${c.valido?fmt(c.trab):""}</td>
      <td>${c.meta>0?fmt(c.normales):""}</td>
      <td>${c.extra>0?fmt(c.extra):""}</td>
      <td>${c.baja>0?fmt(c.baja):""}</td>
      <td>${desc}</td>
      <td>${fmt(c.total)}</td>
      <td>${(d.nota||"").replace(/</g,"&lt;")}</td>
    </tr>`;
  });
  const m = calcMes();

  const html = `<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">
  <style>
    table{border-collapse:collapse;font-family:Calibri,Arial}
    th,td{border:1px solid #9bb;padding:4px 6px;text-align:center;font-size:11px}
    th{background:#f26522;color:#fff}
    .tit{font-size:14px;font-weight:bold}
    .tot td{font-weight:bold;background:#fde8dd}
  </style></head><body>
  <table>
    <tr><td class="tit" colspan="13">RESUMEN DE HORAS — ${emp} · ${per}</td></tr>
    <tr><td colspan="13"></td></tr>
    <tr>
      <th>Día</th><th>Fecha</th><th>Entrada</th><th>Salida</th><th>Entrada 2</th><th>Salida 2</th>
      <th>H. Trab.</th><th>H. Normales</th><th>H. Extras</th><th>H. Baja</th><th>Descripción</th><th>Total</th><th>Nota</th>
    </tr>
    ${filas}
    <tr class="tot"><td colspan="6">TOTALES</td>
      <td>${fmt(m.trab)}</td><td>${fmt(m.normales)}</td><td>${fmt(m.extras)}</td><td>${fmt(m.baja)}</td>
      <td>Balance: ${m.balance>=0?"+":""}${fmt(m.balance)}</td><td>${fmt(m.total)}</td><td></td></tr>
  </table>
  <br><br>
  <table style="border:none">
    <tr><td style="border:none">_______________________________</td><td style="border:none;width:60px"></td><td style="border:none">_______________________________</td></tr>
    <tr><td style="border:none">Firma del empleado</td><td style="border:none"></td><td style="border:none">Firma del jefe de área</td></tr>
  </table>
  </body></html>`;

  const nombre = "Horas_" + emp.replace(/\s+/g,"_") + "_" + MESES[estado.mes] + "_" + estado.anio + ".xls";
  _descargar(nombre, html, "application/vnd.ms-excel");
}

function imprimir(){
  window.print();
}
