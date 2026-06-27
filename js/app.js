const App = {
  loadedFile: null,
  generatedFiles: [],
  generatedBlobs: [],
  toastTimer: null,

  init() {
    IconGenerator.init();
    this.bindUpload();
    this.bindControls();
    this.bindGenerate();
    this.bindPlatforms();
    this.bindConfig();
    this.bindResults();
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
      document.getElementById('dropText').textContent = 'Solte a imagem';
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      document.getElementById('dropText').textContent = 'Arraste uma imagem aqui';
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove('drag-over');
      document.getElementById('dropText').textContent = 'Arraste uma imagem aqui';
      const files = e.dataTransfer.files;
      if (files.length > 0) this.handleFile(files[0]);
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) this.handleFile(e.target.files[0]);
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
      this.renderSizesPreview();
    });

    posX.addEventListener('input', () => {
      IconGenerator.posX = parseInt(posX.value, 10);
      posXVal.textContent = IconGenerator.posX;
      IconGenerator.updatePreview();
      this.renderSizesPreview();
    });

    posY.addEventListener('input', () => {
      IconGenerator.posY = parseInt(posY.value, 10);
      posYVal.textContent = IconGenerator.posY;
      IconGenerator.updatePreview();
      this.renderSizesPreview();
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
        } else if (bg === 'white') IconGenerator.bgColor = '#ffffff';
        else if (bg === 'black') IconGenerator.bgColor = '#000000';
        else if (bg === 'blue') IconGenerator.bgColor = '#3b82f6';
        else if (bg === 'transparent') IconGenerator.bgColor = 'transparent';
        this.updateCanvasBg();
        IconGenerator.updatePreview();
        this.renderSizesPreview();
      });
    });

    document.getElementById('bgColor').addEventListener('input', (e) => {
      IconGenerator.bgColor = e.target.value;
      IconGenerator.bgType = 'custom';
      this.updateCanvasBg();
      IconGenerator.updatePreview();
      this.renderSizesPreview();
    });
  },

  updateCanvasBg() {
    const canvasBg = document.getElementById('canvasBg');
    const bgBtn = document.querySelector('.bg-btn.active');
    if (canvasBg && bgBtn) {
      const bg = bgBtn.dataset.bg;
      canvasBg.style.background = (bg === 'transparent') ? 'none' : IconGenerator.bgColor;
    }
  },

  bindPlatforms() {
    const checkboxes = ['chkWeb', 'chkWindows', 'chkAndroid', 'chkiOS', 'chkLinux'];
    checkboxes.forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        this.buildFileList();
        this.renderSizesPreview();
      });
    });
  },

  bindGenerate() {
    document.getElementById('btnGenerate').addEventListener('click', async () => {
      await this.generate();
    });
  },

  bindConfig() {
    ['themeColor', 'bgColorProj'].forEach(id => {
      document.getElementById(id).addEventListener('input', (e) => {
        document.getElementById(id + 'Val').textContent = e.target.value;
      });
    });
    document.getElementById('btnCopyHtml').addEventListener('click', () => {
      const ta = document.getElementById('htmlCode');
      ta.select();
      navigator.clipboard.writeText(ta.value).then(() => this.showToast('HTML copiado!', true));
    });

    document.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', async () => {
        const target = btn.dataset.target;
        let text = '';
        if (target === 'manifest') text = IconGenerator.getManifest();
        else if (target === 'browserconfig') text = IconGenerator.getBrowserConfig();
        else if (target === 'html') text = IconGenerator.getHtmlTags();
        navigator.clipboard.writeText(text).then(() => this.showToast('Copiado!', true));
      });
    });
  },

  bindResults() {
    document.getElementById('btnDownloadZip').addEventListener('click', () => {
      ZipDownloader.downloadZip(this.generatedFiles, 'icons.zip');
    });
    document.getElementById('btnRestart').addEventListener('click', () => {
      this.reset();
    });
  },

  async handleFile(file) {
    if (!file.type.match(/^image\/(png|jpeg|webp|svg\+xml|jpg)$/)) {
      this.showToast('Formato não suportado. Use PNG, JPG ou WEBP.', false);
      return;
    }
    const warn = document.getElementById('warnBanner');
    try {
      await IconGenerator.loadImage(file);
      this.loadedFile = file;

      const info = IconGenerator.getImageInfo(file);
      document.getElementById('infoName').textContent = info.name;
      document.getElementById('infoRes').textContent = info.resolution;
      document.getElementById('infoWeight').textContent = info.weight;
      document.getElementById('infoFmt').textContent = info.format;
      document.getElementById('infoTrans').textContent = info.transparent;

      let msgs = [];
      const minDim = Math.min(IconGenerator.image.naturalWidth, IconGenerator.image.naturalHeight);
      if (minDim < 512) {
        msgs.push('A imagem é menor que 512x512. A qualidade pode ficar reduzida nos ícones grandes.');
      }
      if (file.type !== 'image/png') {
        msgs.push('Formato não suporta transparência. Considere usar PNG para fundo transparente.');
      }
      const warn = document.getElementById('warnBanner');
      if (msgs.length) {
        warn.style.display = 'flex';
        warn.className = 'warn-banner warn';
        warn.innerHTML = '<i data-lucide="alert-triangle"></i> <span>' + msgs.join(' ') + '</span>';
        lucide.createIcons();
      } else {
        warn.style.display = 'none';
      }

      if (IconGenerator.hasTransparency() && document.getElementById('chkAutoCrop').checked) {
        IconGenerator.detectCrop();
      }

      document.getElementById('uploadCard').style.display = 'none';
      document.getElementById('infoCard').style.display = 'block';
      document.getElementById('previewCard').style.display = 'block';
      document.getElementById('platformsCard').style.display = 'block';
      document.getElementById('configCard').style.display = 'block';
      document.getElementById('htmlCard').style.display = 'block';
      document.getElementById('resultsCard').style.display = 'none';
      document.getElementById('successCard').style.display = 'none';
      document.getElementById('sizesCard').style.display = 'block';

      this.updateCanvasBg();
      IconGenerator.updatePreview();
      this.buildFileList();
      this.renderSizesPreview();
      this.updateHtmlCode();
    } catch (err) {
      this.showToast('Erro ao carregar imagem.', false);
      console.error(err);
    }
  },

  buildFileList() {
    const container = document.getElementById('fileList');
    const checks = {
      web: document.getElementById('chkWeb').checked,
      windows: document.getElementById('chkWindows').checked,
      android: document.getElementById('chkAndroid').checked,
      ios: document.getElementById('chkiOS').checked,
      linux: document.getElementById('chkLinux').checked
    };
    const items = [];
    for (const [cat, ok] of Object.entries(checks)) {
      if (!ok) continue;
      for (const s of IconGenerator.sizes[cat]) {
        items.push({ name: `${cat}/${IconGenerator.getDisplayName(s, cat)}.png`, category: cat });
      }
    }
    if (checks.web) {
      items.push({ name: 'web/favicon.ico', category: 'web' });
      items.push({ name: 'web/manifest.webmanifest', category: 'web' });
    }
    if (checks.windows) {
      items.push({ name: 'windows/browserconfig.xml', category: 'windows' });
    }
    container.innerHTML = items.map(it => `
      <div class="file-item"><i data-lucide="check"></i><span>${it.name}</span></div>
    `).join('');
    lucide.createIcons();
  },

  async generate() {
    if (!IconGenerator.image) return;
    const btn = document.getElementById('btnGenerate');
    btn.classList.add('loading');
    btn.disabled = true;

    const progressWrap = document.getElementById('progressWrap');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    progressWrap.style.display = 'block';
    progressFill.style.width = '0%';

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

      const totalSteps = categories.reduce((acc, cat) => acc + IconGenerator.sizes[cat].length, 0)
        + (hasWeb ? 2 : 0)
        + (hasWindows ? 1 : 0);
      let current = 0;

      const progressFor = (label) => {
        current++;
        const pct = Math.round((current / totalSteps) * 100);
        progressFill.style.width = pct + '%';
        progressText.textContent = `${label}... ${pct}%`;
      };

      for (const category of categories) {
        for (const size of IconGenerator.sizes[category]) {
          const name = IconGenerator.getDisplayName(size, category) + '.png';
          const blob = await IconGenerator.generateBlob(size);
          files.push({ name: `${category}/${name}`, blob, size, category });
          progressFor(name);
        }
      }

      if (hasWeb) {
        const icoBlob = await IcoConverter.createIco([16, 24, 32, 48, 64, 128, 256]);
        files.push({ name: 'web/favicon.ico', blob: icoBlob, size: 'ico', category: 'web' });
        progressFor('favicon.ico');
      }

      if (hasWeb) {
        files.push({ name: 'web/manifest.webmanifest', content: IconGenerator.getManifest(), size: '', category: 'web' });
        progressFor('manifest');
      }

      if (hasWindows) {
        files.push({ name: 'windows/browserconfig.xml', content: IconGenerator.getBrowserConfig(), size: '', category: 'windows' });
        progressFor('browserconfig');
      }

      this.generatedFiles = files;
      this.generatedBlobs = files;
      this.showResults(files);
      await ZipDownloader.downloadZip(files, 'icons.zip');

      progressFill.style.width = '100%';
      progressText.textContent = 'Concluído! 100%';

      const count = files.length;
      document.getElementById('successSub').textContent = `${count} arquivos criados em icons.zip`;
      document.getElementById('successCard').style.display = 'block';
      document.getElementById('resultsCard').style.display = 'block';
      document.getElementById('platformsCard').style.display = 'none';
      document.getElementById('previewCard').style.display = 'none';
      document.getElementById('configCard').style.display = 'none';
      document.getElementById('htmlCard').style.display = 'none';
      document.getElementById('uploadCard').style.display = 'none';
      document.getElementById('infoCard').style.display = 'none';

      lucide.createIcons();
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

    const iconFiles = files.filter(f => f.blob);
    resultsGrid.innerHTML = iconFiles.map(f => `
      <div class="result-item">
        <span class="result-icon"><i data-lucide="file-image"></i></span>
        <div class="result-info">
          <div class="result-name">${f.name}</div>
          <div class="result-size">${typeof f.size === 'number' ? f.size + 'x' + f.size : 'ICO'} • ${f.category}</div>
        </div>
        <button class="result-dl" data-name="${f.name}" data-idx="${files.indexOf(f)}">Baixar</button>
      </div>
    `).join('');
    lucide.createIcons();

    resultsGrid.querySelectorAll('.result-dl').forEach(btn => {
      btn.addEventListener('click', async () => {
        const f = this.generatedFiles[parseInt(btn.dataset.idx, 10)];
        if (f.blob) {
          const fileName = f.name.split('/').pop();
          saveAs(f.blob, fileName);
        } else if (f.dataUrl) {
          await ZipDownloader.downloadDataUrl(f.dataUrl, f.name);
        }
      });
    });

    this.updateHtmlCode();
  },

  updateHtmlCode() {
    document.getElementById('htmlCode').value = IconGenerator.getHtmlTags();
  },

  renderSizesPreview() {
    if (!IconGenerator.image) return;
    const tabs = document.getElementById('sizesTabs');
    const grid = document.getElementById('sizesGrid');
    const checks = {
      web: document.getElementById('chkWeb').checked,
      windows: document.getElementById('chkWindows').checked,
      android: document.getElementById('chkAndroid').checked,
      ios: document.getElementById('chkiOS').checked,
      linux: document.getElementById('chkLinux').checked
    };
    const activeCats = Object.entries(checks).filter(([,v]) => v).map(([k]) => k);
    if (!activeCats.length) { tabs.innerHTML = ''; grid.innerHTML = ''; return; }

    tabs.innerHTML = activeCats.map(c => `<button class="sizes-tab ${c===activeCats[0]?'active':''}" data-cat="${c}">${c.charAt(0).toUpperCase()+c.slice(1)}</button>`).join('');
    tabs.querySelectorAll('.sizes-tab').forEach(t => {
      t.addEventListener('click', () => {
        tabs.querySelectorAll('.sizes-tab').forEach(x => x.classList.remove('active'));
        t.classList.add('active');
        this.renderSizesGrid(t.dataset.cat);
      });
    });

    this.renderSizesGrid(activeCats[0]);
  },

  renderSizesGrid(category) {
    if (!IconGenerator.image) return;
    const grid = document.getElementById('sizesGrid');
    const sizes = IconGenerator.sizes[category] || [];
    grid.innerHTML = sizes.map(s => `
      <div class="size-chip">
        <div class="size-preview" id="sizePreview-${category}-${s}"></div>
        <span class="size-label">${s}x${s}</span>
      </div>
    `).join('');

    const previewSize = 64;
    sizes.forEach(s => {
      const id = `sizePreview-${category}-${s}`;
      const container = document.getElementById(id);
      if (!container) return;
      const c = document.createElement('canvas');
      const scale = Math.min(previewSize / s, 1);
      const dw = Math.max(1, Math.round(s * scale));
      c.width = dw;
      c.height = dw;
      c.style.imageRendering = 'pixelated';
      const ctx = c.getContext('2d');
      if (IconGenerator.bgType !== 'transparent') {
        ctx.fillStyle = IconGenerator.bgColor;
        ctx.fillRect(0, 0, dw, dw);
      }
      const { naturalW: nw, naturalH: nh, sx, sy, sw, sh } = IconGenerator.getDrawImage();
      const drawW = Math.min(dw, nw * IconGenerator.zoom * scale);
      const drawH = Math.min(dw, nh * IconGenerator.zoom * scale);
      const offsetX = (dw - drawW) / 2 + (IconGenerator.posX / 100) * dw * 0.25;
      const offsetY = (dw - drawH) / 2 + (IconGenerator.posY / 100) * dw * 0.25;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(IconGenerator.image, sx, sy, sw, sh, offsetX, offsetY, drawW, drawH);
      container.appendChild(c);
    });
  },

  reset() {
    document.getElementById('uploadCard').style.display = 'block';
    document.getElementById('previewCard').style.display = 'none';
    document.getElementById('platformsCard').style.display = 'none';
    document.getElementById('successCard').style.display = 'none';
    document.getElementById('resultsCard').style.display = 'none';
    document.getElementById('sizesCard').style.display = 'none';
    document.getElementById('infoCard').style.display = 'none';
    document.getElementById('configCard').style.display = 'none';
    document.getElementById('htmlCard').style.display = 'none';
    document.getElementById('progressWrap').style.display = 'none';
    IconGenerator.image = null;
    this.loadedFile = null;
    this.generatedFiles = [];
    document.getElementById('fileInput').value = '';
  },

  showToast(msg, success) {
    const toast = document.getElementById('toast');
    toast.innerHTML = (success ? '<i data-lucide="check"></i>' : '<i data-lucide="alert-circle"></i>') + ' ' + msg;
    toast.className = 'toast ' + (success ? 'success' : 'error') + ' visible';
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => { toast.className = 'toast'; }, 3500);
    lucide.createIcons();
  },

  delay(ms) { return new Promise(r => setTimeout(r, ms)); }
};
