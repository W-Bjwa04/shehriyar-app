export async function exportElementToPdf(element, fileName = 'report.pdf') {
  if (!element) throw new Error('No element provided for PDF export');

  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#FFFFFF',
    scrollY: -window.scrollY,
    logging: false,
  });

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 8;

  const renderWidth = pageWidth - margin * 2;
  const renderHeight = (canvas.height * renderWidth) / canvas.width;
  const usablePageHeight = pageHeight - margin * 2;

  // Single-page export
  if (renderHeight <= usablePageHeight) {
    const imageData = canvas.toDataURL('image/png');
    pdf.addImage(imageData, 'PNG', margin, margin, renderWidth, renderHeight, undefined, 'FAST');
    pdf.save(fileName);
    return;
  }

  // Multi-page export by slicing the full canvas into page-height segments.
  const pageCanvasHeight = Math.floor((canvas.width * usablePageHeight) / renderWidth);
  const pageCanvas = document.createElement('canvas');
  pageCanvas.width = canvas.width;
  pageCanvas.height = pageCanvasHeight;
  const pageCtx = pageCanvas.getContext('2d');
  if (!pageCtx) throw new Error('Failed to prepare PDF page canvas context');

  let sourceY = 0;
  let pageIndex = 0;
  while (sourceY < canvas.height) {
    const remaining = canvas.height - sourceY;
    const sliceHeight = Math.min(pageCanvasHeight, remaining);

    pageCanvas.height = sliceHeight;
    pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);
    pageCtx.drawImage(
      canvas,
      0,
      sourceY,
      canvas.width,
      sliceHeight,
      0,
      0,
      pageCanvas.width,
      sliceHeight
    );

    const pageImage = pageCanvas.toDataURL('image/png');
    const sliceRenderHeight = (sliceHeight * renderWidth) / canvas.width;

    if (pageIndex > 0) pdf.addPage();
    pdf.addImage(pageImage, 'PNG', margin, margin, renderWidth, sliceRenderHeight, undefined, 'FAST');

    sourceY += sliceHeight;
    pageIndex += 1;
  }

  pdf.save(fileName);
}
