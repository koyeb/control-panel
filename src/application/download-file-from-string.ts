export function downloadFileFromString(filename: string, content: string) {
  const url = window.URL.createObjectURL(new Blob([content]));
  const a = document.createElement('a');

  a.style.display = 'none';
  a.href = url;
  a.download = filename;

  document.body.appendChild(a);
  a.click();

  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
