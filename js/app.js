const App = {
  loadedFile: null,
  generatedFiles: [],
  toastTimer: null,

  init() {
    IconGenerator.init();
    this.bindUpload();
    this.bindControls();
    this.bindGenerate();
    this.bindPlatforms();
  },

  bindUpload() {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const btnChoose = document.getElementById('btnChooseFile');

    btnChoose.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.click();
    });

    dropZone.addEventListener('click', (e) => {
      if (e.target !== btnChoose && !btnChoose.contains(e.target)) {
        fileInput.click();
      }
    });

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        this.handleFile(files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        this.handleFile(e.target.files[0]);
      }
    });
  },

bindControls() {
     const zoom = document.getElementById('zoom');
     const posX = document.getElementById('posX');
     const posY = document.getElementById('posY');
     const zoomVal = document.getElementById('zoomVal');
     const posXVal = document.getElementById('posXVal');
     const posYVal = document.getElementById('posYVal');

     zoom.addEventListener('input', () => {
       IconGenerator.zoom = parseFloat(zoom.value);
       zoomVal.textContent = IconGenerator.zoom.toFixed(2) + 'x';
       IconGenerator.updatePreview();
     });

     posX.addEventListener('input', () => {
       IconGenerator.posX = parseInt(posX.value, 10);
       posXVal.textContent = IconGenerator.posX;
       IconGenerator.updatePreview();
     });

     posY.addEventListener('input', () => {
       IconGenerator.posY = parseInt(posY.value, 10);
       posYVal.textContent = IconGenerator.posY;
       IconGenerator.updatePreview();
     });

     document.querySelectorAll('.bg-btn').forEach(btn => {
       btn.addEventListener('click', () => {
         document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
         btn.classList.add('active');
         const bg = btn.dataset.bg;
         IconGenerator.bgType = bg;

         if (bg === 'custom') {
           IconGenerator.bgColor = document.getElementById('bgColor').value;
           document.getElementById('bgColor').click();
         } else if (bg === 'white') {
           IconGenerator.bgColor = '#ffffff';
         } else if (bg === 'black') {
           IconGenerator.bgColor = '#000000';
         } else if (bg === 'blue') {
           IconGenerator.bgColor = '#3b82f6';
         } else if (bg === 'transparent') {
           IconGenerator.bgColor = 'transparent';
         }
         this.updateCanvasBg();
         IconGenerator.updatePreview();
       });
     });

     document.getElementById('bgColor').addEventListener('input', (e) => {
       IconGenerator.bgColor = e.target.value;
       IconGenerator.bgType = 'custom';
       this.updateCanvasBg();
       IconGenerator.updatePreview();
     });
   },

   updateCanvasBg() {
     const canvasBg = document.getElementById('canvasBg');
     const bgBtn = document.querySelector('.bg-btn.active');
     if (canvasBg && bgBtn) {
       const bg = bgBtn.dataset.bg;
       if (bg === 'transparent') {
         canvasBg.style.background = 'none';
       } else if (bg === 'custom') {
         canvasBg.style.background = IconGenerator.bgColor;
       } else {
         canvasBg.style.background = IconGenerator.bgColor;
       }
     }
   },

   bindPlatforms() {
    const checkboxes = ['chkWeb', 'chkWindows', 'chkAndroid', 'chkiOS', 'chkLinux'];
    checkboxes.forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        const anyChecked = checkboxes.some(cid => document.getElementById(cid).checked);
        document.getElementById('btnGenerate').disabled = !anyChecked;
      });
    });
  },

  bindGenerate() {
    document.getElementById('btnGenerate').addEventListener('click', async () => {
      await this.generate();
    });
  },

  async handleFile(file) {
    if (!file.type.match(/^image\/(png|jpeg|webp|svg\+xml|jpg)$/)) {
      this.showToast('Formato não suportado. Use PNG, JPG ou WEBP.', false);
      return;
    }

try {
       await IconGenerator.loadImage(file);
       this.loadedFile = file;
       document.getElementById('uploadCard').style.display = 'none';
       document.getElementById('previewCard').style.display = 'block';
       document.getElementById('platformsCard').style.display = 'block';
       document.getElementById('resultsCard').style.display = 'none';
       this.updateCanvasBg();
       IconGenerator.updatePreview();
     } catch (err) {
      this.showToast('Erro ao carregar imagem.', false);
      console.error(err);
    }
  },

  async generate() {
    if (!IconGenerator.image) return;

    const btn = document.getElementById('btnGenerate');
    btn.classList.add('loading');
    btn.disabled = true;

    try {
      await this.delay(50);
      const files = [];
      const hasWeb = document.getElementById('chkWeb').checked;
      const hasWindows = document.getElementById('chkWindows').checked;
      const hasAndroid = document.getElementById('chkAndroid').checked;
      const hasIOS = document.getElementById('chkiOS').checked;
      const hasLinux = document.getElementById('chkLinux').checked;

      const categories = [];
      if (hasWeb) categories.push('web');
      if (hasWindows) categories.push('windows');
      if (hasAndroid) categories.push('android');
      if (hasIOS) categories.push('ios');
      if (hasLinux) categories.push('linux');

      for (const category of categories) {
        const sizes = IconGenerator.sizes[category];
        for (const size of sizes) {
          const name = IconGenerator.getDisplayName(size, category) + '.png';
          const dataUrl = IconGenerator.toDataURL(size);
          files.push({ name, dataUrl, size, category });
        }
      }

      if (hasWeb) {
        const icoBlob = await IcoConverter.createIco([16, 32, 48]);
        const icoBase64 = await this.blobToBase64(icoBlob);
        files.push({ name: 'favicon.ico', dataUrl: 'data:image/x-icon;base64,' + icoBase64, size: 'ico', category: 'web' });
      }

      if (hasWeb) {
        files.push({ name: 'manifest.webmanifest', content: IconGenerator.getManifest(), size: '', category: 'web' });
      }

      if (hasWindows) {
        files.push({ name: 'browserconfig.xml', content: IconGenerator.getBrowserConfig(), size: '', category: 'windows' });
      }

      this.generatedFiles = files;
      this.showResults(files);
      await ZipDownloader.downloadZip(files, 'icons.zip');
      this.showToast('Sucesso! icons.zip baixado com ' + files.length + ' arquivos.', true);
    } catch (err) {
      this.showToast('Erro ao gerar ícones.', false);
      console.error(err);
    } finally {
      btn.classList.remove('loading');
      btn.disabled = false;
    }
  },

  showResults(files) {
    const resultsCard = document.getElementById('resultsCard');
    const resultsGrid = document.getElementById('resultsGrid');
    resultsCard.style.display = 'block';

    const iconFiles = files.filter(f => f.size !== '' && f.category !== '');
    const configFiles = files.filter(f => f.size === '' || f.category === '');

    resultsGrid.innerHTML = iconFiles.map(f => `
      <div class="result-item">
        <span class="result-icon">📄</span>
        <div class="result-info">
          <div class="result-name">${f.name}</div>
          <div class="result-size">${typeof f.size === 'number' ? f.size + 'x' + f.size : 'ICO'} • ${f.category}</div>
        </div>
        <button class="result-dl" data-name="${f.name}" data-dataurl="${f.dataUrl}">↓ Baixar</button>
      </div>
    `).join('');

    resultsGrid.querySelectorAll('.result-dl').forEach(btn => {
      btn.addEventListener('click', () => {
        ZipDownloader.downloadDataUrl(btn.dataset.dataurl, btn.dataset.name);
      });
    });
  },

  copyManifest() {
    navigator.clipboard.writeText(IconGenerator.getManifest()).then(() => {
      this.showToast('manifest.webmanifest copiado!', true);
    });
  },

  copyBrowserConfig() {
    navigator.clipboard.writeText(IconGenerator.getBrowserConfig()).then(() => {
      this.showToast('browserconfig.xml copiado!', true);
    });
  },

  copyHtmlTags() {
    navigator.clipboard.writeText(IconGenerator.getHtmlTags()).then(() => {
      this.showToast('HTML Tags copiadas!', true);
    });
  },

  showToast(msg, success) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.className = 'toast ' + (success ? 'success' : '') + ' visible';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.className = 'toast';
    }, 3000);
  },

  delay(ms) {
    return new Promise(r => setTimeout(r, ms));
  },

  blobToBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
};
