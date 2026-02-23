(function () {
  'use strict';

  function toast(msg, err) {
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;top:20px;right:20px;padding:14px 22px;border-radius:8px;font-size:14px;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,sans-serif;z-index:2147483647;max-width:340px;line-height:1.4;color:#fff;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:opacity 0.3s;' + (err ? 'background:#ef4444' : 'background:#10b981');
    d.textContent = msg;
    document.body.appendChild(d);
    setTimeout(function () { d.style.opacity = '0'; setTimeout(function () { d.remove(); }, 400); }, 5000);
    return d;
  }

  function scrape() {
    var rows = document.querySelectorAll('table tbody tr');
    if (!rows.length) {
      toast('No invoice table found. Are you on studio.pixieset.com/invoices?', true);
      return null;
    }

    var invoices = [];
    rows.forEach(function (row) {
      var c = row.querySelectorAll('td');
      if (c.length < 7) return;

      var num = c[0].textContent.trim();
      if (!num) return;

      // Column 1: Status badge
      var statusRaw = c[1].textContent.trim().toLowerCase();
      var status = 'draft';
      if (statusRaw.indexOf('paid') >= 0 && statusRaw.indexOf('unpaid') < 0) status = 'paid';
      else if (statusRaw.indexOf('unpaid') >= 0 || statusRaw.indexOf('due') >= 0) status = 'unpaid';
      else if (statusRaw.indexOf('cancel') >= 0) status = 'cancelled';

      // Column 2: Amount
      var amountStr = c[2].textContent.trim().replace(/[^\d.-]/g, '');
      var amount = amountStr ? parseFloat(amountStr) : undefined;
      if (amount !== undefined && isNaN(amount)) amount = undefined;

      // Column 3: Client (skip avatar initials — find first span with >2 chars)
      var clientName = '';
      var spans = c[3].querySelectorAll('span');
      for (var i = 0; i < spans.length; i++) {
        var t = spans[i].textContent.trim();
        if (t.length > 2) { clientName = t; break; }
      }
      if (!clientName) clientName = c[3].textContent.trim();

      // Column 4: Project
      var project = c[4].textContent.trim();

      // Column 5: Due date
      var due = c[5].textContent.trim();

      // Column 6: Created date (first span only, skips dropdown menu text)
      var createdSpan = c[6].querySelector('span');
      var created = createdSpan ? createdSpan.textContent.trim() : c[6].textContent.trim().split('\n')[0].trim();

      invoices.push({
        id: 'pix-' + num,
        number: num,
        amount: amount,
        client: clientName || undefined,
        project: project || undefined,
        status: status,
        dueDate: due || undefined,
        createdDate: created || undefined
      });
    });

    if (!invoices.length) {
      toast('Found rows but could not parse any invoices.', true);
      return null;
    }
    return invoices;
  }

  function syncDopamine(inv) {
    return fetch('https://dopamine-app.pages.dev/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inv)
    }).then(function (r) { if (!r.ok) console.warn('Dopamine sync status:', r.status); })
      .catch(function (e) { console.error('Dopamine sync error:', e); });
  }

  function syncLegacy(inv) {
    return fetch('https://command-centre-rho.vercel.app/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'pixieset-invoices', value: inv })
    }).then(function (r) { if (!r.ok) console.warn('Legacy sync status:', r.status); })
      .catch(function (e) { console.error('Legacy sync error:', e); });
  }

  // Run
  var n = toast('Scanning invoices...');
  setTimeout(function () {
    var inv = scrape();
    if (!inv) return;
    if (n && n.parentNode) n.remove();
    toast('Found ' + inv.length + ' invoice(s). Syncing...');
    Promise.all([syncDopamine(inv), syncLegacy(inv)]).then(function () {
      toast('Synced ' + inv.length + ' invoice(s) to Dopamine!');
    }).catch(function () {
      toast('Sync error. Check browser console.', true);
    });
  }, 200);
})();
