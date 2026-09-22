/* ================= export.js =================
   Excel (.xlsx con ExcelJS) y PDF (jsPDF + autotable), descargar,
   imprimir y enviar por correo (vía Edge Function con Zoho).
============================================================ */
"use strict";

function _nombreArchivo(ext){
  const emp = (estado.empleado.trim() || "Empleado").replace(/\s+/g, "_");
  return "Horas_" + emp + "_" + MESES[estado.mes] + "_" + estado.anio + "." + ext;
}

/* datos comunes para Excel y PDF */
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

/* ---------- Excel (blob) ---------- */
async function generarXlsxBlob(){
  const emp = estado.empleado.trim() || "Empleado";
  const per = MESES[estado.mes] + " " + estado.anio;
  const mon = cfg.moneda || "S/";
  const { encab, filas, totales, nCols, m } = _datosExport();

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Horas", { views:[{ showGridLines:false }] });
  const BORDE = { top:{style:"thin",color:{argb:"FFBFC9D4"}}, left:{style:"thin",color:{argb:"FFBFC9D4"}},
                  bottom:{style:"thin",color:{argb:"FFBFC9D4"}}, right:{style:"thin",color:{argb:"FFBFC9D4"}} };
  const centro = { vertical:"middle", horizontal:"center" };

  ws.mergeCells(1,1,1,nCols);
  const t = ws.getCell(1,1);
  t.value = "RESUMEN DE HORAS — " + emp + " · " + per;
  t.font = { bold:true, size:14, color:{argb:"FF1E2A3A"} }; t.alignment = centro;
  ws.getRow(1).height = 26;

  const hr = ws.getRow(3);
  encab.forEach((h,i) => { const c=hr.getCell(i+1); c.value=h;
    c.font={bold:true,color:{argb:"FFFFFFFF"},size:10};
    c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFF26522"}};
    c.alignment={...centro,wrapText:true}; c.border=BORDE; });
  hr.height = 24;

  filas.forEach((f,ri) => {
    const r = ws.getRow(4+ri);
    f.row.forEach((v,ci) => { const c=r.getCell(ci+1); c.value=v; c.alignment=centro; c.border=BORDE; c.font={size:10}; });
    let bg = f.tipo==="domingo"?"FFFDECEB":f.tipo==="feriado"?"FFFFF2E2":f.tipo==="sabado"?"FFE7F6F0":null;
    if(bg) r.eachCell(c => { c.fill={type:"pattern",pattern:"solid",fgColor:{argb:bg}}; });
  });

  const tr = ws.getRow(4+filas.length);
  totales.forEach((v,ci) => { const c=tr.getCell(ci+1); c.value=v; c.alignment=centro; c.border=BORDE;
    c.font={bold:true,size:10}; c.fill={type:"pattern",pattern:"solid",fgColor:{argb:"FFFDE8DD"}}; });

  const rTot = 4 + filas.length;
  const pagoFilas = [
    ["Horas normales pagadas", +fmt(m.normPag), "Tarifa", +fmt(cfg.tarifaNormal), "Subtotal", mon+" "+fmt(m.salarioNormal)],
    ["Horas extras pagadas",   +fmt(m.extrasPag), "Tarifa", +fmt(cfg.tarifaExtra),  "Subtotal", mon+" "+fmt(m.salarioExtra)],
    ["TOTAL A PAGAR", "", "", "", "", mon+" "+fmt(m.salario)]
  ];
  pagoFilas.forEach((pf,pi) => {
    const r = ws.getRow(rTot+2+pi);
    pf.forEach((v,ci) => { const c=r.getCell(ci+1); c.value=v; c.border=BORDE;
      c.alignment={vertical:"middle",horizontal: ci===0?"left":"center"}; c.font={size:10,bold:pi===2}; });
    const es = (pi===2);
    r.eachCell(c => { c.fill={type:"pattern",pattern:"solid",fgColor:{argb: es?"FFF26522":"FFFDE8DD"}};
                      if(es) c.font={bold:true,size:12,color:{argb:"FFFFFFFF"}}; });
  });

  ws.columns.forEach((col,i) => { const h=encab[i]||""; col.width = i===0?18 : i===1?12 : /Descrip|Nota/.test(h)?20 : 10; });

  const fFirma = rTot + 8;
  ws.getCell(fFirma,1).value = "_______________________________";
  ws.getCell(fFirma+1,1).value = "Firma del empleado";
  const colJefe = Math.max(5, nCols-3);
  ws.getCell(fFirma,colJefe).value = "_______________________________";
  ws.getCell(fFirma+1,colJefe).value = "Firma del jefe de área";

  const buf = await wb.xlsx.writeBuffer();
  return new Blob([buf], { type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/* ---------- PDF (blob) ---------- */
function generarPdfDoc(){
  const emp = estado.empleado.trim() || "Empleado";
  const per = MESES[estado.mes] + " " + estado.anio;
  const mon = cfg.moneda || "S/";
  const { encab, filas, totales, m } = _datosExport();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" });

  doc.setFontSize(13); doc.setTextColor(30,42,58);
  doc.text("RESUMEN DE HORAS — " + emp + " · " + per, 14, 14);

  doc.autoTable({
    head:[encab], body: filas.map(f=>f.row), foot:[totales],
    startY:20, styles:{ fontSize:7, cellPadding:1.5, halign:"center" },
    headStyles:{ fillColor:[242,97,31], textColor:255, fontSize:7 },
    footStyles:{ fillColor:[253,232,221], textColor:[30,42,58], fontStyle:"bold" },
    theme:"grid"
  });

  let y = doc.lastAutoTable.finalY + 8;
  doc.setFontSize(9); doc.setTextColor(30,42,58);
  doc.text(`Horas normales pagadas: ${fmt(m.normPag)} × ${mon} ${fmt(cfg.tarifaNormal)} = ${mon} ${fmt(m.salarioNormal)}`, 14, y);
  doc.text(`Horas extras pagadas: ${fmt(m.extrasPag)} × ${mon} ${fmt(cfg.tarifaExtra)} = ${mon} ${fmt(m.salarioExtra)}`, 14, y+6);
  doc.setFontSize(12); doc.setTextColor(200,72,15);
  doc.text(`TOTAL A PAGAR: ${mon} ${fmt(m.salario)}`, 14, y+15);

  doc.setFontSize(9); doc.setTextColor(30,42,58);
  doc.text("_______________________", 30, y+34);
  doc.text("Firma del empleado", 40, y+39);
  doc.text("_______________________", 170, y+34);
  doc.text("Firma del jefe de área", 182, y+39);
  return doc;
}

function descargarPDF(){ generarPdfDoc().save(_nombreArchivo("pdf")); }

/* ---------- descargas / util ---------- */
function _descargarBlob(blob, nombre){
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function _blobABase64(blob){
  return new Promise((res,rej) => {
    const r = new FileReader();
    r.onloadend = () => res(String(r.result).split(",")[1]);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

async function exportarExcel(){ _descargarBlob(await generarXlsxBlob(), _nombreArchivo("xlsx")); }

function imprimir(){ window.print(); }

/* ---------- envío por correo ---------- */
async function enviarPorCorreo(){
  const to = (cfg.correoDestino || "").trim();
  if(!to){ alert("Primero configura el 'Correo de destino' en ⚙ Ajustes."); return; }
  if(!MODO_NUBE){ alert("Necesitas haber iniciado sesión (modo nube) para enviar por correo."); return; }
  if(!estado.empleado.trim()){ alert("Escribe el nombre del empleado antes de enviar."); return; }

  setSaved("Preparando y enviando…");
  try{
    const xls = await generarXlsxBlob();
    const pdf = generarPdfDoc().output("blob");
    const payload = {
      to,
      subject: "Reporte de horas — " + estado.empleado.trim() + " · " + MESES[estado.mes] + " " + estado.anio,
      empleado: estado.empleado.trim(),
      periodo: MESES[estado.mes] + " " + estado.anio,
      xlsxName: _nombreArchivo("xlsx"), xlsxB64: await _blobABase64(xls),
      pdfName:  _nombreArchivo("pdf"),  pdfB64:  await _blobABase64(pdf)
    };
    await cloudEnviarReporte(payload);
    setSaved("Reporte enviado ✓");
    alert("Reporte enviado a " + to);
  }catch(e){
    setSaved("No se pudo enviar");
    alert("No se pudo enviar el correo.\n\n" + (e.message || e) +
          "\n\nRevisa que la función 'enviar-reporte' esté desplegada y las claves de Zoho configuradas.");
  }
}
