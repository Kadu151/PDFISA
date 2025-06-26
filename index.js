const themes = ['theme-purple', 'theme-green', 'theme-gray'];
let currentThemeIndex = 0;

// Ao carregar a página, tenta aplicar o tema salvo
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme && themes.includes(savedTheme)) {
    currentThemeIndex = themes.indexOf(savedTheme);
    document.body.classList.add(themes[currentThemeIndex]);
  } else {
    // Se não tiver tema salvo, aplica o primeiro
    document.body.classList.add(themes[currentThemeIndex]);
  }
});

const btn = document.getElementById('theme-switcher');

btn.addEventListener('click', () => {
  // Remove tema atual
  document.body.classList.remove(themes[currentThemeIndex]);
  // Próximo tema
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  // Aplica próximo tema
  document.body.classList.add(themes[currentThemeIndex]);
  // Salva no localStorage
  localStorage.setItem('theme', themes[currentThemeIndex]);
});
