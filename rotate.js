const inputPdf = document.getElementById('pdf-input');
const pagesContainer = document.getElementById('pages-container');
const btnDownload = document.getElementById('btn-download');

let pdfLibInstance = null;
let pdfjsInstance = null;
let pageRotations = []; // Guarda rotação de cada página em graus

// Configura o worker do pdf.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

inputPdf.addEventListener('change', async () => {
  if (inputPdf.files.length === 0) return;

  const file = inputPdf.files[0];
  const arrayBuffer = await file.arrayBuffer();

  // Carrega PDF nas duas bibliotecas
  pdfLibInstance = await PDFLib.PDFDocument.load(arrayBuffer);
  pdfjsInstance = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;

  const totalPages = pdfLibInstance.getPageCount();

  // Limpa container e inicializa rotações
  pagesContainer.innerHTML = '';
  pageRotations = new Array(totalPages).fill(0);

  for (let i = 0; i < totalPages; i++) {
    const canvas = document.createElement('canvas');
    canvas.className = 'page-canvas';

    const page = await pdfjsInstance.getPage(i + 1);
    const viewport = page.getViewport({ scale: 0.35 });
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Container da página com número e controles
    const pageCard = document.createElement('div');
    pageCard.className = 'page-card';

    const pageNum = document.createElement('div');
    pageNum.className = 'page-number';
    pageNum.textContent = `Página ${i + 1}`;

    const controls = document.createElement('div');
    controls.className = 'rotate-controls';

    // Botão girar esquerda
    const rotateLeft = document.createElement('button');
    rotateLeft.className = 'btn-rotate rotate-left';
    rotateLeft.innerHTML = '<i class="fas fa-undo"></i>';
    rotateLeft.title = 'Girar 90° para esquerda';
    rotateLeft.onclick = () => {
      pageRotations[i] = (pageRotations[i] - 90 + 360) % 360;
      pageCard.style.transform = `rotate(${pageRotations[i]}deg)`;
    };

    // Botão girar direita
    const rotateRight = document.createElement('button');
    rotateRight.className = 'btn-rotate rotate-right';
    rotateRight.innerHTML = '<i class="fas fa-redo"></i>';
    rotateRight.title = 'Girar 90° para direita';
    rotateRight.onclick = () => {
      pageRotations[i] = (pageRotations[i] + 90) % 360;
      pageCard.style.transform = `rotate(${pageRotations[i]}deg)`;
    };

    controls.appendChild(rotateLeft);
    controls.appendChild(rotateRight);

    pageCard.appendChild(pageNum);
    pageCard.appendChild(canvas);
    pageCard.appendChild(controls);

    pagesContainer.appendChild(pageCard);
  }

  btnDownload.disabled = false;
});

btnDownload.addEventListener('click', async () => {
  const newPdf = await PDFLib.PDFDocument.create();

  for (let i = 0; i < pdfLibInstance.getPageCount(); i++) {
    const [copiedPage] = await newPdf.copyPages(pdfLibInstance, [i]);
    copiedPage.setRotation(degrees(pageRotations[i]));
    newPdf.addPage(copiedPage);
  }

  const pdfBytes = await newPdf.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'pdf_rotacionado.pdf';
  a.click();
  URL.revokeObjectURL(url);
});

// Função para converter ângulo em objeto PDFLib.degrees
function degrees(angle) {
  switch (angle) {
    case 90: return PDFLib.degrees(90);
    case 180: return PDFLib.degrees(180);
    case 270: return PDFLib.degrees(270);
    default: return PDFLib.degrees(0);
  }
}
