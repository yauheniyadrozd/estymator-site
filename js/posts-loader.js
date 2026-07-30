/* ===================================================
   ESTYMATOR · Posts Loader · js/posts-loader.js
   Wczytuje posty z localStorage i renderuje je na stronie
   =================================================== */

(function () {
  const STORAGE_KEY = 'estymator_admin_data';

  function getPosts() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      var data = JSON.parse(raw);
      return (data.posts || []).sort(function (a, b) { return b.id - a.id; });
    } catch (e) { return []; }
  }

  function esc(s) {
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function fmtDate(dateStr) {
    if (!dateStr) return '';
    var parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    var months = ['STY','LUT','MAR','KWI','MAJ','CZE','LIP','SIE','WRZ','PAŹ','LIS','GRU'];
    var m = parseInt(parts[1], 10) - 1;
    var d = parseInt(parts[2], 10);
    return d + ' ' + (months[m] || '') + ' ' + parts[0];
  }

  function renderPosts(container, limit, category) {
    if (!container) return;
    var posts = getPosts();

    // Filter by category if specified
    if (category) {
      posts = posts.filter(function (p) { return p.category === category; });
    }

    // Limit
    if (limit && limit > 0) {
      posts = posts.slice(0, limit);
    }

    if (posts.length === 0) {
      container.innerHTML = '';
      return;
    }

    var html = '';
    posts.forEach(function (p) {
      var catClass = p.category || 'news';
      var catLabel = { news: 'Aktualność', event: 'Wydarzenie', research: 'Badania', workshop: 'Warsztat', other: 'Inne' }[catClass] || catClass;

      html += '<div class="blog-card rv" onclick="toggleBlogPost(this)">';

      // Image
      if (p.image) {
        html += '<div class="blog-card-img"><img src="' + p.image + '" alt="" loading="lazy"></div>';
      }

      html += '<div class="blog-card-body">';
      html += '<div class="blog-card-meta">';
      html += '<span class="blog-card-cat ' + catClass + '">' + catLabel + '</span>';
      html += '<span class="blog-card-date">' + fmtDate(p.date) + '</span>';
      html += '</div>';
      html += '<h3 class="blog-card-title">' + esc(p.title) + '</h3>';

      if (p.excerpt) {
        html += '<p class="blog-card-excerpt">' + esc(p.excerpt) + '</p>';
      }

      // Tags
      if (p.tags && p.tags.length > 0) {
        html += '<div class="blog-card-tags">';
        p.tags.forEach(function (t) {
          html += '<span class="blog-tag">#' + esc(t) + '</span>';
        });
        html += '</div>';
      }

      // Expand/collapse indicator
      html += '<span class="blog-expand">Czytaj więcej →</span>';

      // Full content (hidden by default)
      html += '<div class="blog-card-full">';
      html += '<div class="blog-card-content">' + (p.content || '') + '</div>';

      // Files
      if (p.files && p.files.length > 0) {
        html += '<div class="blog-card-files">';
        html += '<h4>Załączniki</h4>';
        p.files.forEach(function (f) {
          var isImage = f.type && f.type.indexOf('image/') === 0;
          if (isImage) {
            html += '<div class="blog-file-image"><img src="' + f.data + '" alt="' + esc(f.name) + '" loading="lazy" style="max-width:100%;height:auto"></div>';
          } else {
            var icon = '📄';
            if (f.type && f.type.indexOf('pdf') >= 0) icon = '📕';
            else if (f.type && f.type.indexOf('zip') >= 0) icon = '📦';
            html += '<a href="' + f.data + '" download="' + esc(f.name) + '" class="blog-file-link">' + icon + ' ' + esc(f.name) + ' (' + fmtSize(f.size) + ')</a>';
          }
        });
        html += '</div>';
      }

      html += '</div>'; // blog-card-full
      html += '</div>'; // blog-card-body
      html += '</div>'; // blog-card
    });

    container.innerHTML = html;

    // Observe new rv elements for scroll reveal
    if (typeof window._estObserveRv === 'function') {
      window._estObserveRv();
    }
  }

  function fmtSize(b) {
    if (b < 1024) return b + ' B';
    if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
    return (b / 1048576).toFixed(1) + ' MB';
  }

  /* ── Toggle blog post expand ───────────────────── */
  window.toggleBlogPost = function (card) {
    card.classList.toggle('expanded');
  };

  /* ── EXPORT: renderPosts into element ──────────── */
  window.EstymatorBlog = {
    render: renderPosts,
    getPosts: getPosts
  };

  /* ── Auto-render on DOM ready ──────────────────── */
  function autoRender() {
    // Find all blog containers marked with data-blog attribute
    var containers = document.querySelectorAll('[data-blog]');
    containers.forEach(function (c) {
      var limit = parseInt(c.getAttribute('data-blog-limit') || '0', 10);
      var category = c.getAttribute('data-blog-category') || null;
      renderPosts(c, limit, category);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }

})();
