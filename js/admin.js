/* ===================================================
   ESTYMATOR · Admin Panel · js/admin.js
   =================================================== */

(function () {
  const STORAGE_KEY = 'estymator_admin_data';
  const PASS_KEY = 'estymator_admin_pass';
  const SESSION_KEY = 'estymator_admin_session';

  /* ── DATA STRUCTURE ───────────────────────────────
     {
       posts: [{ id, title, excerpt, content, category, date, tags, image, files }],
       settings: { siteTitle, siteDesc }
     }
     files: [{ name, type, size, data (base64) }]
  ─────────────────────────────────────────────────── */

  function getData() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { posts: [], settings: {} }; }
    catch (e) { return { posts: [], settings: {} }; }
  }
  function saveData(data) { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

  let currentPage = 'dashboard';
  let editingPostId = null;
  let currentTags = [];
  let currentFiles = [];
  let currentImage = null;

  /* ── AUTH ────────────────────────────────────────── */
  function getStoredPass() { return localStorage.getItem(PASS_KEY); }
  function setStoredPass(pw) { localStorage.setItem(PASS_KEY, pw); }
  function getSession() { return localStorage.getItem(SESSION_KEY); }
  function setSession(v) { if (v) localStorage.setItem(SESSION_KEY, v); else localStorage.removeItem(SESSION_KEY); }

  window.tryLogin = function () {
    const input = document.getElementById('loginPass');
    const msg = document.getElementById('loginMsg');
    const pw = input.value.trim();
    if (!pw) { msg.textContent = 'Wpisz hasło'; msg.className = 'login-msg err'; return; }

    let stored = getStoredPass();
    if (!stored) {
      setStoredPass(pw);
      setSession('1');
      showDashboard();
      return;
    }

    if (pw === stored) {
      setSession('1');
      msg.textContent = '✓ Zalogowano'; msg.className = 'login-msg ok';
      setTimeout(showDashboard, 300);
    } else {
      msg.textContent = '✗ Nieprawidłowe hasło'; msg.className = 'login-msg err';
    }
  };

  function showDashboard() {
    document.body.classList.add('dash-loaded');
    renderPage('dashboard');
  }

  window.logout = function () {
    setSession(null);
    document.body.classList.remove('dash-loaded');
    document.getElementById('loginPass').value = '';
    document.getElementById('loginMsg').textContent = '';
    document.getElementById('loginMsg').className = 'login-msg';
  };

  // Enter key on login
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !document.body.classList.contains('dash-loaded')) {
      tryLogin();
    }
  });

  // Check session on load
  if (getSession()) {
    if (getStoredPass()) showDashboard();
    else { setSession(null); }
  }

  /* ── PAGE SWITCHER ──────────────────────────────── */
  window.switchPage = function (page, postId) {
    currentPage = page;
    if (page === 'edit-post' && postId) editingPostId = postId;
    else editingPostId = null;
    renderPage(page);
    document.querySelectorAll('.sb-link').forEach(b => {
      b.classList.toggle('active', b.dataset.page === (page === 'edit-post' ? 'posts' : page));
    });
  };

  /* ── TOAST ──────────────────────────────────────── */
  function showToast(msg, type) {
    type = type || '';
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 3000);
  }

  /* ── RENDER ENGINE ──────────────────────────────── */
  function renderPage(page) {
    const c = document.getElementById('pageContent');
    if (!c) return;
    switch (page) {
      case 'dashboard': c.innerHTML = renderDashboard(); break;
      case 'posts': c.innerHTML = renderPostList(); break;
      case 'new-post': c.innerHTML = renderPostEditor(); break;
      case 'edit-post': c.innerHTML = renderPostEditor(editingPostId); break;
      default: c.innerHTML = renderDashboard();
    }
    attachEvents();
  }

  /* ── DASHBOARD ──────────────────────────────────── */
  function renderDashboard() {
    const data = getData();
    const posts = data.posts || [];
    const categories = {};
    posts.forEach(function (p) { var k = p.category || 'other'; categories[k] = (categories[k] || 0) + 1; });

    var h = '<h2>Panel główny</h2><p class="sub">Przegląd aktywności na stronie</p>';
    h += '<div class="stats-grid">';
    h += '<div class="stat-box"><div class="stat-num c">' + posts.length + '</div><div class="stat-lab">Wszystkich postów</div></div>';
    h += '<div class="stat-box"><div class="stat-num g">' + (categories['news'] || 0) + '</div><div class="stat-lab">Aktualności</div></div>';
    h += '<div class="stat-box"><div class="stat-num r">' + (categories['event'] || 0) + '</div><div class="stat-lab">Wydarzenia</div></div>';
    h += '<div class="stat-box"><div class="stat-num t">' + (categories['research'] || 0) + '</div><div class="stat-lab">Badania</div></div>';
    h += '</div>';

    // Recent posts
    h += '<div class="panel-card"><h3>Ostatnie posty</h3>';
    if (posts.length === 0) {
      h += '<div class="empty"><p>Brak postów. Kliknij "Nowy post" aby dodać pierwszy.</p></div>';
    } else {
      var recent = posts.slice().sort(function (a, b) { return b.id - a.id; }).slice(0, 5);
      h += '<div class="post-list">';
      recent.forEach(function (p) {
        h += '<div class="post-row">';
        h += '<div class="pr-date"><strong>' + p.date.split('-')[2] + '</strong>' + p.date.split('-')[1] + '.' + p.date.split('-')[0] + '</div>';
        h += '<div><div class="pr-title">' + esc(p.title) + '</div></div>';
        h += '<div><span class="pr-cat ' + (p.category || 'news') + '">' + (p.category || 'news') + '</span></div>';
        h += '<div class="pr-actions"><button onclick="switchPage(\'edit-post\',' + p.id + ')">Edytuj</button><button class="danger" onclick="deletePost(' + p.id + ')">Usuń</button></div>';
        h += '</div>';
      });
      h += '</div>';
    }
    h += '</div>';
    return h;
  }

  /* ── POST LIST ──────────────────────────────────── */
  function renderPostList() {
    const data = getData();
    const posts = (data.posts || []).slice().sort(function (a, b) { return b.id - a.id; });

    var h = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:1.5rem">';
    h += '<div><h2 style="margin-bottom:.3rem">Wszystkie posty</h2><p class="sub" style="margin-bottom:0">' + posts.length + ' postów</p></div>';
    h += '<button class="tb-btn primary" onclick="switchPage(\'new-post\')" style="font-size:.7rem;padding:.6rem 1.2rem">+ Nowy post</button>';
    h += '</div>';

    if (posts.length === 0) {
      h += '<div class="panel-card"><div class="empty"><svg viewBox="0 0 24 24" fill="none"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg><p>Jeszcze nie ma żadnych postów</p></div></div>';
    } else {
      h += '<div class="post-list">';
      posts.forEach(function (p) {
        h += '<div class="post-row">';
        h += '<div class="pr-date"><strong>' + p.date.split('-')[2] + '</strong>' + p.date.split('-')[1] + '.' + p.date.split('-')[0] + '</div>';
        h += '<div><div class="pr-title">' + esc(p.title) + '</div><div style="font-size:.62rem;color:rgba(235,235,233,.3);margin-top:.2rem">' + (p.excerpt ? esc(p.excerpt).substring(0, 80) : '') + '</div></div>';
        h += '<div><span class="pr-cat ' + (p.category || 'news') + '">' + (p.category || 'news') + '</span></div>';
        h += '<div class="pr-actions"><button onclick="switchPage(\'edit-post\',' + p.id + ')">Edytuj</button><button class="danger" onclick="deletePost(' + p.id + ')">Usuń</button></div>';
        h += '</div>';
      });
      h += '</div>';
    }
    return h;
  }

  /* ── POST EDITOR ────────────────────────────────── */
  function renderPostEditor(postId) {
    var data = getData(), p = null;
    if (postId) {
      p = (data.posts || []).find(function (x) { return x.id === postId; });
      if (!p) return '<p>Post nie znaleziony.</p>';
    }

    var isEdit = !!p;
    var h = '<h2>' + (isEdit ? 'Edytuj post' : 'Nowy post') + '</h2>';
    h += '<p class="sub">' + (isEdit ? 'ID: ' + p.id : 'Wypełnij formularz aby dodać post na stronę') + '</p>';

    // Reset state
    currentTags = p ? (p.tags || []).slice() : [];
    currentFiles = p ? (p.files || []).slice() : [];
    currentImage = p ? p.image || null : null;
    editingPostId = isEdit ? p.id : null;

    h += '<div class="panel-card">';
    h += '<div class="form-group"><label>Tytuł</label><input type="text" id="efTitle" value="' + escAttr(p ? p.title : '') + '" placeholder="Tytuł posta"></div>';
    h += '<div class="form-group"><label>Krótki opis (excerpt)</label><textarea id="efExcerpt" rows="2" placeholder="Krótkie streszczenie widoczne na liście postów">' + esc(p ? p.excerpt || '' : '') + '</textarea></div>';
    h += '<div class="form-group"><label>Treść (HTML)</label><textarea id="efContent" rows="12" placeholder="Pełna treść posta. Możesz używać HTML: <p>, <strong>, <em>, <a href=''>, <ul>, <li> itp.">' + esc(p ? p.content || '' : '') + '</textarea></div>';

    h += '<div class="form-row">';
    h += '<div class="form-group"><label>Kategoria</label><select id="efCategory">';
    ['news','event','research','workshop','other'].forEach(function (cat) {
      h += '<option value="' + cat + '"' + (p && p.category === cat ? ' selected' : '') + '>' + cat + '</option>';
    });
    h += '</select></div>';
    h += '<div class="form-group"><label>Data</label><input type="date" id="efDate" value="' + (p ? p.date : today()) + '"></div>';
    h += '</div>';

    // Tags
    h += '<div class="form-group"><label>Tagi</label>';
    h += '<div style="display:flex;gap:.5rem"><input type="text" id="efTagInput" placeholder="Dodaj tag i naciśnij Enter" style="flex:1"><button class="tb-btn ghost" onclick="addTag()" style="font-size:.6rem;padding:.5rem .8rem">+</button></div>';
    h += '<div class="tags-wrap" id="efTags">';
    currentTags.forEach(function (t) { h += '<span class="tag-item">' + esc(t) + '<button onclick="removeTag(\'' + escAttr(t) + '\')">×</button></span>'; });
    h += '</div>';
    h += '</div>';

    // Image
    h += '<div class="form-group"><label>Obrazek wyróżniający</label>';
    if (currentImage) {
      h += '<div style="margin-bottom:.5rem"><img src="' + currentImage + '" style="max-width:200px;max-height:150px;border:1px solid rgba(222,192,173,.2)"></div>';
      h += '<button class="tb-btn ghost" onclick="removeImage()" style="font-size:.6rem;padding:.4rem .8rem">Usuń obrazek</button>';
    }
    h += '<div class="upload-zone" id="imageDropZone" style="padding:1.5rem"><p>Upuść obrazek tutaj lub <strong>kliknij</strong></p></div>';
    h += '<input type="file" id="efImageFile" accept="image/*" style="display:none">';
    h += '</div>';

    // Files
    h += '<div class="form-group"><label>Załączniki (PDF, pliki)</label>';
    h += '<div class="file-list" id="efFileList">';
    currentFiles.forEach(function (f, i) {
      h += '<div class="file-item"><span class="fi-name">' + esc(f.name) + '</span><span class="fi-size">' + fmtSize(f.size) + '</span><button onclick="removeFile(' + i + ')">×</button></div>';
    });
    h += '</div>';
    h += '<div class="upload-zone" id="fileDropZone" style="padding:1.5rem"><p>Upuść pliki tutaj lub <strong>kliknij</strong></p></div>';
    h += '<input type="file" id="efFilesInput" multiple style="display:none">';
    h += '</div>';

    h += '<div style="display:flex;gap:.8rem;margin-top:1.5rem">';
    h += '<button class="tb-btn primary" onclick="savePost()" style="font-size:.7rem;padding:.7rem 1.5rem">' + (isEdit ? 'Zapisz zmiany' : 'Opublikuj post') + '</button>';
    h += '<button class="tb-btn ghost" onclick="switchPage(\'posts\')" style="font-size:.7rem;padding:.7rem 1.5rem">Anuluj</button>';
    h += '</div>';

    h += '</div>'; // panel-card
    return h;
  }

  /* ── POST CRUD ──────────────────────────────────── */
  window.savePost = function () {
    var title = val('efTitle');
    if (!title) { showToast('Tytuł jest wymagany', 'error'); return; }

    var data = getData();
    var posts = data.posts || [];
    var post = {
      id: editingPostId || Date.now(),
      title: title,
      excerpt: val('efExcerpt'),
      content: val('efContent'),
      category: val('efCategory') || 'news',
      date: val('efDate') || today(),
      tags: currentTags,
      image: currentImage || '',
      files: currentFiles
    };

    if (editingPostId) {
      var idx = posts.findIndex(function (x) { return x.id === editingPostId; });
      if (idx >= 0) posts[idx] = post;
      else posts.push(post);
    } else {
      posts.push(post);
    }

    data.posts = posts;
    saveData(data);
    showToast(editingPostId ? '✓ Post zaktualizowany' : '✓ Post opublikowany!', 'success');
    switchPage('posts');
  };

  window.deletePost = function (id) {
    if (!confirm('Na pewno usunąć ten post?')) return;
    var data = getData();
    data.posts = (data.posts || []).filter(function (x) { return x.id !== id; });
    saveData(data);
    showToast('Post usunięty', 'success');
    renderPage('posts');
  };

  /* ── TAGS ───────────────────────────────────────── */
  window.addTag = function () {
    var inp = document.getElementById('efTagInput');
    if (!inp) return;
    var tag = inp.value.trim();
    if (tag && currentTags.indexOf(tag) === -1) { currentTags.push(tag); }
    inp.value = '';
    refreshTagsDisplay();
  };
  window.removeTag = function (tag) {
    currentTags = currentTags.filter(function (t) { return t !== tag; });
    refreshTagsDisplay();
  };
  function refreshTagsDisplay() {
    var wrap = document.getElementById('efTags');
    if (!wrap) return;
    wrap.innerHTML = '';
    currentTags.forEach(function (t) {
      var s = document.createElement('span'); s.className = 'tag-item';
      s.innerHTML = esc(t) + '<button>×</button>';
      s.querySelector('button').onclick = function () { removeTag(t); };
      wrap.appendChild(s);
    });
  }

  /* ── FILE UPLOAD ────────────────────────────────── */
  window.removeFile = function (idx) {
    currentFiles.splice(idx, 1);
    refreshFileList();
  };
  window.removeImage = function () {
    currentImage = null;
    renderPage(editingPostId ? 'edit-post' : 'new-post');
  };
  function refreshFileList() {
    var list = document.getElementById('efFileList');
    if (!list) return;
    list.innerHTML = '';
    currentFiles.forEach(function (f, i) {
      var d = document.createElement('div'); d.className = 'file-item';
      d.innerHTML = '<span class="fi-name">' + esc(f.name) + '</span><span class="fi-size">' + fmtSize(f.size) + '</span><button>×</button>';
      d.querySelector('button').onclick = function () { removeFile(i); };
      list.appendChild(d);
    });
  }
  function handleFileSelect(files) {
    for (var i = 0; i < files.length; i++) {
      (function (file) {
        var reader = new FileReader();
        reader.onload = function () {
          currentFiles.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: reader.result
          });
          refreshFileList();
        };
        reader.readAsDataURL(file);
      })(files[i]);
    }
  }
  function handleImageSelect(file) {
    var reader = new FileReader();
    reader.onload = function () {
      currentImage = reader.result;
      renderPage(editingPostId ? 'edit-post' : 'new-post');
    };
    reader.readAsDataURL(file);
  }

  /* ── EVENT ATTACHMENT ───────────────────────────── */
  function attachEvents() {
    // Tag input enter
    var ti = document.getElementById('efTagInput');
    if (ti) ti.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); addTag(); } });

    // Image drop zone
    var idz = document.getElementById('imageDropZone');
    var ifi = document.getElementById('efImageFile');
    if (idz && ifi) {
      idz.onclick = function () { ifi.click(); };
      ifi.onchange = function () { if (ifi.files[0]) handleImageSelect(ifi.files[0]); };
      idz.ondragover = function (e) { e.preventDefault(); idz.classList.add('dragover'); };
      idz.ondragleave = function () { idz.classList.remove('dragover'); };
      idz.ondrop = function (e) { e.preventDefault(); idz.classList.remove('dragover'); if (e.dataTransfer.files[0]) handleImageSelect(e.dataTransfer.files[0]); };
    }

    // File drop zone
    var fdz = document.getElementById('fileDropZone');
    var efi = document.getElementById('efFilesInput');
    if (fdz && efi) {
      fdz.onclick = function () { efi.click(); };
      efi.onchange = function () { handleFileSelect(efi.files); };
      fdz.ondragover = function (e) { e.preventDefault(); fdz.classList.add('dragover'); };
      fdz.ondragleave = function () { fdz.classList.remove('dragover'); };
      fdz.ondrop = function (e) { e.preventDefault(); fdz.classList.remove('dragover'); handleFileSelect(e.dataTransfer.files); };
    }
  }

  /* ── IMPORT / EXPORT ────────────────────────────── */
  window.exportData = function () {
    var data = getData();
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a'); a.href = url; a.download = 'estymator-backup-' + today() + '.json';
    a.click(); URL.revokeObjectURL(url);
    showToast('✓ Dane wyeksportowane', 'success');
  };

  window.importData = function () {
    var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json';
    inp.onchange = function () {
      var file = inp.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function () {
        try {
          var imported = JSON.parse(reader.result);
          if (!imported.posts) throw new Error('Invalid format');
          var current = getData();
          if (confirm('Zaimportować ' + imported.posts.length + ' postów? Istniejące dane zostaną zastąpione.')) {
            saveData(imported);
            showToast('✓ Zaimportowano ' + imported.posts.length + ' postów', 'success');
            renderPage(currentPage);
          }
        } catch (e) { showToast('✗ Błędny format pliku', 'error'); }
      };
      reader.readAsText(file);
    };
    inp.click();
  };

  /* ── HELPERS ────────────────────────────────────── */
  function esc(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escAttr(s) { if (!s) return ''; return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function val(id) { var el = document.getElementById(id); return el ? el.value : ''; }
  function today() { var d = new Date(); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtSize(b) { if (b < 1024) return b + ' B'; if (b < 1048576) return (b / 1024).toFixed(1) + ' KB'; return (b / 1048576).toFixed(1) + ' MB'; }

})();
