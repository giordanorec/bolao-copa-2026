// ============================================================
// Bolão das IAs — share / theme switcher / favoritos / modals / canvas
// ============================================================

(function () {
  'use strict';

  // ── TOAST ──────────────────────────────────────────────────
  function toast(msg, ms) {
    var el = document.querySelector('.toast') || (function () {
      var t = document.createElement('div'); t.className = 'toast';
      document.body.appendChild(t); return t;
    })();
    el.textContent = msg; el.classList.add('is-visible');
    clearTimeout(el.__t);
    el.__t = setTimeout(function () { el.classList.remove('is-visible'); }, ms || 2400);
  }

  // ── CLIPBOARD HELPER ──────────────────────────────────────
  function copyText(text, msg) {
    msg = msg || 'Texto copiado! 📋';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(function () { toast(msg); })
        .catch(function () { toast('Não consegui copiar.'); });
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); toast(msg); }
      catch (e) { toast('Não consegui copiar.'); }
      document.body.removeChild(ta);
    }
  }

  // ── CANVAS CARD GENERATOR (Instagram / WhatsApp) ──────────
  function getThemeVar(name, fallback) {
    var v = getComputedStyle(document.body).getPropertyValue(name).trim();
    return v || fallback;
  }

  function gerarCard(opts) {
    // opts: { titulo, subtitulo, placar, time_a, time_b, flag_a_url, flag_b_url, tag, footer }
    var W = 1080, H = 1080;
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    var bg0 = getThemeVar('--bg-0', '#FFF8E7');
    var bg2 = getThemeVar('--bg-2', '#FFFFFF');
    var primary = getThemeVar('--primary', '#009C3B');
    var accent = getThemeVar('--accent', '#FFDF00');
    var secondary = getThemeVar('--secondary', '#002776');
    var extra = getThemeVar('--extra', '#FF4D8D');
    var fg = getThemeVar('--fg', '#1A2233');

    // bg gradient
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg0); grad.addColorStop(1, bg2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    // top stripe BR
    var stripeH = 24;
    var widths = [primary, accent, secondary, '#FFFFFF'];
    var sw = W / 12;
    for (var i = 0; i < 12; i++) {
      ctx.fillStyle = widths[i % 4];
      ctx.fillRect(i * sw, 0, sw, stripeH);
    }

    // header (brand)
    ctx.fillStyle = secondary;
    ctx.font = 'bold 56px "Fraunces", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Bolão das IAs', 70, 130);
    ctx.fillStyle = primary;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('🇧🇷 COPA 2026', 70, 170);

    // tag (top right)
    if (opts.tag) {
      ctx.fillStyle = accent;
      var tagPadX = 24, tagPadY = 12;
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      var tw = ctx.measureText(opts.tag).width;
      ctx.fillRect(W - tw - 70 - tagPadX*2, 100, tw + tagPadX*2, 44);
      ctx.fillStyle = secondary;
      ctx.fillText(opts.tag, W - tw - 70 - tagPadX, 132);
    }

    // título principal
    ctx.fillStyle = secondary;
    ctx.textAlign = 'center';
    if (opts.titulo) {
      ctx.font = 'bold 64px "Fraunces", Georgia, serif';
      wrap(ctx, opts.titulo, W/2, 290, W - 140, 72);
    }
    if (opts.subtitulo) {
      ctx.fillStyle = fg;
      ctx.font = '34px "Outfit", system-ui, sans-serif';
      ctx.fillText(opts.subtitulo, W/2, 380);
    }

    // confronto: time_a + placar + time_b
    if (opts.time_a && opts.time_b) {
      // boxes laterais
      drawTime(ctx, opts.time_a, opts.flag_a_url, 90, 510, 280);
      drawTime(ctx, opts.time_b, opts.flag_b_url, W - 90 - 280, 510, 280);

      // placar central
      ctx.fillStyle = primary;
      ctx.font = 'bold 160px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      var placarTxt = (opts.placar || '? × ?').replace(/x/i, '×').replace('-', '×');
      ctx.fillText(placarTxt, W/2, 720);
    }

    // footer
    ctx.fillStyle = fg;
    ctx.font = '500 28px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    var fLabel = opts.footer || 'Quem chuta melhor? As IAs palpitam.';
    ctx.fillText(fLabel, W/2, H - 130);

    ctx.fillStyle = primary;
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('bolao-das-ias.com', W/2, H - 80);

    return canvas;
  }

  function wrap(ctx, text, x, y, maxW, lineH) {
    var words = text.split(' ');
    var line = '';
    for (var n = 0; n < words.length; n++) {
      var test = line + words[n] + ' ';
      if (ctx.measureText(test).width > maxW && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + ' '; y += lineH;
      } else { line = test; }
    }
    ctx.fillText(line, x, y);
    return y;
  }

  function drawTime(ctx, nome, flagUrl, x, y, w) {
    var fg = getThemeVar('--fg', '#1A2233');
    var bgSoft = getThemeVar('--bg-soft', '#FEF5C8');

    // bandeira circular (flag image carregada por evento)
    var cx = x + w/2, cy = y + 90;
    var r = 90;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = bgSoft; ctx.fillRect(cx-r, cy-r, r*2, r*2);
    if (flagUrl) {
      var img = ctx.canvas.__imgs && ctx.canvas.__imgs[flagUrl];
      if (img && img.complete && img.naturalWidth) {
        ctx.drawImage(img, cx-r, cy-r, r*2, r*2);
      }
    }
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();

    // nome do time
    ctx.fillStyle = fg;
    ctx.font = 'bold 30px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    wrap(ctx, nome, x + w/2, y + 220, w, 40);
  }

  function loadImage(url) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = function () { resolve(img); };
      img.onerror = function () { resolve(null); };
      img.src = url;
    });
  }

  function baixarCard(opts) {
    var urls = [opts.flag_a_url, opts.flag_b_url].filter(Boolean);
    Promise.all(urls.map(loadImage)).then(function (imgs) {
      var imgMap = {};
      urls.forEach(function (u, i) { if (imgs[i]) imgMap[u] = imgs[i]; });
      var c = gerarCard(opts);
      c.__imgs = imgMap;
      // redesenha com imagens
      var ctx2 = c.getContext('2d');
      ctx2.canvas.__imgs = imgMap;
      var c2 = gerarCard(opts); // primeiro gera sem
      // Hack: re-cria com imgs já carregadas
      var canvasFinal = document.createElement('canvas');
      canvasFinal.width = c.width; canvasFinal.height = c.height;
      var ctxF = canvasFinal.getContext('2d');
      ctxF.canvas.__imgs = imgMap;
      var W = c.width, H = c.height;
      // redesenha tudo
      copyCanvas(ctxF, opts, imgMap);
      // baixa
      canvasFinal.toBlob(function (blob) {
        if (!blob) { toast('Não consegui gerar imagem.'); return; }
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url; a.download = (opts.filename || 'bolao-das-ias') + '.png';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
        toast('Card baixado! 📸');
      }, 'image/png');
    });
  }

  function copyCanvas(ctx, opts, imgMap) {
    var W = 1080, H = 1080;
    var bg0 = getThemeVar('--bg-0', '#FFF8E7');
    var bg2 = getThemeVar('--bg-2', '#FFFFFF');
    var primary = getThemeVar('--primary', '#009C3B');
    var accent = getThemeVar('--accent', '#FFDF00');
    var secondary = getThemeVar('--secondary', '#002776');
    var fg = getThemeVar('--fg', '#1A2233');

    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bg0); grad.addColorStop(1, bg2);
    ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);

    var stripeH = 24;
    var paletteStripe = [primary, accent, secondary, '#FFFFFF'];
    var sw = W / 12;
    for (var i = 0; i < 12; i++) {
      ctx.fillStyle = paletteStripe[i % 4];
      ctx.fillRect(i * sw, 0, sw, stripeH);
    }

    ctx.fillStyle = secondary;
    ctx.font = 'bold 56px "Fraunces", Georgia, serif';
    ctx.textAlign = 'left';
    ctx.fillText('Bolão das IAs', 70, 130);
    ctx.fillStyle = primary;
    ctx.font = 'bold 22px "JetBrains Mono", monospace';
    ctx.fillText('🇧🇷 COPA 2026', 70, 170);

    if (opts.tag) {
      ctx.font = 'bold 22px "JetBrains Mono", monospace';
      var tw = ctx.measureText(opts.tag).width;
      ctx.fillStyle = accent;
      ctx.fillRect(W - tw - 70 - 48, 100, tw + 48, 44);
      ctx.fillStyle = secondary;
      ctx.fillText(opts.tag, W - tw - 70 - 24, 132);
    }

    ctx.fillStyle = secondary;
    ctx.textAlign = 'center';
    if (opts.titulo) {
      ctx.font = 'bold 64px "Fraunces", Georgia, serif';
      wrap(ctx, opts.titulo, W/2, 290, W - 140, 72);
    }
    if (opts.subtitulo) {
      ctx.fillStyle = fg;
      ctx.font = '34px "Outfit", system-ui, sans-serif';
      ctx.fillText(opts.subtitulo, W/2, 380);
    }

    if (opts.time_a && opts.time_b) {
      // Layout: bandeira esquerda + placar central + bandeira direita, mais espaço
      drawTime2(ctx, opts.time_a, opts.flag_a_url, 50, 520, 240, imgMap);
      drawTime2(ctx, opts.time_b, opts.flag_b_url, W - 50 - 240, 520, 240, imgMap);
      // placar ABAIXO da linha das bandeiras pra não sobrepor
      ctx.fillStyle = primary;
      ctx.font = 'bold 180px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.fillText((opts.placar || '? × ?').replace(/x/i, '×').replace('-', '×'), W/2, 870);
    }

    ctx.fillStyle = fg;
    ctx.font = '500 28px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(opts.footer || 'Quem chuta melhor? As IAs palpitam.', W/2, H - 130);

    ctx.fillStyle = primary;
    ctx.font = 'bold 26px "JetBrains Mono", monospace';
    ctx.fillText('bolao-das-ias.com', W/2, H - 80);
  }

  function drawTime2(ctx, nome, flagUrl, x, y, w, imgMap) {
    var fg = getThemeVar('--fg', '#1A2233');
    var bgSoft = getThemeVar('--bg-soft', '#FEF5C8');
    var cx = x + w/2, cy = y + 90, r = 90;
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.clip();
    ctx.fillStyle = bgSoft; ctx.fillRect(cx-r, cy-r, r*2, r*2);
    var img = flagUrl && imgMap && imgMap[flagUrl];
    if (img) ctx.drawImage(img, cx-r, cy-r, r*2, r*2);
    ctx.restore();
    ctx.lineWidth = 6; ctx.strokeStyle = '#FFFFFF';
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = fg;
    ctx.font = 'bold 30px "Outfit", system-ui, sans-serif';
    ctx.textAlign = 'center';
    wrap(ctx, nome, x + w/2, y + 220, w, 40);
  }

  // ── SHARE LISTENER ────────────────────────────────────────
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-share]');
    if (!btn) return;
    ev.preventDefault();
    var modo = btn.dataset.share;
    var texto = btn.dataset.text || document.title;
    var url = btn.dataset.url || window.location.href;
    var titulo = btn.dataset.title || document.title;

    if (modo === 'whatsapp') {
      var opts = btn.dataset.card ? JSON.parse(btn.dataset.card) : null;
      if (opts) {
        opts.filename = (titulo || 'bolao').toLowerCase().replace(/[^a-z0-9]+/g, '-');
        baixarCard(opts);
        setTimeout(function () {
          var wa = 'https://wa.me/?text=' + encodeURIComponent(texto + '\n\n' + url);
          window.open(wa, '_blank');
        }, 400);
      } else {
        var wa = 'https://wa.me/?text=' + encodeURIComponent(texto + '\n\n' + url);
        window.open(wa, '_blank');
      }
    } else if (modo === 'instagram') {
      var optsI = btn.dataset.card ? JSON.parse(btn.dataset.card) : null;
      if (optsI) {
        optsI.filename = (titulo || 'bolao').toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-instagram';
        baixarCard(optsI);
        copyText(texto + '\n\n' + url, 'Imagem baixada + texto copiado! Cole no Insta 📸');
      } else {
        copyText(texto + '\n\n' + url, 'Texto copiado! Cole no Instagram 📸');
      }
    } else if (modo === 'copy') {
      copyText(texto + '\n\n' + url);
    }
  });

  // ── THEME SWITCHER ────────────────────────────────────────
  function initThemeSwitcher() {
    var sw = document.querySelector('.theme-switcher');
    if (!sw) return;
    var saved = localStorage.getItem('bolao-theme');
    if (saved) {
      document.body.setAttribute('data-theme', saved);
      var r = sw.querySelector('input[value="' + saved + '"]');
      if (r) r.checked = true;
    }
    function highlight() {
      sw.querySelectorAll('label').forEach(function (l) {
        var input = l.querySelector('input');
        l.classList.toggle('is-current', input && input.checked);
      });
    }
    highlight();
    sw.querySelectorAll('input[name="theme"]').forEach(function (r) {
      r.addEventListener('change', function () {
        document.body.setAttribute('data-theme', r.value);
        localStorage.setItem('bolao-theme', r.value);
        highlight();
        toast('Tema: ' + (r.parentNode.textContent.trim()) + ' aplicado.');
      });
    });
    var closed = localStorage.getItem('bolao-theme-closed') === '1';
    if (closed) document.body.classList.add('theme-switcher-closed');
    var toggle = sw.querySelector('.toggle-btn');
    if (toggle) toggle.addEventListener('click', function () {
      document.body.classList.toggle('theme-switcher-closed');
      localStorage.setItem('bolao-theme-closed',
        document.body.classList.contains('theme-switcher-closed') ? '1' : '0');
    });
  }
  initThemeSwitcher();

  // ── FAVORITOS ─────────────────────────────────────────────
  function getFavs() {
    try { return JSON.parse(localStorage.getItem('bolao-favs') || '[]'); }
    catch (e) { return []; }
  }
  function setFavs(arr) { localStorage.setItem('bolao-favs', JSON.stringify(arr)); }
  function toggleFav(slug) {
    var favs = getFavs(); var idx = favs.indexOf(slug);
    if (idx === -1) { favs.push(slug); setFavs(favs); return true; }
    favs.splice(idx, 1); setFavs(favs); return false;
  }
  function applyFavs() {
    var favs = getFavs();
    document.querySelectorAll('[data-fav-slug]').forEach(function (el) {
      var slug = el.dataset.favSlug;
      var btn = el.querySelector('.fav-toggle');
      var on = favs.indexOf(slug) !== -1;
      el.classList.toggle('is-favorito', on);
      if (btn) btn.textContent = on ? '⭐' : '☆';
    });
    var grids = document.querySelectorAll('.ias-grid, .serie-a-grid, .ranking-table tbody');
    grids.forEach(function (parent) {
      var items = Array.prototype.slice.call(parent.children);
      items.sort(function (a, b) {
        var av = a.classList.contains('is-favorito') ? 0 : 1;
        var bv = b.classList.contains('is-favorito') ? 0 : 1;
        return av - bv;
      });
      items.forEach(function (it) { parent.appendChild(it); });
    });
  }
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('.fav-toggle');
    if (!btn) return;
    ev.preventDefault(); ev.stopPropagation();
    var holder = btn.closest('[data-fav-slug]');
    if (!holder) return;
    var added = toggleFav(holder.dataset.favSlug);
    toast(added ? '⭐ ' + (holder.dataset.favLabel || '') + ' favoritada' : 'Removida');
    applyFavs();
  });
  applyFavs();

  // ── MODAL HELPERS ─────────────────────────────────────────
  function abrirModal(html) {
    var bd = document.querySelector('.modal-backdrop') || (function () {
      var b = document.createElement('div');
      b.className = 'modal-backdrop';
      b.innerHTML = '<div class="modal"><button class="modal-close" aria-label="fechar">×</button><div class="modal-body"></div></div>';
      document.body.appendChild(b);
      b.addEventListener('click', function (e) { if (e.target === b) fecharModal(); });
      b.querySelector('.modal-close').addEventListener('click', fecharModal);
      return b;
    })();
    bd.querySelector('.modal-body').innerHTML = html;
    bd.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }
  function fecharModal() {
    var bd = document.querySelector('.modal-backdrop');
    if (bd) bd.classList.remove('is-open');
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharModal(); });

  // ── POPUP: PALPITE COMPARTILHADO (clica no placar) ────────
  document.addEventListener('click', function (ev) {
    var btn = ev.target.closest('[data-popup-placar]');
    if (!btn) return;
    ev.preventDefault();
    var ga = btn.dataset.gA, gb = btn.dataset.gB;
    var dadosEl = document.getElementById('palpites-dados');
    if (!dadosEl) return;
    var dados;
    try { dados = JSON.parse(dadosEl.textContent); } catch (e) { return; }
    var key = ga + 'x' + gb;
    var ias = dados[key] || [];
    var html = '<h2>' + ga + ' × ' + gb + '</h2>'
      + '<p style="color:var(--fg-mid);font-size:16px;">' + ias.length + ' IA' + (ias.length === 1 ? '' : 's') + ' deram este palpite:</p>'
      + '<div class="ia-list-popup">'
      + ias.map(function (i) {
          return '<a class="ia-pill" href="../ia/' + i.slug + '.html">'
            + '<span class="ia-logo" style="width:32px;height:32px;padding:4px;">'
            + (i.logo || '<span class="initial-pill" style="background:#999">'+i.slug[0].toUpperCase()+'</span>')
            + '</span>'
            + '<span>' + i.nome + '</span>'
            + '</a>';
        }).join('')
      + '</div>';
    abrirModal(html);
  });

  // Popup de jogo inteiro removido — navegação direta agora (link normal)

  // ── FILTRO DE FASES ───────────────────────────────────────
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
        card.style.display = (fase === 'todos' || card.dataset.fase === fase) ? '' : 'none';
      });
    });
  }
})();
