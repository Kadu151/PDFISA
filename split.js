const inputPdf = document.getElementById('pdf-input');
const inputAdditionalPdf = document.getElementById('pdf-additional-input');
const pagesContainer = document.getElementById('pages-container');
const btnDownload = document.getElementById('btn-download');

let pdfDocs = [];  // Array de objetos: { pdfLibDoc, pdfJsDoc } para cada PDF carregado
let allPages = []; // Cada item: { docIndex, pageIndex, element, canvas }

// Configura worker do pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

// Carrega o PDF principal (input único)
inputPdf.addEventListener('change', async () => {
  if (inputPdf.files.length === 0) return;

  // Limpa estado atual
  pagesContainer.innerHTML = '';
  allPages = [];
  pdfDocs = [];

  // Carrega apenas o primeiro arquivo
  await carregarPdf(inputPdf.files[0], 0);

  btnDownload.disabled = allPages.length === 0;
});

// Função para carregar um arquivo PDF
async function carregarPdf(file, docIndex) {
  const arrayBuffer = await file.arrayBuffer();

  const pdfLibDoc = await PDFLib.PDFDocument.load(arrayBuffer);
  const uint8Array = new Uint8Array(arrayBuffer);
  const pdfJsDoc = await pdfjsLib.getDocument({ data: uint8Array }).promise;

  pdfDocs[docIndex] = { pdfLibDoc, pdfJsDoc };

  const totalPages = pdfLibDoc.getPageCount();

  for (let i = 0; i < totalPages; i++) {
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.borderRadius = '8px';
    canvas.style.cursor = 'pointer';
    canvas.title = `Página ${i + 1}`;

    await renderPage(pdfJsDoc, i + 1, canvas);

    const pageCard = createPageCard(canvas, i + 1, docIndex);
    pageCard.querySelector('.btn-delete').addEventListener('click', e => {
      e.stopPropagation();
      excluirPagina(docIndex, i);
    });

    pagesContainer.appendChild(pageCard);

    allPages.push({
      docIndex,
      pageIndex: i,
      element: pageCard,
      canvas,
    });
  }
}

// Renderiza página PDF em canvas
async function renderPage(pdfJsDoc, pageNum, canvas) {
  const page = await pdfJsDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale: 0.3 });
  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const ctx = canvas.getContext('2d');
  await page.render({ canvasContext: ctx, viewport }).promise;
}

// Cria o card visual para a página com botão de exclusão
function createPageCard(canvas, pageNumber, docIndex) {
  const div = document.createElement('div');
  div.className = 'page-card';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn-delete';
  deleteBtn.title = 'Excluir página';
  deleteBtn.innerHTML = '&times;';
  div.appendChild(deleteBtn);

  const pageNumDiv = document.createElement('div');
  pageNumDiv.className = 'page-number';
  pageNumDiv.textContent = `Página ${pageNumber} (doc ${docIndex + 1})`;
  div.appendChild(pageNumDiv);

  div.appendChild(canvas);

  return div;
}

// Exclui página da visualização e do array allPages
function excluirPagina(docIndex, pageIndex) {
  const idx = allPages.findIndex(p => p.docIndex === docIndex && p.pageIndex === pageIndex);
  if (idx === -1) return;

  allPages[idx].element.remove();
  allPages.splice(idx, 1);

  btnDownload.disabled = allPages.length === 0;
}

// Ao clicar em baixar PDF
btnDownload.addEventListener('click', async () => {
  if (allPages.length === 0) {
    alert('Nenhuma página para baixar.');
    return;
  }

  const novoPdf = await PDFLib.PDFDocument.create();

  // Agrupa páginas por documento para copiar eficientemente
  const gruposPorDoc = {};
  for (const pagina of allPages) {
    if (!gruposPorDoc[pagina.docIndex]) {
      gruposPorDoc[pagina.docIndex] = {
        docRef: pdfDocs[pagina.docIndex].pdfLibDoc,
        paginas: []
      };
    }
    gruposPorDoc[pagina.docIndex].paginas.push(pagina.pageIndex);
  }

  // Copia e adiciona páginas ao novo PDF
  for (const key in gruposPorDoc) {
    const grupo = gruposPorDoc[key];
    const copias = await novoPdf.copyPages(grupo.docRef, grupo.paginas);
    copias.forEach(p => novoPdf.addPage(p));
  }

  const pdfBytes = await novoPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf_modificado.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
});

// Input para adicionar PDFs extras (múltiplos)
inputAdditionalPdf.addEventListener('change', async () => {
  if (inputAdditionalPdf.files.length === 0) return;

  const files = Array.from(inputAdditionalPdf.files);
  const nextDocIndex = pdfDocs.length;

  for (let i = 0; i < files.length; i++) {
    await carregarPdf(files[i], nextDocIndex + i);
  }

  inputAdditionalPdf.value = ''; // limpa input para futuros uploads
});
