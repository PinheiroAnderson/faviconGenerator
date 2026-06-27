const IconGenerator = {
  image: null,
  originalFile: null,
  zoom: 1,
  posX: 0,
  posY: 0,
  bgColor: '#ffffff',
  bgType: 'white',
  previewCanvas: null,
  previewCtx: null,
  cropRect: null,
  autoCrop: false,

  sizes: {
    web: [16, 24, 32, 48, 64, 128, 256],
    windows: [16, 24, 32, 48, 64, 128, 150, 256],
    android: [36, 48, 72, 96, 144, 192, 512],
    ios: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180],
    linux: [32, 48, 64, 96, 128, 256, 512]
  },

  get sizeNames() {
    return {
      web: ['favicon-16x16','favicon-32x32','favicon-48x48','favicon-64x64','favicon-128x128','favicon-256x256','apple-touch-icon','android-chrome-192x192','android-chrome-512x512'],
      windows: ['windows-16','windows-24','windows-32','windows-48','windows-64','windows-128','windows-256'],
      android: ['android-36','android-48','android-72','android-96','android-144','android-192','android-512'],
      ios: ['ios-57','ios-60','ios-72','ios-76','ios-114','ios-120','ios-144','ios-152','ios-167','ios-180'],
      linux: ['linux-32','linux-48','linux-64','linux-96','linux-128','linux-256','linux-512']
    };
  },

  init() {
    this.previewCanvas = document.getElementById('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d', { alpha: true });
    document.getElementById('chkAutoCrop').addEventListener('change', (e) => {
      this.autoCrop = e.target.checked;
      if (this.autoCrop && this.image) this.detectCrop();
      this.updatePreview();
    });
  },

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.image = img;
          this.originalFile = file;
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  getImageInfo(file) {
    const sizeStr = (file.size / 1024).toFixed(1) + ' KB';
    const fmtMap = { 'image/png': 'PNG', 'image/jpeg': 'JPG', 'image/webp': 'WEBP', 'image/svg+xml': 'SVG' };
    const fmt = fmtMap[file.type] || file.type.split('/')[1]?.toUpperCase() || 'DESCONHECIDO';
    const res = this.image ? `${this.image.naturalWidth} x ${this.image.naturalHeight}` : '-';
    const hasAlpha = this.hasTransparency();
    return { name: file.name, resolution: res, weight: sizeStr, format: fmt, transparent: hasAlpha ? 'Sim' : 'Não' };
  },

  hasTransparency() {
    if (!this.image) return false;
    if (this.originalFile && this.originalFile.type === 'image/png') {
      const c = document.createElement('canvas');
      c.width = Math.min(this.image.naturalWidth, 32);
      c.height = Math.min(this.image.naturalHeight, 32);
      const ctx = c.getContext('2d');
      ctx.drawImage(this.image, 0, 0, c.width, c.height);
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 255) return true;
      }
    }
    return false;
  },

  detectCrop() {
    if (!this.image) return;
    const c = document.createElement('canvas');
    const max = 64;
    const scale = Math.min(max / this.image.naturalWidth, max / this.image.naturalHeight, 1);
    c.width = Math.floor(this.image.naturalWidth * scale);
    c.height = Math.floor(this.image.naturalHeight * scale);
    const ctx = c.getContext('2d');
    ctx.drawImage(this.image, 0, 0, c.width, c.height);
    const data = ctx.getImageData(0, 0, c.width, c.height).data;
    let minX = c.width, minY = c.height, maxX = 0, maxY = 0;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < c.width; x++) {
        const idx = (y * c.width + x) * 4;
        if (data[idx + 3] > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (minX <= maxX && minY <= maxY) {
      this.cropRect = {
        x: minX / scale,
        y: minY / scale,
        w: (maxX - minX + 1) / scale,
        h: (maxY - minY + 1) / scale
      };
    } else {
      this.cropRect = { x: 0, y: 0, w: this.image.naturalWidth, h: this.image.naturalHeight };
    }
  },

  getDrawImage() {
    if (this.autoCrop && this.cropRect) {
      return {
        sx: this.cropRect.x,
        sy: this.cropRect.y,
        sw: this.cropRect.w,
        sh: this.cropRect.h,
        naturalW: this.cropRect.w,
        naturalH: this.cropRect.h
      };
    }
    return {
      sx: 0,
      sy: 0,
      sw: this.image.naturalWidth,
      sh: this.image.naturalHeight,
      naturalW: this.image.naturalWidth,
      naturalH: this.image.naturalHeight
    };
  },

  updatePreview() {
    if (!this.image) return;
    const canvas = this.previewCanvas;
    const ctx = this.previewCtx;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (this.bgType !== 'transparent') {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    const { naturalW: nw, naturalH: nh, sx, sy, sw, sh } = this.getDrawImage();
    const scale = this.zoom;
    const drawW = Math.min(w, nw * scale);
    const drawH = Math.min(h, nh * scale);

    const offsetX = (w - drawW) / 2 + (this.posX / 100) * w * 0.25;
    const offsetY = (h - drawH) / 2 + (this.posY / 100) * h * 0.25;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.image, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
  },

  renderCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: true });

    if (this.bgType !== 'transparent') {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    const { naturalW: nw, naturalH: nh, sx, sy, sw, sh } = this.getDrawImage();
    const scale = this.zoom;
    const drawW = Math.min(size, nw * scale) || 1;
    const drawH = Math.min(size, nh * scale) || 1;

    const offsetX = (size - drawW) / 2 + (this.posX / 100) * size * 0.25;
    const offsetY = (size - drawH) / 2 + (this.posY / 100) * size * 0.25;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.image, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
    return canvas;
  },

  async generateBlob(size) {
    const canvas = this.renderCanvas(size);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  async toDataURL(size) {
    const canvas = this.renderCanvas(size);
    return canvas.toDataURL('image/png');
  },

  getManifest() {
    const name = document.getElementById('projectName').value.trim() || 'Meu Projeto';
    const short = document.getElementById('projectShortName').value.trim() || 'Projeto';
    const theme = document.getElementById('themeColor').value;
    const bg = document.getElementById('bgColorProj').value;
    return JSON.stringify({
      name,
      short_name: short,
      icons: [
        { src: "android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "android-chrome-512x512.png", sizes: "512x512", type: "image/png" }
      ],
      theme_color: theme,
      background_color: bg,
      display: "standalone"
    }, null, 2);
  },

  getBrowserConfig() {
    const tile = document.getElementById('bgColorProj').value;
    const name = document.getElementById('projectName').value.trim() || 'Meu Projeto';
    return `<?xml version="1.0" encoding="utf-8"?>\n<browserconfig>\n  <msapplication>\n    <tile>\n      <square150x150logo src="mstile-150x150.png"/>\n      <TileColor>${tile}</TileColor>\n    </tile>\n  </msapplication>\n</browserconfig>`;
  },

  getHtmlTags() {
    return `<link rel="icon" href="favicon.ico">\n<link rel="icon" sizes="32x32" href="favicon-32x32.png">\n<link rel="apple-touch-icon" href="apple-touch-icon.png">\n<link rel="manifest" href="manifest.webmanifest">\n<meta name="theme-color" content="${document.getElementById('themeColor').value}">`;
  },

  getDisplayName(size, category) {
    const map = {
      web: { 16:'favicon-16x16', 32:'favicon-32x32', 48:'favicon-48x48', 64:'favicon-64x64', 128:'favicon-128x128', 256:'favicon-256x256', 180:'apple-touch-icon', 192:'android-chrome-192x192', 512:'android-chrome-512x512' },
      windows: { 16:'windows-16', 24:'windows-24', 32:'windows-32', 48:'windows-48', 64:'windows-64', 128:'windows-128', 150:'mstile-150x150', 256:'windows-256' },
      android: { 36:'android-36', 48:'android-48', 72:'android-72', 96:'android-96', 144:'android-144', 192:'android-192', 512:'android-512' },
      ios: { 57:'ios-57', 60:'ios-60', 72:'ios-72', 76:'ios-76', 114:'ios-114', 120:'ios-120', 144:'ios-144', 152:'ios-152', 167:'ios-167', 180:'ios-180' },
      linux: { 32:'linux-32', 48:'linux-48', 64:'linux-64', 96:'linux-96', 128:'linux-128', 256:'linux-256', 512:'linux-512' }
    };
    return map[category]?.[size] || `${category}-${size}x${size}`;
  }
};
