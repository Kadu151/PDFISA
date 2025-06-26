document.addEventListener("DOMContentLoaded", () => {
  const inputFiles = document.getElementById("pdf-files");
  const fileListDiv = document.getElementById("file-list");
  const mergeForm = document.getElementById("merge-form");
  const nomeInput = document.getElementById("nome-pdf");

  let selectedFiles = [];

  inputFiles.addEventListener("change", (event) => {
    selectedFiles = Array.from(event.target.files);
    mostrarListaArquivos();
  });

  function mostrarListaArquivos() {
    fileListDiv.innerHTML = "";

    if (selectedFiles.length === 0) {
      fileListDiv.innerHTML = "<p>Nenhum arquivo selecionado.</p>";
      return;
    }

    const ul = document.createElement("ul");
    ul.id = "sortable-list";

    selectedFiles.forEach((file, index) => {
      const li = document.createElement("li");
      li.textContent = `${file.name}`;
      li.setAttribute("data-index", index);
      li.classList.add("sortable-item");
      ul.appendChild(li);
    });

    fileListDiv.appendChild(ul);

    // Inicializa o Sortable.js
    Sortable.create(ul, {
      animation: 150,
      ghostClass: "sortable-ghost",
    });
  }

  mergeForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (selectedFiles.length < 2) {
      alert("Selecione pelo menos dois arquivos PDF.");
      return;
    }

    const nomeArquivo = nomeInput.value.trim() || "novo_arquivo.pdf";

    try {
      const mergedPdf = await PDFLib.PDFDocument.create();

      // Captura a nova ordem dos arquivos com base no DOM
      const sortedList = document.querySelectorAll("#sortable-list li");
      const sortedFiles = Array.from(sortedList).map((li) => {
        const index = parseInt(li.getAttribute("data-index"));
        return selectedFiles[index];
      });

      for (const file of sortedFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFLib.PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const pdfBytes = await mergedPdf.save();
      baixarPDF(pdfBytes, nomeArquivo);

    } catch (error) {
      console.error("Erro ao juntar os PDFs:", error);
      alert("Ocorreu um erro ao juntar os arquivos.");
    }
  });

  function baixarPDF(pdfBytes, nomeArquivo) {
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
    URL.revokeObjectURL(link.href);
  }
});
