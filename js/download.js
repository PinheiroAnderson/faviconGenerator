const ZipDownloader = {
  async createZip(files) {
    const zip = new JSZip();
    for (const file of files) {
      if (file.dataUrl) {
        const base64 = file.dataUrl.split(',')[1];
        zip.file(file.name, base64, { base64: true });
      } else if (file.blob) {
        zip.file(file.name, file.blob);
      } else if (file.content) {
        zip.file(file.name, file.content);
      }
    }
    return zip.generateAsync({ type: 'blob' });
  },

  async downloadZip(files, fileName) {
    const blob = await this.createZip(files);
    saveAs(blob, fileName);
  },

  async downloadBlob(blob, fileName) {
    saveAs(blob, fileName);
  },

  async downloadDataUrl(dataUrl, fileName) {
    const base64 = dataUrl.split(',')[1];
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const mime = dataUrl.match(/data:([^;]+);/)?.[1] || 'application/octet-stream';
    const blob = new Blob([bytes], { type: mime });
    saveAs(blob, fileName);
  }
};
