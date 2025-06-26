  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

  window.addEventListener('DOMContentLoaded', () => {
    const inputPdf = document.getElementById('pdf-input');
    const btnDownload = document.getElementById('btn-download');

    let originalPdfDoc = null;
    let pdfLib = null;

    inputPdf.addEventListener('change', async () => {
      if (inputPdf.files.length === 0) return;

      const file = inputPdf.files[0];
      const arrayBuffer = await file.arrayBuffer();

      originalPdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      pdfLib = await PDFLib.PDFDocument.create();

      btnDownload.disabled = false;
    });

    btnDownload.addEventListener('click', async () => {
      const totalPages = originalPdfDoc.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const page = await originalPdfDoc.getPage(i);

        // Reduz a escala para diminuir qualidade visual e peso
        const viewport = page.getViewport({ scale: 0.90 });

        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;

        const context = canvas.getContext('2d');
        await page.render({ canvasContext: context, viewport }).promise;

        // Diminui a qualidade da imagem para reduzir o tamanho final
        const imgData = canvas.toDataURL('image/jpeg', 0.90); // 0.5 = qualidade reduzida

        const embeddedImage = await pdfLib.embedJpg(imgData);
        const pageWidth = embeddedImage.width;
        const pageHeight = embeddedImage.height;
        const pdfPage = pdfLib.addPage([pageWidth, pageHeight]);

        pdfPage.drawImage(embeddedImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight
        });
      }

      const pdfBytes = await pdfLib.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = 'pdf_comprimido.pdf';
      a.click();
      URL.revokeObjectURL(url);
    });
  });
