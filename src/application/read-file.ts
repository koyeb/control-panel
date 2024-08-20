export function readFile(file: File) {
  return new Promise<{ file: File; content: string }>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve({ file, content: reader.result });
      }
    };

    reader.onerror = reject;

    reader.readAsText(file);
  });
}
