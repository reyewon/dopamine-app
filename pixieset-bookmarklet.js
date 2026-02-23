/**
 * Pixieset Invoice Scraper Bookmarklet
 *
 * HOW TO USE:
 * 1. Create a new bookmark in your browser
 * 2. Set the name to something like "Pixieset Scraper"
 * 3. Copy the entire code below (starting from the line after this comment block)
 * 4. Paste it into the URL field of the bookmark, prefixed with "javascript:"
 *    (i.e., javascript:( function() { ... })();)
 * 5. Navigate to https://studio.pixieset.com/invoices and click the bookmark
 *
 * The bookmarklet will:
 * - Scrape invoice data from the Pixieset invoices page
 * - Send to both command-centre (legacy) and dopamine-app APIs
 * - Display success/error notifications
 */

javascript: (function () {
  'use strict';

  // Helper to show toast notifications
  function showNotification(message, isError) {
    if (isError === undefined) isError = false;
    var notification = document.createElement('div');
    notification.style.cssText = [
      'position:fixed',
      'top:20px',
      'right:20px',
      'padding:12px 20px',
      'border-radius:6px',
      'font-size:14px',
      'font-family:-apple-system,BlinkMacSystemFont,sans-serif',
      'z-index:2147483647',
      'max-width:320px',
      'line-height:1.4',
      'word-break:break-word',
      'box-shadow:0 4px 16px rgba(0,0,0,0.25)',
      isError ? 'background:#ef4444;color:#fff' : 'background:#10b981;color:#fff',
    ].join(';');
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(function () {
      notification.style.transition = 'opacity 0.3s';
      notification.style.opacity = '0';
      setTimeout(function () { notification.remove(); }, 350);
    }, 5000);
    return notification;
  }

  // Scrape invoices from the table — tries multiple selectors
  function scrapeInvoices() {
    var invoices = [];

    // Try various selectors Pixieset might use
    var rows = Array.from(
      document.querySelectorAll('table tbody tr')
    );

    if (rows.length === 0) {
      // Pixieset may use a list or div-based layout
      rows = Array.from(document.querySelectorAll('[class*="invoice"][class*="row"], [class*="InvoiceRow"], [data-testid*="invoice"]'));
    }

    if (rows.length === 0) {
      // Fallback: grab all <tr> on the page
      rows = Array.from(document.querySelectorAll('tr')).filter(function (r) {
        return r.querySelectorAll('td').length >= 3;
      });
    }

    if (rows.length === 0) {
      showNotification('No invoices found. Make sure you are on studio.pixieset.com/invoices and the page has loaded fully.', true);
      return null;
    }

    rows.forEach(function (row) {
      var cells = row.querySelectorAll('td');
      if (cells.length < 3) return; // Skip rows with too few cells

      try {
        // Try to identify columns — Pixieset layout: #, Client, Project, Amount, Status, Due, Created
        var invoiceNumber = (cells[0] ? cells[0].textContent : '').trim();
        var clientName    = (cells[1] ? cells[1].textContent : '').trim();
        var projectName   = (cells[2] ? cells[2].textContent : '').trim();
        var amountStr     = (cells[3] ? cells[3].textContent : '').trim().replace(/[^\d.-]/g, '');
        var statusStr     = (cells[4] ? cells[4].textContent : '').trim().toLowerCase();
        var dueDate       = (cells[5] ? cells[5].textContent : '').trim();
        var createdDate   = (cells[6] ? cells[6].textContent : '').trim();

        if (!invoiceNumber) return; // Skip rows without invoice number

        var amount = amountStr ? parseFloat(amountStr) : undefined;

        var status = 'draft';
        if (statusStr.includes('paid')) {
          status = 'paid';
        } else if (statusStr.includes('unpaid') || statusStr.includes('due')) {
          status = 'unpaid';
        } else if (statusStr.includes('cancel')) {
          status = 'cancelled';
        } else if (statusStr.includes('draft')) {
          status = 'draft';
        }

        invoices.push({
          id: 'pix-' + invoiceNumber,
          number: invoiceNumber,
          amount: (isNaN(amount) || amount === undefined) ? undefined : amount,
          client: clientName || undefined,
          project: projectName || undefined,
          status: status,
          dueDate: dueDate || undefined,
          createdDate: createdDate || undefined,
        });
      } catch (err) {
        console.error('Pixieset scraper: error parsing row', err);
      }
    });

    if (invoices.length === 0) {
      showNotification('Found table rows but could not extract any invoices. The page layout may have changed — please check the console for details.', true);
      return null;
    }

    return invoices;
  }

  // Send to dopamine-app
  function sendToDopamineApp(invoices) {
    return fetch('https://dopamine-app.pages.dev/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoices),
    }).then(function (response) {
      if (!response.ok) {
        console.warn('Dopamine app sync returned non-200 status:', response.status);
      }
    }).catch(function (err) {
      console.error('Error sending to dopamine-app:', err);
    });
  }

  // Send to command-centre (legacy)
  function sendToCommandCentre(invoices) {
    return fetch('https://command-centre-rho.vercel.app/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'pixieset-invoices', value: invoices }),
    }).then(function (response) {
      if (!response.ok) {
        console.warn('Command centre sync returned non-200 status:', response.status);
      }
    }).catch(function (err) {
      console.error('Error sending to command-centre:', err);
    });
  }

  // Main
  var notice = showNotification('Pixieset Scraper: scanning page...');

  setTimeout(function () {
    var invoices = scrapeInvoices();
    if (!invoices) return;

    if (notice && notice.parentNode) notice.remove();
    showNotification('Found ' + invoices.length + ' invoice(s). Syncing...');

    Promise.all([
      sendToDopamineApp(invoices),
      sendToCommandCentre(invoices),
    ]).then(function () {
      showNotification('Successfully synced ' + invoices.length + ' invoice(s) to Dopamine + Command Centre!');
    }).catch(function (err) {
      showNotification('Sync error — check browser console for details.', true);
      console.error('Pixieset scraper sync error:', err);
    });
  }, 300);

})();
