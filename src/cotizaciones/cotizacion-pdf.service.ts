import { Injectable } from '@nestjs/common';
import * as path from 'path';
import * as fs from 'fs';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const PdfPrinter = require('pdfmake/src/printer');

const FONT_BASE = path.join(process.cwd(), 'node_modules/pdfjs-dist/standard_fonts');

const printer = new PdfPrinter({
  Sans: {
    normal:      path.join(FONT_BASE, 'LiberationSans-Regular.ttf'),
    bold:        path.join(FONT_BASE, 'LiberationSans-Bold.ttf'),
    italics:     path.join(FONT_BASE, 'LiberationSans-Italic.ttf'),
    bolditalics: path.join(FONT_BASE, 'LiberationSans-BoldItalic.ttf'),
  },
});

// ── Color palette ──────────────────────────────────────────────────────────
const BLUE    = '#1D4ED8';
const DARK    = '#0D0E18';
const MUTED   = '#6B6C7A';
const BORDER  = '#E2DDD5';
const GREEN   = '#0F7A52';
const RED     = '#B91C1C';
const BG_BLUE = '#EEF2FF';
const GOLD    = '#9D6E2F';
const BG_GOLD = '#FBF3E0';

// ── Logo (leído una sola vez al iniciar) ──────────────────────────────────
function loadLogoBase64(): string | null {
  const logoPath = path.join(process.cwd(), 'public', 'logo-empresa.png');
  try {
    const buf = fs.readFileSync(logoPath);
    return `data:image/png;base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}
const LOGO_B64 = loadLogoBase64();

// ── Helpers ────────────────────────────────────────────────────────────────
const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fmtDate(s?: string | null): string {
  if (!s) return '';
  const [y, m, d] = s.split('-');
  return `${+d} ${MONTHS[+m - 1]} ${y}`;
}

function fmtCOP(n?: number | null): string {
  if (!n && n !== 0) return '';
  return new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0,
  }).format(n);
}

function city(s?: string | null): string {
  return s?.split('(')[0]?.trim() ?? s ?? '';
}

function iataCode(s?: string | null): string {
  return s?.match(/\(([A-Z]{3})\)/)?.[1] ?? s?.substring(0, 3).toUpperCase() ?? '—';
}

// ── Thin horizontal divider ────────────────────────────────────────────────
function divider(color = BORDER, margin: number[] = [0, 8, 0, 8]) {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: color }],
    margin,
  };
}

// ── Section header ─────────────────────────────────────────────────────────
function sectionHeader(label: string) {
  return {
    columns: [
      { canvas: [{ type: 'rect', x: 0, y: 2, w: 3, h: 12, color: BLUE }], width: 10 },
      { text: label.toUpperCase(), bold: true, fontSize: 9, color: BLUE, letterSpacing: 1 },
    ],
    margin: [0, 20, 0, 10],
  };
}

// ── Key/value pair ─────────────────────────────────────────────────────────
function kv(label: string, value: string, options: Record<string, any> = {}) {
  return {
    columns: [
      { text: label, color: MUTED, fontSize: 8.5, width: 130 },
      { text: value || '—', fontSize: 8.5, bold: true, color: DARK, ...options },
    ],
    margin: [0, 2, 0, 2],
  };
}

// ── Badge pill ─────────────────────────────────────────────────────────────
function badge(text: string, bg = BG_GOLD, color = GOLD) {
  return {
    text,
    fontSize: 7.5,
    bold: true,
    color,
    background: bg,
    margin: [0, 0, 4, 4],
  };
}

@Injectable()
export class CotizacionPdfService {
  async generate(data: Record<string, any>, empresa: Record<string, any>): Promise<Buffer> {
    const vuelos: any[]       = (data.vuelos as any[]) ?? [];
    const hoteles: any[]      = (data.opciones_hotel as any[]) ?? [];
    const adicionales: any[]  = (data.adicionales as any[]) ?? [];
    const incluidos: string[] = (data.items_incluidos as string[]) ?? [];
    const excluidos: string[] = (data.items_no_incluidos as string[]) ?? [];

    const totalVuelos    = vuelos.reduce((s, v) => s + (Number(v.costo) || 0), 0);
    const totalHoteles   = hoteles.reduce((s, h) => s + (Number(h.precio_total) || 0), 0);
    const totalAdicional = adicionales.reduce((s, a) => s + (Number(a.precio) || 0), 0);
    const total          = totalVuelos + totalHoteles + totalAdicional || (Number(data.precio_total) || 0);

    const ref      = (data.token as string)?.substring(0, 8).toUpperCase() ?? '';
    const fechaDoc = fmtDate(new Date().toISOString().substring(0, 10));

    const empNombre  = empresa?.nombre  ?? 'Travel Agency';
    const empTel     = empresa?.telefono ?? '';
    const empCorreo  = empresa?.correo   ?? '';
    const empWeb     = empresa?.pagina_web ?? '';
    const empDir     = empresa?.direccion_sede_principal ?? '';

    const content: any[] = [];

    // ══ HEADER ═══════════════════════════════════════════════════════════════
    const headerLeft: any = LOGO_B64
      ? { image: LOGO_B64, height: 36, fit: [160, 36] }
      : { text: empNombre, bold: true, fontSize: 15, color: DARK };

    content.push({
      columns: [
        headerLeft,
        {
          stack: [
            { text: 'COTIZACIÓN DE VIAJE', bold: true, fontSize: 10, color: BLUE, alignment: 'right' },
            { text: `Ref. ${ref}`, fontSize: 8, color: MUTED, alignment: 'right', margin: [0, 3, 0, 0] },
            { text: fechaDoc, fontSize: 8, color: MUTED, alignment: 'right' },
          ],
        },
      ],
      margin: [0, 0, 0, 10],
    });

    content.push(divider(BLUE, [0, 0, 0, 10]));

    // ══ NOMBRE + DATOS CLIENTE ════════════════════════════════════════════════
    content.push({
      text: data.titulo_viaje ?? 'Paquete de viaje',
      bold: true, fontSize: 15, color: DARK,
      margin: [0, 0, 0, 6],
    });
    content.push({
      columns: [
        { text: [{ text: 'Para: ', color: MUTED, fontSize: 9 }, { text: data.nombre_cliente ?? '—', bold: true, fontSize: 9, color: DARK }] },
        { text: [{ text: 'Tel: ', color: MUTED, fontSize: 9 }, { text: data.telefono_cliente ?? '—', bold: true, fontSize: 9, color: DARK }] },
      ],
      margin: [0, 0, 0, 14],
    });

    // ══ VUELOS ════════════════════════════════════════════════════════════════
    if (vuelos.length > 0) {
      content.push(sectionHeader(`Vuelos  (${vuelos.length} tramo${vuelos.length > 1 ? 's' : ''})`));

      for (const v of vuelos) {
        const tipoLabel = v.tipo === 'ida' ? 'VUELO DE IDA' : 'VUELO DE VUELTA';
        const origCity  = city(v.origen);
        const destCity  = city(v.destino);
        const origCode  = iataCode(v.origen);
        const destCode  = iataCode(v.destino);
        const aerolinea = v.aerolinea?.nombre ?? '';
        const iata      = v.aerolinea?.codigo_iata ?? '';
        const headerBg  = v.tipo === 'ida' ? '#0D1E6A' : '#0E0E18';

        // Escalas rows (entre header y body)
        const escalas: any[] = Array.isArray(v.escalas) && v.escalas.length > 0 ? v.escalas : [];

        const escalaRows: any[][] = escalas.map((e) => {
          const parts: any[] = [
            { text: 'ESCALA', fontSize: 7.5, bold: true, color: BLUE, margin: [0, 0, 6, 0] },
            { text: e.destino ?? '', bold: true, fontSize: 10.5, color: DARK, margin: [0, 0, 6, 0] },
          ];
          if (e.tiempo_conexion) {
            parts.push({ text: e.tiempo_conexion, fontSize: 7.5, bold: true, color: BLUE, background: BG_BLUE, margin: [0, 0, 6, 0] });
          }
          const detParts: string[] = [];
          if (e.aerolinea) detParts.push(e.aerolinea);
          if (e.numero_vuelo) detParts.push(e.numero_vuelo);
          if (e.origen && e.destino) detParts.push(`${e.origen} → ${e.destino}`);
          if (e.hora_salida && e.hora_llegada) detParts.push(`${e.hora_salida} – ${e.hora_llegada}`);
          return [{
            stack: [
              { columns: parts, columnGap: 2, margin: [0, 0, 0, 3] },
              detParts.length ? { text: detParts.join('  ·  '), fontSize: 7.5, color: MUTED } : {},
            ],
            fillColor: '#F8F8FA',
            border: [true, false, true, true],
            borderColor: [BORDER, BORDER, BORDER, BORDER],
            margin: [16, 8, 16, 8],
          }];
        });

        // Legacy escala
        if (!escalas.length && v.tiene_escala) {
          escalaRows.push([{
            text: `ESCALA  ${v.ciudad_escala ?? ''}${v.tiempo_escala ? '  (' + v.tiempo_escala + ')' : ''}`,
            fontSize: 8, color: MUTED, fillColor: '#F8F8FA',
            border: [true, false, true, true],
            borderColor: [BORDER, BORDER, BORDER, BORDER],
            margin: [16, 8, 16, 8],
          }]);
        }

        // Footer columns: Fecha | Sale | Llega | Vuelo | [Pasajeros] | [Precio]
        const footCols: any[] = [];
        const footCell = (lbl: string, val: string) => ({
          stack: [
            { text: lbl, fontSize: 6.5, bold: true, color: MUTED },
            { text: val || '—', fontSize: 10, bold: true, color: DARK, margin: [0, 3, 0, 0] },
          ],
          margin: [14, 10, 14, 10],
          border: [false, false, true, false],
          borderColor: [BORDER, BORDER, BORDER, BORDER],
        });

        if (v.fecha)            footCols.push(footCell('FECHA',      fmtDate(v.fecha)));
        if (v.hora_salida)      footCols.push(footCell('SALE',       v.hora_salida));
        if (v.hora_llegada)     footCols.push(footCell('LLEGA',      v.hora_llegada));
        if (v.numero_vuelo)     footCols.push(footCell('VUELO',      v.numero_vuelo));
        if (v.numero_pasajeros) footCols.push(footCell('PASAJEROS',  `${v.numero_pasajeros}`));

        // El último no lleva borde derecho
        if (footCols.length > 0) {
          footCols[footCols.length - 1].border = [false, false, false, false];
        }

        // Precio aparte abajo si existe
        const precioText = v.costo > 0
          ? { text: fmtCOP(v.costo), bold: true, fontSize: 9, color: BLUE, alignment: 'right', border: [false, false, false, false], margin: [14, 10, 14, 10] }
          : { text: 'Incluido', fontSize: 9, color: GREEN, alignment: 'right', border: [false, false, false, false], margin: [14, 10, 14, 10] };

        // Boarding pass como tabla con filas
        const bpBody: any[][] = [
          // ── Row 1: Header oscuro ───────────────────────────────────────────
          [{
            columns: [
              { text: tipoLabel, fontSize: 8, bold: true, color: 'rgba(255,255,255,0.70)', letterSpacing: 1, width: '*' },
              aerolinea
                ? { text: `${aerolinea}${iata ? '  ·  ' + iata : ''}`, fontSize: 8, bold: true, color: 'rgba(255,255,255,0.85)', alignment: 'right' }
                : {},
            ],
            fillColor: headerBg,
            border: [false, false, false, false],
            margin: [18, 12, 18, 12],
          }],
          // ── Row 2+: Escalas (si hay) ───────────────────────────────────────
          ...escalaRows,
          // ── Row 3: Body principal (horas + ruta) ──────────────────────────
          [{
            table: {
              widths: ['*', 90, '*'],
              body: [[
                // Izquierda: origen
                {
                  stack: [
                    { text: v.hora_salida ?? '', bold: true, fontSize: 26, color: DARK, lineHeight: 1 },
                    { text: origCode, fontSize: 10, bold: true, color: BLUE, margin: [0, 5, 0, 3] },
                    { text: origCity, fontSize: 8, color: MUTED },
                  ],
                  border: [false, false, false, false],
                  margin: [24, 16, 8, 16],
                },
                // Centro: avión + línea (centrado verticalmente con margin)
                {
                  stack: [
                    { text: '✈', fontSize: 13, color: MUTED, alignment: 'center', margin: [0, 0, 0, 5] },
                    { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 90, y2: 0, lineWidth: 0.5, lineColor: BORDER }] },
                  ],
                  border: [false, false, false, false],
                  margin: [0, 22, 0, 0],
                  alignment: 'center',
                },
                // Derecha: destino (alineado a la derecha)
                {
                  stack: [
                    { text: v.hora_llegada ?? '', bold: true, fontSize: 26, color: DARK, lineHeight: 1, alignment: 'right' },
                    { text: destCode, fontSize: 10, bold: true, color: BLUE, margin: [0, 5, 0, 3], alignment: 'right' },
                    { text: destCity, fontSize: 8, color: MUTED, alignment: 'right' },
                  ],
                  border: [false, false, false, false],
                  margin: [8, 16, 24, 16],
                },
              ]],
            },
            layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
            border: [false, false, false, false],
            margin: [0, 0, 0, 0],
          }],
          // ── Row 4: Separador punteado + footer grid ───────────────────────
          [{
            stack: [
              // Línea punteada dentro de los márgenes de la tarjeta
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: BORDER, dash: { length: 4, space: 3 } }] },
              // Grid de datos
              {
                table: {
                  widths: footCols.length > 0 ? [...footCols.map(() => '*'), 'auto'] : ['*'],
                  body: [footCols.length > 0 ? [...footCols, precioText] : [{ text: '' }]],
                },
                layout: {
                  hLineWidth: () => 0,
                  vLineWidth: (i: number, node: any) => (i > 0 && i < node.table.widths.length ? 0.5 : 0),
                  vLineColor: () => BORDER,
                  paddingLeft:  () => 0,
                  paddingRight: () => 0,
                  paddingTop:   () => 0,
                  paddingBottom: () => 0,
                },
              },
            ],
            fillColor: '#FAF9F6',
            border: [false, false, false, false],
            margin: [0, 0, 0, 0],
          }],
        ];

        content.push({
          table: { widths: ['*'], body: bpBody },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1 : 0),
            vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 1 : 0),
            hLineColor: () => BORDER,
            vLineColor: () => BORDER,
            paddingLeft:   () => 0,
            paddingRight:  () => 0,
            paddingTop:    () => 0,
            paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 12],
        });
      }
    }

    // ══ HOTELES ═══════════════════════════════════════════════════════════════
    if (hoteles.length > 0) {
      content.push(sectionHeader(`Alojamiento  (${hoteles.length} opción${hoteles.length > 1 ? 'es' : ''})`));

      for (let hi = 0; hi < hoteles.length; hi++) {
        const h = hoteles[hi];
        const queIncluye: string[] = (h.que_incluye as string[]) ?? [];
        const hotelRows: any[][] = [];
        const esMultiple = hoteles.length > 1;

        // ── Fila 0: banda "OPCIÓN N" (solo si hay más de un hotel) ──────────
        if (esMultiple) {
          hotelRows.push([{
            text: `OPCIÓN  ${hi + 1}`,
            fontSize: 7.5, bold: true, color: '#FFFFFF',
            letterSpacing: 1,
            fillColor: hi === 0 ? BLUE : '#374151',
            border: [false, false, false, false],
            margin: [16, 8, 16, 8],
          }]);
        }

        // ── Fila 1: nombre + tipo habitación + precio total ─────────────────
        hotelRows.push([{
          table: {
            widths: ['*', 'auto'],
            body: [[
              {
                stack: [
                  { text: h.nombre ?? '—', bold: true, fontSize: 13, color: DARK },
                  { text: h.tipo_habitacion ?? '', fontSize: 9, color: MUTED, margin: [0, 3, 0, 0] },
                ],
                border: [false, false, false, false],
              },
              h.precio_total > 0
                ? { text: fmtCOP(h.precio_total), bold: true, fontSize: 13, color: BLUE, alignment: 'right', border: [false, false, false, false], margin: [8, 0, 0, 0] }
                : { text: '', border: [false, false, false, false] },
            ]],
          },
          layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
          border: [false, false, false, false],
          margin: [16, 14, 16, 10],
        }]);

        // ── Fila 2: que incluye ─────────────────────────────────────────────
        if (queIncluye.length > 0) {
          const colsPerRow = 3;
          const tagRows: any[][] = [];
          for (let i = 0; i < queIncluye.length; i += colsPerRow) {
            const group = queIncluye.slice(i, i + colsPerRow);
            while (group.length < colsPerRow) group.push('');
            tagRows.push(group.map(t => ({
              stack: t ? [
                { text: '✓', fontSize: 7, bold: true, color: GREEN },
                { text: t, fontSize: 8, color: DARK, margin: [0, 2, 0, 0] },
              ] : [{ text: '' }],
              border: [false, false, false, false],
              margin: [14, 7, 14, 7],
            })));
          }

          hotelRows.push([{
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER }] },
              {
                table: { widths: ['*', '*', '*'], body: tagRows },
                layout: {
                  defaultBorder: false,
                  hLineWidth: (i: number) => (i > 0 ? 0.5 : 0),
                  hLineColor: () => BORDER,
                  vLineWidth: (i: number, node: any) => (i > 0 && i < node.table.widths.length ? 0.5 : 0),
                  vLineColor: () => BORDER,
                  paddingLeft: () => 0, paddingRight: () => 0,
                  paddingTop: () => 0, paddingBottom: () => 0,
                },
                margin: [0, 0, 0, 0],
              },
            ],
            border: [false, false, false, false],
            margin: [0, 0, 0, 0],
          }]);
        }

        // ── Fila 3: check-in / check-out (tabla de 3 columnas) ─────────────
        hotelRows.push([{
          table: {
            widths: ['*', 30, '*'],
            body: [[
              {
                stack: [
                  { text: 'CHECK-IN', fontSize: 7, bold: true, color: MUTED },
                  { text: fmtDate(h.fecha_entrada), bold: true, fontSize: 11, color: DARK, margin: [0, 4, 0, 2] },
                  { text: h.hora_entrada ?? '', fontSize: 9, color: BLUE, bold: true },
                ],
                border: [false, false, false, false],
              },
              {
                text: '→',
                fontSize: 16, color: MUTED, alignment: 'center',
                border: [false, false, false, false],
                margin: [0, 14, 0, 0],
              },
              {
                stack: [
                  { text: 'CHECK-OUT', fontSize: 7, bold: true, color: MUTED, alignment: 'right' },
                  { text: fmtDate(h.fecha_salida), bold: true, fontSize: 11, color: DARK, margin: [0, 4, 0, 2], alignment: 'right' },
                  { text: h.hora_salida ?? '', fontSize: 9, color: BLUE, bold: true, alignment: 'right' },
                ],
                border: [false, false, false, false],
              },
            ]],
          },
          layout: { defaultBorder: false, paddingLeft: () => 0, paddingRight: () => 0, paddingTop: () => 0, paddingBottom: () => 0 },
          fillColor: '#F8F9FF',
          border: [false, false, false, false],
          margin: [16, 0, 16, 0],
        }]);

        // ── Fila 4: precios adulto / menor / total ──────────────────────────
        if (h.precio_adulto != null || h.precio_menor != null) {
          const priceCols: any[] = [];
          const priceCell = (lbl: string, val: string, isTotal = false) => ({
            stack: [
              { text: lbl, fontSize: 7, color: MUTED, bold: true },
              { text: val, fontSize: isTotal ? 11 : 10, bold: true, color: isTotal ? BLUE : DARK, margin: [0, 3, 0, 0] },
            ],
            border: [false, false, true, false],
            borderColor: [BORDER, BORDER, BORDER, BORDER],
            margin: [16, 10, 16, 10],
          });

          if (h.precio_adulto != null) priceCols.push(priceCell('POR ADULTO', fmtCOP(h.precio_adulto)));
          if (h.precio_menor  != null) priceCols.push(priceCell('POR MENOR',  fmtCOP(h.precio_menor)));
          const totalCell = priceCell('TOTAL PAQUETE', fmtCOP(h.precio_total), true);
          totalCell.border = [false, false, false, false];
          priceCols.push(totalCell);

          hotelRows.push([{
            table: {
              widths: priceCols.map(() => '*'),
              body: [priceCols],
            },
            layout: {
              hLineWidth: () => 0,
              vLineWidth: (i: number, node: any) => (i > 0 && i < node.table.widths.length ? 0.5 : 0),
              vLineColor: () => BORDER,
              paddingLeft: () => 0, paddingRight: () => 0,
              paddingTop: () => 0, paddingBottom: () => 0,
            },
            fillColor: '#FAF9F6',
            border: [false, false, false, false],
            margin: [0, 0, 0, 0],
          }]);
        }

        // ── Fila 5: notas ───────────────────────────────────────────────────
        if (h.notas) {
          hotelRows.push([{
            stack: [
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 0.5, lineColor: BORDER }] },
              { text: 'NOTAS ADICIONALES', fontSize: 7, bold: true, color: MUTED, margin: [0, 8, 0, 4] },
              { text: h.notas, fontSize: 9, color: DARK, italics: true, lineHeight: 1.4 },
            ],
            border: [false, false, false, false],
            margin: [16, 0, 16, 12],
          }]);
        }

        const accentColor = hi === 0 ? BLUE : '#374151';
        content.push({
          table: { widths: ['*'], body: hotelRows },
          layout: {
            hLineWidth: (i: number, node: any) => (i === 0 || i === node.table.body.length ? 1.5 : 0),
            vLineWidth: (i: number, node: any) => (i === 0 || i === node.table.widths.length ? 1.5 : 0),
            hLineColor: () => accentColor,
            vLineColor: () => accentColor,
            paddingLeft: () => 0, paddingRight: () => 0,
            paddingTop: () => 0, paddingBottom: () => 0,
          },
          margin: [0, 0, 0, 14],
        });
      }
    }

    // ══ ADICIONALES ══════════════════════════════════════════════════════════
    if (adicionales.length > 0) {
      content.push(sectionHeader('Servicios adicionales'));

      for (const a of adicionales) {
        content.push({
          columns: [
            {
              stack: [
                { text: a.nombre ?? '—', fontSize: 9.5, color: DARK, bold: true },
                a.descripcion ? { text: a.descripcion, fontSize: 8, color: MUTED, margin: [0, 1, 0, 0] } : {},
              ],
              width: '*',
            },
            a.precio > 0
              ? { text: fmtCOP(a.precio), fontSize: 9.5, bold: true, color: BLUE, alignment: 'right', width: 120 }
              : { text: 'Incluido', fontSize: 9, color: GREEN, alignment: 'right', width: 120 },
          ],
          margin: [0, 3, 0, 3],
        });
        content.push(divider(BORDER, [0, 2, 0, 2]));
      }
    }

    // ══ INCLUYE / NO INCLUYE ═════════════════════════════════════════════════
    if (incluidos.length > 0 || excluidos.length > 0) {
      content.push(sectionHeader('Incluye / No incluye'));
      content.push({
        columns: [
          incluidos.length > 0
            ? {
              stack: [
                { text: 'INCLUYE', bold: true, fontSize: 8, color: GREEN, margin: [0, 0, 0, 5] },
                ...incluidos.map(i => ({
                  columns: [
                    { text: '✓', color: GREEN, fontSize: 9, width: 12, margin: [0, 1, 0, 0] },
                    { text: i, fontSize: 8.5, color: DARK },
                  ],
                  margin: [0, 2, 0, 2],
                })),
              ],
              width: '*',
            }
            : { text: '' },
          excluidos.length > 0
            ? {
              stack: [
                { text: 'NO INCLUYE', bold: true, fontSize: 8, color: RED, margin: [0, 0, 0, 5] },
                ...excluidos.map(i => ({
                  columns: [
                    { text: '✗', color: RED, fontSize: 9, width: 12, margin: [0, 1, 0, 0] },
                    { text: i, fontSize: 8.5, color: MUTED },
                  ],
                  margin: [0, 2, 0, 2],
                })),
              ],
              width: '*',
            }
            : { text: '' },
        ],
        columnGap: 24,
      });
    }

    // ══ TOTAL — desglose en filas por opción de hotel ════════════════════════
    content.push(sectionHeader('Resumen de precios'));

    // Helper: fila concepto–valor
    const fila = (label: string, valor: string, isTotal = false, isSubItem = false): any[] => [
      {
        text: label,
        fontSize: isTotal ? 10 : isSubItem ? 8.5 : 9,
        bold: isTotal,
        italics: isSubItem,
        color: isSubItem ? MUTED : DARK,
        border: [false, isTotal, false, false],
        borderColor: [BORDER, BLUE, BORDER, BORDER],
        margin: [isSubItem ? 16 : 0, isTotal ? 8 : 4, 0, isTotal ? 8 : 4],
      },
      {
        text: valor,
        fontSize: isTotal ? 13 : isSubItem ? 8.5 : 9,
        bold: isTotal,
        color: isTotal ? BLUE : isSubItem ? MUTED : DARK,
        alignment: 'right',
        border: [false, isTotal, false, false],
        borderColor: [BORDER, BLUE, BORDER, BORDER],
        margin: [0, isTotal ? 8 : 4, 0, isTotal ? 8 : 4],
      },
    ];

    const bloqueResumen = (h: any | null, idx: number | null) => {
      const rows: any[][] = [];

      // Encabezado opción (solo si hay múltiples hoteles)
      if (idx !== null) {
        const accentColor = idx === 0 ? BLUE : '#374151';
        rows.push([{
          columns: [
            { text: `OPCIÓN ${idx + 1}`, fontSize: 7.5, bold: true, color: '#fff', width: 'auto' },
            { text: h?.nombre ?? '', fontSize: 7.5, color: 'rgba(255,255,255,0.75)', margin: [8, 0, 0, 0] },
          ],
          fillColor: accentColor,
          colSpan: 2,
          border: [false, false, false, false],
          margin: [10, 7, 10, 7],
        }, {}]);
      }

      // Vuelos
      if (totalVuelos > 0) {
        rows.push(fila(`Vuelos (${vuelos.length} tramo${vuelos.length > 1 ? 's' : ''})`, fmtCOP(totalVuelos)));
      }

      // Alojamiento
      if (h) {
        rows.push(fila(`Alojamiento — ${h.nombre ?? ''}`, fmtCOP(h.precio_total)));
        if (h.precio_adulto != null) rows.push(fila('Por adulto', fmtCOP(h.precio_adulto), false, true));
        if (h.precio_menor  != null) rows.push(fila('Por menor',  fmtCOP(h.precio_menor),  false, true));
      }

      // Adicionales
      if (totalAdicional > 0) {
        rows.push(fila('Servicios adicionales', fmtCOP(totalAdicional)));
      }

      // Total
      const totalOpcion = totalVuelos + (h ? Number(h.precio_total) || 0 : 0) + totalAdicional;
      rows.push(fila('TOTAL DEL PAQUETE', fmtCOP(totalOpcion), true));

      return {
        table: { widths: ['*', 'auto'], body: rows },
        layout: {
          hLineWidth: (i: number, node: any) => {
            const last = node.table.body.length;
            if (i === last - 1 || i === last) return 1.5;
            return 0.5;
          },
          hLineColor: (i: number, node: any) => {
            const last = node.table.body.length;
            return (i === last - 1 || i === last) ? BLUE : BORDER;
          },
          vLineWidth: () => 0,
          paddingLeft:   () => 0,
          paddingRight:  () => 0,
          paddingTop:    () => 0,
          paddingBottom: () => 0,
        },
        margin: [0, 0, 0, 14],
      };
    };

    if (hoteles.length > 1) {
      // Un bloque por cada opción de hotel
      hoteles.forEach((h: any, i: number) => content.push(bloqueResumen(h, i)));
    } else {
      // Bloque único sin encabezado de opción
      content.push(bloqueResumen(hoteles[0] ?? null, null));
    }

    // ══ CONDICIONES GENERALES ════════════════════════════════════════════════
    if (data.condiciones_generales) {
      content.push(sectionHeader('Condiciones generales'));
      content.push({
        table: {
          widths: ['*'],
          body: [[{
            text: data.condiciones_generales,
            fontSize: 8, color: MUTED, lineHeight: 1.5,
            border: [true, true, true, true],
            borderColor: [BORDER, BORDER, BORDER, BORDER],
            margin: [10, 8, 10, 8],
          }]],
        },
        margin: [0, 0, 0, 4],
      });
    }

    // ══ DOC DEFINITION ═══════════════════════════════════════════════════════
    const footerLine1Items: string[] = [empNombre];
    if (empTel)    footerLine1Items.push(`Tel: ${empTel}`);
    if (empCorreo) footerLine1Items.push(empCorreo);
    if (empWeb)    footerLine1Items.push(empWeb);
    if (empDir)    footerLine1Items.push(empDir);

    const docDefinition: any = {
      content,
      defaultStyle: { font: 'Sans', fontSize: 10, color: DARK, lineHeight: 1.4 },
      pageMargins: [40, 50, 40, 65],
      pageSize: 'A4',
      info: {
        title: data.titulo_viaje ?? 'Cotización',
        author: empNombre,
      },
      // ── Header en cada página (logo solo desde pág. 2) ───────────────────
      header: (currentPage: number, pageCount: number) => {
        if (currentPage === 1) {
          return {
            text: `Ref. ${ref}  ·  Pág. ${currentPage}/${pageCount}`,
            fontSize: 7.5, color: MUTED, alignment: 'right',
            margin: [0, 16, 40, 0],
          };
        }
        return {
          columns: [
            LOGO_B64
              ? { image: LOGO_B64, height: 22, fit: [100, 22], margin: [40, 10, 0, 0] }
              : { text: empNombre, bold: true, fontSize: 9, color: DARK, margin: [40, 14, 0, 0] },
            {
              text: `Ref. ${ref}  ·  Pág. ${currentPage}/${pageCount}`,
              fontSize: 7.5, color: MUTED, alignment: 'right',
              margin: [0, 16, 40, 0],
            },
          ],
        };
      },
      // ── Footer en cada página ──────────────────────────────────────────────
      footer: () => ({
        stack: [
          { canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: BORDER }] },
          {
            text: footerLine1Items.join('  ·  '),
            fontSize: 7.5, color: MUTED, alignment: 'center',
            margin: [40, 6, 40, 2],
          },
          {
            text: `Documento generado el ${fechaDoc}  ·  Cotización válida sujeta a disponibilidad`,
            fontSize: 7, color: BORDER, alignment: 'center',
            margin: [40, 0, 40, 0],
          },
        ],
      }),
    };

    return new Promise<Buffer>((resolve, reject) => {
      const doc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];
      doc.on('data', (c: Buffer) => chunks.push(c));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      doc.end();
    });
  }
}
