const input = document.getElementById('pdf-files');
const fileListDiv = document.getElementById('file-list');
let arquivosSelecionados = []; // Guarda arquivos na ordem atual

// Inicializa Sortable apenas uma vez
let sortableInstance = Sortable.create(fileListDiv, {
  animation: 150,
  onEnd: (evt) => {
    const item = arquivosSelecionados.splice(evt.oldIndex, 1)[0];
    arquivosSelecionados.splice(evt.newIndex, 0, item);
    atualizarListaArquivos(false); // Atualiza sem recriar Sortable
  },
});

input.addEventListener('change', () => {
  const novosArquivos = Array.from(input.files);

  novosArquivos.forEach((novoArquivo) => {
    const existe = arquivosSelecionados.some(
      (arquivo) =>
        arquivo.name === novoArquivo.name &&
        arquivo.size === novoArquivo.size &&
        arquivo.lastModified === novoArquivo.lastModified
    );
    if (!existe) {
      arquivosSelecionados.push(novoArquivo);
    }
  });

  atualizarListaArquivos();

  // Resetar input para permitir reenvio dos mesmos arquivos
  input.value = '';
});

function atualizarListaArquivos(recriarSortable = true) {
  fileListDiv.innerHTML = '';

  arquivosSelecionados.forEach((file, index) => {
    const div = document.createElement('div');
    div.className = 'file-item';
    div.dataset.index = index;

    const nomeSpan = document.createElement('span');
    nomeSpan.textContent = file.name;
    div.appendChild(nomeSpan);

    const btnRemover = document.createElement('button');
    btnRemover.textContent = '×';
    btnRemover.className = 'btn-remover';
    btnRemover.title = 'Remover arquivo';
    btnRemover.addEventListener('click', () => {
      arquivosSelecionados.splice(index, 1);
      atualizarListaArquivos();
    });
    div.appendChild(btnRemover);

    fileListDiv.appendChild(div);
  });

  // Recria Sortable apenas se solicitado (default true)
  if (recriarSortable) {
    sortableInstance.destroy();
    sortableInstance = Sortable.create(fileListDiv, {
      animation: 150,
      onEnd: (evt) => {
        const item = arquivosSelecionados.splice(evt.oldIndex, 1)[0];
        arquivosSelecionados.splice(evt.newIndex, 0, item);
        atualizarListaArquivos(false);
      },
    });
  }
}

document.getElementById('merge-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const nomePdfInput = document.getElementById('nome-pdf');
  let novoNome = nomePdfInput.value.trim();

  if (arquivosSelecionados.length === 0) {
    alert('Selecione ao menos um arquivo PDF para juntar.');
    return;
  }

  if (!novoNome) {
    novoNome = 'arquivo_juntado.pdf';
  } else if (!novoNome.toLowerCase().endsWith('.pdf')) {
    novoNome += '.pdf';
  }

  try {
    const { PDFDocument } = PDFLib;
    const novoPdf = await PDFDocument.create();

    for (const file of arquivosSelecionados) {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await PDFDocument.load(arrayBuffer);
      const paginas = await novoPdf.copyPages(pdf, pdf.getPageIndices());
      paginas.forEach((pagina) => novoPdf.addPage(pagina));
    }

    const pdfBytes = await novoPdf.save();

    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = novoNome;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

  } catch (error) {
    alert('Erro ao juntar PDFs: ' + error.message);
    console.error(error);
  }
});
