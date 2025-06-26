document.addEventListener("DOMContentLoaded", () => {
  const inputPdf = document.getElementById("pdf-input");
  const pagesContainer = document.getElementById("pages-container");
  const btnDownload = document.getElementById("btn-download");

  let originalPdfDoc = null;
  let pagesToRemove = new Set();

  inputPdf.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const arrayBuffer = await file.arrayBuffer();
    originalPdfDoc = await PDFLib.PDFDocument.load(arrayBuffer);

    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;

    pagesContainer.innerHTML = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 0.35 });

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;

      const context = canvas.getContext("2d");
      await page.render({ canvasContext: context, viewport }).promise;

      const pageWrapper = document.createElement("div");
      pageWrapper.classList.add("page-thumb");
      pageWrapper.setAttribute("data-page-index", i - 1);

      const label = document.createElement("span");
      label.className = "page-number";
      label.textContent = `Página ${i}`;

      const deleteBtn = document.createElement("button");
      deleteBtn.className = "delete-btn";
      deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
      deleteBtn.title = "Excluir esta página";

      deleteBtn.addEventListener("click", () => {
        const index = parseInt(pageWrapper.getAttribute("data-page-index"));
        const isSelected = pageWrapper.classList.toggle("marked");

        if (isSelected) {
          pagesToRemove.add(index);
        } else {
          pagesToRemove.delete(index);
        }
      });

      pageWrapper.appendChild(label);
      pageWrapper.appendChild(canvas);
      pageWrapper.appendChild(deleteBtn);
      pagesContainer.appendChild(pageWrapper);
    }

    btnDownload.disabled = false;
  });

  btnDownload.addEventListener("click", async () => {
    if (!originalPdfDoc) return;

    const newPdfDoc = await PDFLib.PDFDocument.create();
    const totalPages = originalPdfDoc.getPageCount();

    for (let i = 0; i < totalPages; i++) {
      if (!pagesToRemove.has(i)) {
        const [copiedPage] = await newPdfDoc.copyPages(originalPdfDoc, [i]);
        newPdfDoc.addPage(copiedPage);
      }
    }

    const newPdfBytes = await newPdfDoc.save();
    const blob = new Blob([newPdfBytes], { type: "application/pdf" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "pdf_modificado.pdf";
    link.click();
    URL.revokeObjectURL(link.href);
  });
});
