# Brighter WorkLog — Registro de Horas

Software de registro de horas y cálculo de pago para Brighter Perú S.A.C.
Reemplaza las planillas de asistencia en Excel con una app que calcula horas
normales, extras y salario según la lógica oficial de Brighter.

## Estado

**Fase 1 — Motor + tabla de un empleado** ✅ (en curso)

- Tabla mensual editable con las 4 marcas (Entrada / Salida / Entrada2 / Salida2).
- Cálculo automático de horas trabajadas (descuenta el refrigerio entre turnos).
- Horas normales topadas por día (día completo / media jornada).
- Horas extras sugeridas y editables a mano.
- Horas de baja y descripción por día.
- Balance acumulado (compensación de excesos y faltas del mes).
- Colores por estado: sábado media jornada, domingo, feriado, día con extras, baja.
- Ajustes avanzados: días laborables (lun–sáb por defecto), topes de horas, día de media jornada.
- Guardado local automático por empleado + mes.
- Panel "Cómo se contabiliza" siempre visible.

### Próximas fases

- **Fase 2** — Cierre de mes, cálculo de salario (tarifa normal + extra), multi-empleado, auto-nombrado del mes siguiente.
- **Fase 3** — Exportar a Excel (formato oficial con firmas), PDF y Word imprimibles, imprimir, subida a Google Drive.

## Estructura del proyecto

```
PROYECTO-Brighter-WorkLog/
├── index.html           # estructura de la página
├── css/
│   └── styles.css       # todos los estilos
├── js/
│   ├── config.js        # constantes, config por defecto y estado global
│   ├── utils.js         # utilidades de tiempo y formato
│   ├── storage.js       # guardado/carga en localStorage
│   ├── calc.js          # motor de cálculo (día y meta)
│   ├── render.js        # generar mes, pintar tabla y editar celdas
│   ├── settings.js      # modal de ajustes avanzados
│   └── app.js           # arranque e inicialización
├── README.md
└── .gitignore
```

## Uso

Abrir `index.html` en el navegador (doble clic). No requiere instalación ni servidor.
Los datos se guardan en el navegador (localStorage) del equipo donde se usa.

## Lógica de cálculo

```
Horas trabajadas = (Salida − Entrada) + (Salida2 − Entrada2)   ← el almuerzo no se paga
Meta del día     = 8.50 h (lun–vie) · 5.50 h (sáb) · 0 (dom/feriado)
Horas normales   = mín(trabajadas, meta)
Horas extras     = máx(0, trabajadas − meta)      (sugerido, editable)
Balance del día  = trabajadas − meta              (+ exceso / − falta)
```

Al cerrar el mes (Fase 2), los excesos compensan las faltas y solo el neto positivo
se paga como horas extras.
