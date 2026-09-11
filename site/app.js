const download = document.querySelector('#download');
const note = document.querySelector('#note');

fetch(download.href, { method: 'HEAD' }).then((response) => {
  if (!response.ok) return;
  download.classList.remove('disabled');
  download.removeAttribute('aria-disabled');
  download.textContent = 'DOWNLOAD ANDROID APK';
  note.textContent = 'Version 1.0.0 is ready to install.';
}).catch(() => {});

download.addEventListener('click', (event) => {
  if (download.classList.contains('disabled')) event.preventDefault();
});