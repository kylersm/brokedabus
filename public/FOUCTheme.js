const theme = localStorage.getItem("theme") ?? 'A';
if(theme === 'D' || (theme === 'A' && window.matchMedia("(prefers-color-scheme: dark)").matches))
  document.documentElement.classList.add("dark");