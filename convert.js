const fileInput = document.getElementById('file-input');
const textOutput = document.getElementById('text-output');
const btnCopy = document.getElementById('btn-copy');
const loading = document.getElementById('loading');
const themeSwitcher = document.getElementById('theme-switcher');

pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js';

// Função para aplicar tema no body
function applyTheme(theme) {
  if (theme === 'dark') {
    document.body.classList.add('theme-purple'); // Ajuste conforme seu tema escuro
  } else {
    document.body.classList.remove('theme-purple');
  }
}

// No carregamento, aplica o tema salvo
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme') || 'light';
  applyTheme(savedTheme);

  // Listener para o botão de mudar tema
  if (themeSwitcher) {
    themeSwitcher.addEventListener('click', () => {
      const currentTheme = localStorage.getItem('theme') || 'light';
      const newTheme = currentTheme === 'light' ? 'dark' : 'light';
      localStorage.setItem('theme', newTheme);
      applyTheme(newTheme);
    });
  }
});

btnCopy.addEventListener('click', () => {
  navigator.clipboard.writeText(textOutput.value).then(() => {
    alert('Texto copiado para a área de transferência!');
  });
});

fileInput.addEventListener('change', async () => {
  if (fileInput.files.length === 0) return;
  btnCopy.disabled = true;
  textOutput.value = '';
  loading.textContent = 'Processando arquivo, aguarde...';

  const file = fileInput.files[0];
  if (file.type === 'application/pdf') {
    // Extrair texto via PDF.js para PDF
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map(item => item.str).join(' ');
        fullText += `Página ${i}:\n${pageText}\n\n`;
      }

      textOutput.value = fullText || 'Nenhum texto encontrado no PDF.';
      btnCopy.disabled = false;
      loading.textContent = '';
    } catch (err) {
      loading.textContent = 'Erro ao processar o PDF.';
      console.error(err);
    }
  } else if (file.type.startsWith('image/')) {
    // OCR para imagem com Tesseract.js
    try {
      loading.textContent = 'Extraindo texto da imagem...';
      const { data: { text } } = await Tesseract.recognize(file, 'por', {
        logger: m => {
          if (m.status === 'recognizing text') {
            loading.textContent = `Extraindo texto: ${Math.round(m.progress * 100)}%`;
          }
        }
      });

      textOutput.value = text.trim() || 'Nenhum texto detectado na imagem.';
      btnCopy.disabled = false;
      loading.textContent = '';
    } catch (err) {
      loading.textContent = 'Erro ao processar a imagem.';
      console.error(err);
    }
  } else {
    loading.textContent = 'Tipo de arquivo não suportado. Selecione PDF ou imagem.';
  }
});
