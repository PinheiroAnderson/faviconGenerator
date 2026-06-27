const IcoConverter = {
  async createIco(sizes) {
    const images = [];
    for (const size of sizes) {
      const dataUrl = IconGenerator.toDataURL(size);
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      images.push({ size, data: bytes });
    }

    const count = images.length;
    const entrySize = 16;
    const dirSize = 6;
    const headerSize = dirSize + count * entrySize;
    let offset = headerSize;

    const buffer = new ArrayBuffer(headerSize);
    const view = new DataView(buffer);

    view.setUint16(0, 0, true);
    view.setUint16(2, 1, true);
    view.setUint16(4, count, true);

    const dataArrays = [];
    for (let i = 0; i < count; i++) {
      const img = images[i];
      const size = img.size;
      view.setUint8(6 + i * 16 + 0, size > 255 ? 0 : size);
      view.setUint8(6 + i * 16 + 1, size > 255 ? 0 : size);
      view.setUint8(6 + i * 16 + 2, 0);
      view.setUint8(6 + i * 16 + 3, 0);
      view.setUint16(6 + i * 16 + 4, 1, true);
      view.setUint16(6 + i * 16 + 6, 32, true);
      view.setUint32(6 + i * 16 + 8, img.data.byteLength, true);
      view.setUint32(6 + i * 16 + 12, offset, true);
      offset += img.data.byteLength;
      dataArrays.push(img.data);
    }

    const totalSize = offset;
    const finalBuffer = new ArrayBuffer(totalSize);
    const finalView = new Uint8Array(finalBuffer);
    finalView.set(new Uint8Array(buffer), 0);

    let dataOffset = headerSize;
    for (const arr of dataArrays) {
      finalView.set(arr, dataOffset);
      dataOffset += arr.byteLength;
    }

    return new Blob([finalView], { type: 'image/x-icon' });
  }
};
