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
    const blob = await (await fetch(dataUrl)).blob();
    saveAs(blob, fileName);
  }
};
