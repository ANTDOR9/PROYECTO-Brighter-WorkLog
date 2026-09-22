/* ================= export.js =================
   Excel (.xlsx con bordes y estilo, vía ExcelJS) e Imprimir.
   Si ExcelJS no cargó (sin internet), cae en un .xls simple.
============================================================ */
"use strict";

function _nombreArchivo(ext){
  const emp = (estado.empleado.trim() || "Empleado").replace(/\s+/g, "_");
  return "Horas_" + emp + "_" + MESES[estado.mes] + "_" + estado.anio + "." + ext;
}

/* arma los datos comunes */
function _datosExport(){
  const nT = maxTurnos();
  const colTurnos = [];
  for(let k=0;k<nT;k++){ colTurnos.push("Entrada "+(k+1), "Salida "+(k+1)); }
  const encab = ["Día","Fecha", ...colTurnos,
                 "H. Trab.","H. Normales","H. Extras","H. Baja","Descripción","Total","Nota"];
  const filas = estado.dias.map(d => {
    const c = calcDia(d); const fer = nombreFeriado(d);
    const marcas = [];
    for(let k=0;k<nT;k++){ const tt=d.turnos[k]||{}; marcas.push(tt.ent||"", tt.sal||""); }
    return { tipo:tipoDia(d), row:[
      DIAS[d.dow],
      String(d.dia).padStart(2,"0")+"/"+String(estado.mes+1).padStart(2,"0")+"/"+estado.anio,
      ...marcas,
      c.valido?+fmt(c.trab):"", c.meta>0?+fmt(c.normales):"",
      c.extra>0?+fmt(c.extra):"", c.baja>0?+fmt(c.baja):"",
      fer || d.desc || "", +fmt(c.total), d.nota||""
    ]};
  });
  const m = calcMes();
  const totales = ["TOTALES","", ...new Array(nT*2).fill(""),
      +fmt(m.trab), +fmt(m.normales), +fmt(m.extras), +fmt(m.baja),
      "Balance: "+(m.balance>=0?"+":"")+fmt(m.balance), +fmt(m.total), ""];
  return { encab, filas, totales, nCols: encab.length, m };
}

async function exportarExcel(){
  const emp = estado.empleado.trim() || "Empleado";
  const per = MESES[estado.mes] + " " + estado.anio;
  const mon = cfg.moneda || "S/";
  const { encab, filas, totales, nCols, m } = _datosExport();

  if(typeof ExcelJS !== "undefined"){
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Horas", { views:[{ showGridLines:false }] });

    const BORDE = { top:{style:"thin",color:{argb:"FFBFC9D4"}}, left:{style:"thin",color:{argb:"FFBFC9D4"}},
                    bottom:{style:"thin",color:{argb:"FFBFC9D4"}}, right:{style:"thin",color:{argb:"FFBFC9D4"}} };
    const centro = { vertical:"middle", horizontal:"center" };

    // Título
    ws.mergeCells(1,1,1,nCols);
    const t = ws.getCell(1,1);
    t.value = "RESUMEN DE HORAS — " + emp + " · " + per;
    t.font = { bold:true, size:14, color:{argb:"FF1E2A3A"} };
    t.alignment = centro;
    ws.getRow(1).height = 26;

    // Encabezados (fila 3)
    const hr = ws.getRow(3);
    encab.forEach((h,i) => {
      const c = hr.getCell(i+1);
      c.value = h;
      c.font = { bold:true, color:{argb:"FFFFFFFF"}, size:10 };
      c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFF26522"} };
      c.alignment = { ...centro, wrapText:true };
      c.border = BORDE;
    });
    hr.height = 24;

    // Datos
    filas.forEach((f,ri) => {
      const r = ws.getRow(4+ri);
      f.row.forEach((v,ci) => {
        const c = r.getCell(ci+1);
        c.value = v;
        c.alignment = centro;
        c.border = BORDE;
        c.font = { size:10 };
      });
      // color suave según tipo de día
      let bg = null;
      if(f.tipo==="domingo") bg="FFFDECEB";
      else if(f.tipo==="feriado") bg="FFFFF2E2";
      else if(f.tipo==="sabado") bg="FFE7F6F0";
      if(bg) r.eachCell(c => { c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:bg} }; });
    });

    // Totales
    const tr = ws.getRow(4+filas.length);
    totales.forEach((v,ci) => {
      const c = tr.getCell(ci+1);
      c.value = v; c.alignment = centro; c.border = BORDE;
      c.font = { bold:true, size:10 };
      c.fill = { type:"pattern", pattern:"solid", fgColor:{argb:"FFFDE8DD"} };
    });

    // Bloque de pago
    const rTot = 4 + filas.length;
    const pagoFilas = [
      ["Horas normales pagadas", +fmt(m.normPag), "Tarifa", +fmt(cfg.tarifaNormal), "Subtotal", mon+" "+fmt(m.salarioNormal)],
      ["Horas extras pagadas",   +fmt(m.extrasPag), "Tarifa", +fmt(cfg.tarifaExtra),  "Subtotal", mon+" "+fmt(m.salarioExtra)],
      ["TOTAL A PAGAR", "", "", "", "", mon+" "+fmt(m.salario)]
    ];
    pagoFilas.forEach((pf,pi) => {
      const r = ws.getRow(rTot+2+pi);
      pf.forEach((v,ci) => {
        const c = r.getCell(ci+1); c.value = v; c.border = BORDE;
        c.alignment = { vertical:"middle", horizontal: ci===0?"left":"center" };
        c.font = { size:10, bold: pi===2 };
      });
      const es = (pi===2);
      r.eachCell(c => { c.fill = { type:"pattern", pattern:"solid", fgColor:{argb: es?"FFF26522":"FFFDE8DD"} };
                        if(es) c.font = { bold:true, size:12, color:{argb:"FFFFFFFF"} }; });
    });

    // Anchos de columna
    ws.columns.forEach((col,i) => {
      const h = encab[i] || "";
      col.width = i===0?18 : i===1?12 : /Descrip|Nota/.test(h)?20 : 10;
    });

    // Firmas
    const fFirma = rTot + 8;
    ws.getCell(fFirma, 1).value = "_______________________________";
    ws.getCell(fFirma+1, 1).value = "Firma del empleado";
    const colJefe = Math.max(5, nCols-3);
    ws.getCell(fFirma, colJefe).value = "_______________________________";
    ws.getCell(fFirma+1, colJefe).value = "Firma del jefe de área";

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    _descargarBlob(blob, _nombreArchivo("xlsx"));
    return;
  }

  // Fallback sin internet: .xls (HTML con bordes básicos)
  let trs = "";
  filas.forEach(f => { trs += "<tr>" + f.row.map(v => `<td style="border:1px solid #999">${v}</td>`).join("") + "</tr>"; });
  const html = `<html><head><meta charset="UTF-8"></head><body>
    <table style="border-collapse:collapse"><tr><th colspan="${nCols}">RESUMEN DE HORAS — ${emp} · ${per}</th></tr>
    <tr>${encab.map(h=>`<th style="border:1px solid #999;background:#f26522;color:#fff">${h}</th>`).join("")}</tr>${trs}
    <tr>${totales.map(v=>`<td style="border:1px solid #999"><b>${v}</b></td>`).join("")}</tr></table></body></html>`;
  _descargarBlob(new Blob([html], { type:"application/vnd.ms-excel" }), _nombreArchivo("xls"));
}

function _descargarBlob(blob, nombre){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function imprimir(){ window.print(); }
