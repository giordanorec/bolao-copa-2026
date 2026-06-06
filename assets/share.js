// ============================================================
// Bolão das IAs — share / theme switcher / favoritos
// ============================================================

(function () {
  'use strict';

  // ── Toast helper ──────────────────────────────────────────
  function toast(msg, ms) {
    var el = document.querySelector('.toast') || (function () {
      var t = document.createElement('div');
      t.className = 'toast';
      document.body.appendChild(t);
      return t;
    })();
    el.textContent = msg;
    el.classList.add('is-visible');
    clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.classList.remove('is-visible'); }, ms || 2400);
  }

  // ── Share helper ──────────────────────────────────────────
  function fallbackCopy(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(function () { toast('Texto copiado! Cola onde quiser. 📋'); })
        .catch(function () { toast('Não consegui copiar. Selecione manualmente.'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); toast('Texto copiado! 📋'); }
      catch (e) { toast('Não consegui copiar.'); }
      document.body.removeChild(ta);
    }
  }

  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-share]');
    if (!btn) return;
    ev.preventDefault();
    var modo = btn.dataset.share;
    var texto = btn.dataset.text || document.title;
    var url = btn.dataset.url || window.location.href;
    var titulo = btn.dataset.title || document.title;

    if (modo === 'whatsapp') {
      var wa = 'https://wa.me/?text=' + encodeURIComponent(texto + '\n\n' + url);
      window.open(wa, '_blank');
    } else if (modo === 'instagram') {
      var fullText = texto + '\n\n' + url;
      fallbackCopy(fullText);
      toast('Texto copiado! Cole no Instagram (story / DM) 📸');
    } else if (modo === 'native') {
      if (navigator.share) {
        navigator.share({ title: titulo, text: texto, url: url })
          .catch(function () {});
      } else {
        fallbackCopy(texto + '\n\n' + url);
      }
    } else if (modo === 'copy') {
      fallbackCopy(texto + '\n\n' + url);
    }
  });

  // ── Theme switcher ────────────────────────────────────────
  function initThemeSwitcher() {
    var sw = document.querySelector('.theme-switcher');
    if (!sw) return;
    var saved = localStorage.getItem('bolao-theme');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
      var r = sw.querySelector('input[value="' + saved + '"]');
      if (r) r.checked = true;
    }
    sw.querySelectorAll('input[name="theme"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.body.setAttribute('data-theme', r.value);
        localStorage.setItem('bolao-theme', r.value);
      });
    });
    var closed = localStorage.getItem('bolao-theme-closed') === '1';
    if (closed) document.body.classList.add('theme-switcher-closed');
    var toggle = sw.querySelector('.toggle-btn');
    if (toggle) {
      toggle.addEventListener('click', function () {
        document.body.classList.toggle('theme-switcher-closed');
        localStorage.setItem('bolao-theme-closed',
          document.body.classList.contains('theme-switcher-closed') ? '1' : '0');
      });
    }
  }
  initThemeSwitcher();

  // ── Favoritos (LocalStorage) ──────────────────────────────
  function getFavs() {
    try { return JSON.parse(localStorage.getItem('bolao-favs') || '[]'); }
    catch (e) { return []; }
  }
  function setFavs(arr) {
    localStorage.setItem('bolao-favs', JSON.stringify(arr));
  }
  function isFav(slug) { return getFavs().indexOf(slug) !== -1; }
  function toggleFav(slug) {
    var favs = getFavs();
    var idx = favs.indexOf(slug);
    if (idx === -1) {
      favs.push(slug);
      setFavs(favs);
      return true;
    }
    favs.splice(idx, 1);
    setFavs(favs);
    return false;
  }
  function applyFavs() {
    var favs = getFavs();
    document.querySelectorAll('[data-fav-slug]').forEach(function (el) {
      var slug = el.dataset.favSlug;
      var btn = el.querySelector('.fav-toggle');
      if (favs.indexOf(slug) !== -1) {
        el.classList.add('is-favorito');
        if (btn) btn.textContent = '⭐';
      } else {
        el.classList.remove('is-favorito');
        if (btn) btn.textContent = '☆';
      }
    });
    // Mover favoritos pro topo da lista (cards e linhas de tabela)
    var grids = document.querySelectorAll('.ias-grid, .serie-a-grid, .ranking-table tbody');
    grids.forEach(function (parent) {
      var items = Array.prototype.slice.call(parent.children);
      var ordered = items.slice().sort(function (a, b) {
        var aFav = a.classList.contains('is-favorito') ? 0 : 1;
        var bFav = b.classList.contains('is-favorito') ? 0 : 1;
        return aFav - bFav;
      });
      ordered.forEach(function (it) { parent.appendChild(it); });
    });
  }
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.fav-toggle');
    if (!btn) return;
    ev.preventDefault();
    ev.stopPropagation();
    var holder = btn.closest('[data-fav-slug]');
    if (!holder) return;
    var slug = holder.dataset.favSlug;
    var added = toggleFav(slug);
    if (added) {
      toast('⭐ ' + (holder.dataset.favLabel || slug) + ' adicionada aos favoritos');
    } else {
      toast('Removida dos favoritos');
    }
    applyFavs();
  });
  applyFavs();

  // ── Filtro de fases (já era do script.js antigo) ─────────
  var filtros = document.getElementById('fase-filtros');
  if (filtros) {
    filtros.addEventListener('click', function (ev) {
      var chip = ev.target.closest('.fase-chip');
      if (!chip) return;
      filtros.querySelectorAll('.fase-chip').forEach(function (c) {
        c.classList.remove('is-active');
      });
      chip.classList.add('is-active');
      var fase = chip.dataset.fase;
      document.querySelectorAll('#jogos-grid > [data-fase]').forEach(function (card) {
        if (fase === 'todos' || card.dataset.fase === fase) {
          card.style.display = '';
        } else {
          card.style.display = 'none';
        }
      });
    });
  }
})();
