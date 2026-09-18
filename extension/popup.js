document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://humanlensai.vercel.app' });
});
