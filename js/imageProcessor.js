const IconGenerator = {
  image: null,
  zoom: 1,
  posX: 0,
  posY: 0,
  bgColor: '#ffffff',
  bgType: 'white',
  previewCanvas: null,
  previewCtx: null,

  sizes: {
    web: [16, 32, 48, 96, 180, 192, 512],
    windows: [16, 24, 32, 48, 64, 128, 150, 256],
    android: [36, 48, 72, 96, 144, 192, 512],
    ios: [57, 60, 72, 76, 114, 120, 144, 152, 167, 180],
    linux: [32, 48, 64, 96, 128, 256, 512]
  },

  get sizeNames() {
    return {
      web: ['favicon-16x16', 'favicon-32x32', 'favicon-48x48', 'favicon-96x96', 'apple-touch-icon', 'android-chrome-192x192', 'android-chrome-512x512'],
      windows: ['windows-16', 'windows-24', 'windows-32', 'windows-48', 'windows-64', 'windows-128', 'windows-256'],
      android: ['android-36', 'android-48', 'android-72', 'android-96', 'android-144', 'android-192', 'android-512'],
      ios: ['ios-57', 'ios-60', 'ios-72', 'ios-76', 'ios-114', 'ios-120', 'ios-144', 'ios-152', 'ios-167', 'ios-180'],
      linux: ['linux-32', 'linux-48', 'linux-64', 'linux-96', 'linux-128', 'linux-256', 'linux-512']
    };
  },

  init() {
    this.previewCanvas = document.getElementById('previewCanvas');
    this.previewCtx = this.previewCanvas.getContext('2d');
  },

  async loadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          this.image = img;
          resolve(img);
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  updatePreview() {
    if (!this.image) return;
    const canvas = this.previewCanvas;
    const ctx = this.previewCtx;
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    if (this.bgType === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
    } else if (this.bgType === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, w, h);
    } else if (this.bgType === 'blue') {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, w, h);
    } else if (this.bgType === 'custom') {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, w, h);
    }

    const scale = this.zoom;
    const drawW = Math.min(w, this.image.width * scale);
    const drawH = Math.min(h, this.image.height * scale);

    const offsetX = (w - drawW) / 2 + (this.posX / 100) * w * 0.25;
    const offsetY = (h - drawH) / 2 + (this.posY / 100) * h * 0.25;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.image, offsetX, offsetY, drawW, drawH);
  },

  renderCanvas(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    if (this.bgType === 'white') {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
    } else if (this.bgType === 'black') {
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, size, size);
    } else if (this.bgType === 'blue') {
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(0, 0, size, size);
    } else if (this.bgType === 'custom') {
      ctx.fillStyle = this.bgColor;
      ctx.fillRect(0, 0, size, size);
    }

    const scale = this.zoom;
    const drawW = Math.min(size, this.image.width * scale);
    const drawH = Math.min(size, this.image.height * scale);

    const offsetX = (size - drawW) / 2 + (this.posX / 100) * size * 0.25;
    const offsetY = (size - drawH) / 2 + (this.posY / 100) * size * 0.25;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.image, offsetX, offsetY, drawW, drawH);

    return canvas;
  },

  generateBlob(size) {
    const canvas = this.renderCanvas(size);
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/png');
    });
  },

  toDataURL(size) {
    const canvas = this.renderCanvas(size);
    return canvas.toDataURL('image/png');
  },

  getManifest() {
    const webSizes = this.sizes.web;
    return JSON.stringify({
      name: "Meu Projeto",
      short_name: "Projeto",
      icons: [
        {
          src: "android-chrome-192x192.png",
          sizes: "192x192",
          type: "image/png"
        },
        {
          src: "android-chrome-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ],
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone"
    }, null, 2);
  },

  getBrowserConfig() {
    return '<?xml version="1.0" encoding="utf-8"?>\n<browserconfig>\n <msapplication>\n   <tile>\n      <square150x150logo src="mstile-150x150.png"/>\n   </tile>\n </msapplication>\n</browserconfig>';
  },

  getHtmlTags() {
    return `<link rel="icon" href="favicon.ico">
<link rel="icon" sizes="32x32" href="favicon-32x32.png">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="manifest" href="manifest.webmanifest">`;
  },

  getDisplayName(size, category) {
    const map = {
      web: {
        16: 'favicon-16x16',
        32: 'favicon-32x32',
        48: 'favicon-48x48',
        96: 'favicon-96x96',
        180: 'apple-touch-icon',
        192: 'android-chrome-192x192',
        512: 'android-chrome-512x512'
      },
      windows: {
        16: 'windows-16',
        24: 'windows-24',
        32: 'windows-32',
        48: 'windows-48',
        64: 'windows-64',
        128: 'windows-128',
        256: 'windows-256'
      },
      android: {
        36: 'android-36',
        48: 'android-48',
        72: 'android-72',
        96: 'android-96',
        144: 'android-144',
        192: 'android-192',
        512: 'android-512'
      },
      ios: {
        57: 'ios-57',
        60: 'ios-60',
        72: 'ios-72',
        76: 'ios-76',
        114: 'ios-114',
        120: 'ios-120',
        144: 'ios-144',
        152: 'ios-152',
        167: 'ios-167',
        180: 'ios-180'
      },
      linux: {
        32: 'linux-32',
        48: 'linux-48',
        64: 'linux-64',
        96: 'linux-96',
        128: 'linux-128',
        256: 'linux-256',
        512: 'linux-512'
      }
    };
    return map[category]?.[size] || `${category}-${size}x${size}`;
  }
};
