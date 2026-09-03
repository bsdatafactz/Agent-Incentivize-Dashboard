(function () {
  'use strict';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- theme toggle ----------
  function setTheme(mode) {
    if (mode) document.documentElement.setAttribute('data-theme', mode);
    else document.documentElement.removeAttribute('data-theme');
    try { localStorage.setItem('sf-theme', mode || ''); } catch (e) {}
  }
  var themeBtn = document.getElementById('themeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var cur = document.documentElement.getAttribute('data-theme');
      var isDark = cur === 'dark' || (!cur && window.matchMedia('(prefers-color-scheme: dark)').matches);
      setTheme(isDark ? 'light' : 'dark');
    });
  }
  try {
    var saved = localStorage.getItem('sf-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  } catch (e) {}

  // ---------- modals ----------
  window.openModal = function (name) {
    var el = document.getElementById('modal-' + name);
    if (el) el.classList.remove('hidden');
  };
  window.closeModal = function (name) {
    var el = document.getElementById('modal-' + name);
    if (el) el.classList.add('hidden');
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(function (el) {
        el.classList.add('hidden');
      });
      var tierup = document.getElementById('tierupOverlay');
      if (tierup) tierup.classList.add('hidden');
    }
  });
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.add('hidden');
    });
  });

  // ---------- table-view toggles (chart accessibility twin) ----------
  function wireTableToggle(btnId, tableId, chartSelector) {
    var btn = document.getElementById(btnId);
    var table = document.getElementById(tableId);
    if (!btn || !table) return;
    btn.addEventListener('click', function () {
      var showingTable = !table.classList.contains('hidden');
      table.classList.toggle('hidden', showingTable);
      var chart = document.querySelector(chartSelector);
      if (chart) chart.classList.toggle('hidden', !showingTable);
      btn.textContent = showingTable ? 'View as table' : 'View as chart';
    });
  }
  wireTableToggle('trendTableToggle', 'trendTable', '#trendChartWrap svg');
  wireTableToggle('serviceTableToggle', 'serviceTable', '#serviceBarList');

  // ---------- trend chart hover tooltip ----------
  var trendWrap = document.getElementById('trendChartWrap');
  if (trendWrap) {
    var tooltip = document.createElement('div');
    tooltip.className = 'chart-tooltip';
    trendWrap.appendChild(tooltip);
    trendWrap.querySelectorAll('.trend-hit').forEach(function (hit) {
      hit.addEventListener('mouseenter', function () {
        var rect = hit.getBoundingClientRect(), wrapRect = trendWrap.getBoundingClientRect();
        tooltip.textContent = hit.getAttribute('data-label') + ': ' + Number(hit.getAttribute('data-value')).toLocaleString('en-US') + ' pts';
        tooltip.style.left = (rect.left - wrapRect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top - wrapRect.top) + 'px';
        tooltip.classList.add('is-visible');
      });
      hit.addEventListener('mouseleave', function () { tooltip.classList.remove('is-visible'); });
    });
  }

  // ---------- log a sale ----------
  function getCsrfToken() {
    var input = document.querySelector('input[name=csrfmiddlewaretoken]');
    return input ? input.value : '';
  }

  function showLevelToast(text) {
    var el = document.createElement('div');
    el.textContent = text;
    el.style.cssText = 'position:fixed;top:18px;left:50%;transform:translate(-50%,-20px);' +
      'background:#0a1a3a;color:#fff;font-weight:700;font-size:13px;padding:12px 22px;' +
      'border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.28);z-index:300;opacity:0;' +
      'transition:opacity .25s ease, transform .25s ease;pointer-events:none;';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.opacity = '1';
      el.style.transform = 'translate(-50%,0)';
    });
    setTimeout(function () {
      el.style.opacity = '0';
      el.style.transform = 'translate(-50%,-20px)';
      setTimeout(function () { el.remove(); }, 300);
    }, 2000);
  }

  function spawnFloatingGain(originEl, text) {
    if (REDUCED) return;
    var target = document.getElementById('pointsValue');
    if (!target) return;
    var o = originEl.getBoundingClientRect(), t = target.getBoundingClientRect();
    var el = document.createElement('span');
    el.className = 'floating-gain';
    el.textContent = text;
    el.style.left = (o.left + o.width / 2) + 'px';
    el.style.top = (o.top + o.height / 2) + 'px';
    document.body.appendChild(el);
    requestAnimationFrame(function () {
      el.style.left = (t.left + t.width / 2) + 'px';
      el.style.top = (t.top - 6) + 'px';
      el.style.opacity = '0';
    });
    setTimeout(function () { el.remove(); }, 650);
  }

  document.querySelectorAll('.log-btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var serviceId = btn.getAttribute('data-service-id');
      var points = btn.getAttribute('data-service-points');
      btn.disabled = true;
      spawnFloatingGain(btn, '+' + points);

      fetch(window.LOG_SALE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': getCsrfToken() },
        body: JSON.stringify({ service_id: serviceId }),
      })
        .then(function (res) { if (!res.ok) throw new Error('log-sale failed'); return res.json(); })
        .then(function (data) {
          var card = document.getElementById('tierCard');
          if (data.tier_up) {
            document.getElementById('tierupBadge').className = 'tierup-badge tier-' + data.level.major;
            document.getElementById('tierupBadge').textContent = data.level.major[0];
            document.getElementById('tierupTitle').textContent = 'Welcome to ' + data.level.major;
            document.getElementById('tierupBody').textContent = data.level.major_benefit;
            document.getElementById('tierupOverlay').classList.remove('hidden');
          } else if (data.sub_level_up) {
            showLevelToast('Leveled up → ' + data.level.major + ' ' + data.level.sub);
            if (card) {
              card.classList.remove('level-bump');
              void card.offsetWidth;
              card.classList.add('level-bump');
            }
          } else if (card) {
            card.classList.remove('level-bump');
            void card.offsetWidth;
            card.classList.add('level-bump');
          }
          // Reload after the celebration beat so every server-computed number
          // (KPIs, leaderboard, service mix, weekly trend) stays authoritative.
          setTimeout(function () { window.location.reload(); }, data.tier_up ? 1400 : (data.sub_level_up ? 1100 : 650));
        })
        .catch(function () { btn.disabled = false; });
    });
  });

  window.closeTierUp = function () {
    var el = document.getElementById('tierupOverlay');
    if (el) el.classList.add('hidden');
  };

  // ---------- sign out via the account modal ----------
  window.signOut = function () {
    var form = document.getElementById('logoutForm');
    if (form) form.submit();
  };
})();
