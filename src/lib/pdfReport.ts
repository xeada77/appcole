import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BankAccount, BudgetPartida, AcademicYear } from './types';
import { CategoryWithTotal } from './queries';
import { formatCurrency, formatDate } from './utils';

export interface GeneratePdfParams {
  accounts: BankAccount[];
  partidas: BudgetPartida[];
  currentYear: AcademicYear;
  incomeWithTotals: CategoryWithTotal[];
  expensesWithTotals: CategoryWithTotal[];
}

export function generateClearVectorPdf({
  accounts,
  partidas,
  currentYear,
  incomeWithTotals,
  expensesWithTotals
}: GeneratePdfParams): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const usableWidth = pageWidth - margin * 2;

  // Header Helper
  const drawDocumentHeader = () => {
    // Top colored accent bar
    doc.setFillColor(37, 99, 235); // Blue-600
    doc.rect(margin, 10, usableWidth, 2, 'F');

    // Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // Slate-900
    doc.text('CADRO DE LIQUIDACIÓN ECONÓMICA ANUAL', margin, 18);

    // Subtitle
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // Slate-600
    doc.text('Consellería de Educación, Ciencia, Universidades e Formación Profesional - Xunta de Galicia', margin, 23);

    // Meta Badge
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    const yearText = currentYear.name.toUpperCase();
    const dateText = `Data: ${formatDate(new Date().toISOString().split('T')[0])}`;
    doc.text(`${yearText}  |  ${dateText}`, pageWidth - margin, 18, { align: 'right' });

    // Center indicator
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Centro de Educación Infantil e Primaria', pageWidth - margin, 23, { align: 'right' });

    // Thin separator
    doc.setDrawColor(226, 232, 240); // Slate-200
    doc.setLineWidth(0.4);
    doc.line(margin, 26, pageWidth - margin, 26);
  };

  drawDocumentHeader();

  // 1. Estado de Contas Bancarias e Conciliación
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. ESTADO DE CONTAS BANCARIAS E CONCILIACIÓN', margin, 32);

  const totInitial = accounts.reduce((s, a) => s + a.initial_balance, 0);
  const totCurrent = accounts.reduce((s, a) => s + (a.current_balance || 0), 0);
  const totReconciled = accounts.reduce((s, a) => s + (a.reconciled_balance || 0), 0);

  autoTable(doc, {
    startY: 34,
    margin: { left: margin, right: margin },
    head: [['Conta Bancaria', 'Código / IBAN', 'Saldo Inicial', 'Saldo Contable', 'Saldo Reconciliado', 'Estado Conciliación']],
    body: accounts.map(a => [
      a.name,
      a.account_number,
      formatCurrency(a.initial_balance),
      formatCurrency(a.current_balance || 0),
      formatCurrency(a.reconciled_balance || 0),
      (a.pending_movements_count || 0) === 0 ? '100% Conciliada' : `${a.pending_movements_count} pendentes`
    ]),
    foot: [[
      'TOTAIS CONSOLIDADOS: ',
      '-',
      formatCurrency(totInitial),
      formatCurrency(totCurrent),
      formatCurrency(totReconciled),
      '-'
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'right',
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 40 },
      1: { cellWidth: 46 },
      2: { halign: 'right', cellWidth: 24 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 26 },
      4: { halign: 'right', fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 26 },
      5: { halign: 'center', cellWidth: 24 }
    }
  });

  // 2. Liquidación das Partidas Orzamentarias
  let currentY = (doc as any).lastAutoTable.finalY + 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. LIQUIDACIÓN DO ORZAMENTO POR PARTIDAS', margin, currentY);

  const totBudget = partidas.reduce((s, p) => s + p.initial_budget, 0);
  const totAllocIncome = partidas.reduce((s, p) => s + (p.allocated_income || 0), 0);
  const totSpent = partidas.reduce((s, p) => s + (p.spent_amount || 0), 0);
  const totAvailable = partidas.reduce((s, p) => s + (p.available_balance || 0), 0);

  autoTable(doc, {
    startY: currentY + 2,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Partida Orzamentaria', 'Tipo', 'Dotación Inicial', 'Ingresos Imputados', 'Gastos Imputados', 'Remanente / Saldo']],
    body: partidas.map(p => [
      p.code,
      p.name,
      p.is_base === 1 ? 'Partida Básica' : 'Partida Anual',
      formatCurrency(p.initial_budget),
      `+${formatCurrency(p.allocated_income || 0)}`,
      `-${formatCurrency(p.spent_amount || 0)}`,
      formatCurrency(p.available_balance || 0)
    ]),
    foot: [[
      'TOTAIS:         ',
      '',
      '',
      formatCurrency(totBudget),
      `+${formatCurrency(totAllocIncome)}`,
      `-${formatCurrency(totSpent)}`,
      formatCurrency(totAvailable)
    ]],
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 8
    },
    columnStyles: {
      0: { halign: 'left', fontStyle: 'bold', cellWidth: 26 },
      1: { fontStyle: 'bold', cellWidth: 38 },
      2: { cellWidth: 26 },
      3: { halign: 'right', cellWidth: 23 },
      4: { halign: 'right', textColor: [4, 120, 87], fontStyle: 'bold', cellWidth: 24 },
      5: { halign: 'right', textColor: [185, 28, 28], fontStyle: 'bold', cellWidth: 24 },
      6: { halign: 'right', fontStyle: 'bold', cellWidth: 25 }
    }
  });

  // 3. Resumo por Categorías Oficiais (Ingresos e Gastos)
  currentY = (doc as any).lastAutoTable.finalY + 6;

  // Check if we have enough space on current page for Section 3 header
  if (currentY > pageHeight - 60) {
    doc.addPage();
    drawDocumentHeader();
    currentY = 32;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('3. RESUMO DE EXECUCIÓN POR CATEGORÍAS OFICIAIS', margin, currentY);

  // Table 3.A: Ingresos
  const totIncomeCats = incomeWithTotals.reduce((s, c) => s + c.totalAmount, 0);
  const incomeRows: any[] = [];
  incomeWithTotals.forEach(cat => {
    const isCatH = cat.code.toLowerCase() === 'h';
    incomeRows.push([
      cat.code,
      isCatH ? `${cat.name} (* Remanente inicial de partidas)` : cat.name,
      formatCurrency(cat.totalAmount)
    ]);
    // Active subcategories
    cat.subcategories?.filter(s => s.totalAmount > 0).forEach(sub => {
      incomeRows.push([
        `   ${sub.code}`,
        `     |- ${sub.name}`,
        formatCurrency(sub.totalAmount)
      ]);
    });
  });

  autoTable(doc, {
    startY: currentY + 2,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Categoría', 'Total Imputado']],
    body: incomeRows,
    foot: [['TOTAL:      ', '', formatCurrency(totIncomeCats)]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [6, 95, 70], // Emerald-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [236, 253, 245], // Emerald-50
      textColor: [6, 95, 70],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 138 },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    }
  });


  // Table 3.B: Gastos
  currentY = (doc as any).lastAutoTable.finalY + 5;
  if (currentY > pageHeight - 80) {
    doc.addPage();
    drawDocumentHeader();
    currentY = 32;
  }

  const totExpenseCats = expensesWithTotals.reduce((s, c) => s + c.totalAmount, 0);
  const expenseRows: any[] = [];
  expensesWithTotals.forEach(cat => {
    expenseRows.push([
      cat.code,
      cat.name,
      formatCurrency(cat.totalAmount)
    ]);
    // Active subcategories (excepto a categoría 14 que se desglosa no punto 4)
    if (cat.code !== '14') {
      cat.subcategories?.filter(s => s.totalAmount > 0).forEach(sub => {
        expenseRows.push([
          `   ${sub.code}`,
          `     |- ${sub.name}`,
          formatCurrency(sub.totalAmount)
        ]);
      });
    }
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Categoría Oficial de Gasto (1 - 14)', 'Total Executado']],
    body: expenseRows,
    foot: [['TOTAL:             ', '', formatCurrency(totExpenseCats)]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [159, 18, 57], // Rose-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [255, 241, 242], // Rose-50
      textColor: [159, 18, 57],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 138 },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    }
  });

  // 4. Desglose de Comedor Escolar (Categorías a.6 e 14)
  currentY = (doc as any).lastAutoTable.finalY + 7;
  if (currentY > pageHeight - 90) {
    doc.addPage();
    drawDocumentHeader();
    currentY = 32;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text('4. DESGLOSE DE EXECUCIÓN DE COMEDOR ESCOLAR (CATEGORÍAS a.6 E 14)', margin, currentY);

  // Buscar a.6 e 14
  const parentA = incomeWithTotals.find(c => c.code.toLowerCase() === 'a');
  const catA6 = parentA?.subcategories?.find(s => s.code.toLowerCase() === 'a.6');
  const cat14 = expensesWithTotals.find(c => c.code === '14');

  // Táboa 4.A: Ingresos Comedor a.6
  const a6Rows: any[] = [];
  catA6?.subcategories?.forEach(sub => {
    a6Rows.push([
      sub.code,
      sub.name,
      formatCurrency(sub.totalAmount)
    ]);
  });

  autoTable(doc, {
    startY: currentY + 2,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Ingresos Comedor Escolar (Categoría a.6)', 'Total Imputado']],
    body: a6Rows.length > 0 ? a6Rows : [['-', 'Sen movementos rexistrados en a.6', formatCurrency(0)]],
    foot: [['TOTAL INGRESOS (a.6):', '', formatCurrency(catA6?.totalAmount || 0)]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [180, 83, 9], // Amber-700
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [254, 243, 199], // Amber-100
      textColor: [146, 64, 14],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 138 },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Táboa 4.B: Gastos Comedor 14
  currentY = (doc as any).lastAutoTable.finalY + 5;
  if (currentY > pageHeight - 80) {
    doc.addPage();
    drawDocumentHeader();
    currentY = 32;
  }

  const exp14Rows: any[] = [];
  cat14?.subcategories?.forEach(sub => {
    if (sub.is_group === 1 && sub.subcategories && sub.subcategories.length > 0) {
      exp14Rows.push([
        sub.code,
        `${sub.name} (Subtotal)`,
        formatCurrency(sub.totalAmount)
      ]);
      sub.subcategories.forEach(subsub => {
        exp14Rows.push([
          `   ${subsub.code}`,
          `     |- ${subsub.name}`,
          formatCurrency(subsub.totalAmount)
        ]);
      });
    } else {
      exp14Rows.push([
        sub.code,
        sub.name,
        formatCurrency(sub.totalAmount)
      ]);
    }
  });

  autoTable(doc, {
    startY: currentY,
    margin: { left: margin, right: margin },
    head: [['Cód.', 'Gastos Comedor Escolar (Categoría 14)', 'Total Executado']],
    body: exp14Rows.length > 0 ? exp14Rows : [['-', 'Sen movementos rexistrados en 14', formatCurrency(0)]],
    foot: [['TOTAL GASTOS (14):', '', formatCurrency(cat14?.totalAmount || 0)]],
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.5,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2,
      font: 'helvetica'
    },
    headStyles: {
      fillColor: [159, 18, 57], // Rose-800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.5
    },
    footStyles: {
      fillColor: [255, 241, 242], // Rose-50
      textColor: [159, 18, 57],
      fontStyle: 'bold',
      halign: 'right',
      fontSize: 8
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'left', fontStyle: 'bold' },
      1: { cellWidth: 138 },
      2: { cellWidth: 32, halign: 'right', fontStyle: 'bold' }
    }
  });

  // Liña resumo de Saldo Neto Comedor
  currentY = (doc as any).lastAutoTable.finalY + 4;
  const netComedor = (catA6?.totalAmount || 0) - (cat14?.totalAmount || 0);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  doc.text(
    `* Saldo Neto Comedor Escolar (Ingresos a.6 - Gastos 14): ${formatCurrency(netComedor)}`,
    margin,
    currentY
  );

  // 5. Signatures Section
  currentY = currentY + 8;
  if (currentY > pageHeight - 35) {
    doc.addPage();
    drawDocumentHeader();
    currentY = 36;
  }

  doc.setDrawColor(203, 213, 225); // Slate-300
  doc.setLineWidth(0.3);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  currentY += 5;
  const colWidth = usableWidth / 2;

  // Left signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('O/A Secretario/a do Centro', margin + colWidth / 2, currentY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Asdo: Dirección / Secretaría', margin + colWidth / 2, currentY + 16, { align: 'center' });

  // Right signature
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 41, 59);
  doc.text('Visto e Prace: A Dirección', margin + colWidth + colWidth / 2, currentY, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Diligencia de aprobación no Consello Escolar', margin + colWidth + colWidth / 2, currentY + 16, { align: 'center' });

  // Add Page Numbers
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text(
      `AppCole - Xestión Económica Escolar | Páxina ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 6,
      { align: 'center' }
    );
  }

  const sanitizedYear = currentYear.name.replace(/\s+/g, '_');
  doc.save(`Cadro_Liquidacion_Economica_${sanitizedYear}.pdf`);
}
