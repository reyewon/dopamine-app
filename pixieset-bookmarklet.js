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
  function showNotification(message, isError = false) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      border-radius: 4px;
      font-size: 14px;
      z-index: 10000;
      ${isError ? 'background-color: #f87171; color: white;' : 'background-color: #10b981; color: white;'}
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      animation: slideIn 0.3s ease-out;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out forwards';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }

  // Add animation styles
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);

  // Scrape invoices from the table
  function scrapeInvoices() {
    const invoices = [];
    const rows = document.querySelectorAll('table tbody tr');

    if (rows.length === 0) {
      showNotification('No invoices found. Make sure you are on the Pixieset invoices page.', true);
      return null;
    }

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      if (cells.length < 6) return; // Skip incomplete rows

      try {
        // Extract data from cells
        const invoiceNumber = (cells[0]?.textContent || '').trim();
        const clientName = (cells[1]?.textContent || '').trim();
        const projectName = (cells[2]?.textContent || '').trim();
        const amountStr = (cells[3]?.textContent || '').trim().replace(/[^\d.-]/g, '');
        const statusStr = (cells[4]?.textContent || '').trim().toLowerCase();
        const dueDate = (cells[5]?.textContent || '').trim();
        const createdDate = (cells[6]?.textContent || '').trim();

        if (!invoiceNumber) return; // Skip rows without invoice number

        // Parse amount
        const amount = amountStr ? parseFloat(amountStr) : undefined;

        // Normalize status
        let status = 'draft';
        if (statusStr.includes('paid')) {
          status = 'paid';
        } else if (statusStr.includes('unpaid')) {
          status = 'unpaid';
        } else if (statusStr.includes('cancelled')) {
          status = 'cancelled';
        }

        const invoice = {
          id: `pix-${invoiceNumber}`,
          number: invoiceNumber,
          amount: isNaN(amount) ? undefined : amount,
          client: clientName || undefined,
          project: projectName || undefined,
          status: status,
          dueDate: dueDate || undefined,
          createdDate: createdDate || undefined,
        };

        invoices.push(invoice);
      } catch (err) {
        console.error('Error parsing row:', err);
      }
    });

    return invoices.length > 0 ? invoices : null;
  }

  // Send to dopamine-app
  async function sendToDopamineApp(invoices) {
    try {
      const response = await fetch('https://dopamine-app.pages.dev/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invoices),
      });

      if (!response.ok) {
        console.warn('Dopamine app sync returned non-200 status:', response.status);
      }
    } catch (err) {
      console.error('Error sending to dopamine-app:', err);
    }
  }

  // Send to command-centre (legacy)
  async function sendToCommandCentre(invoices) {
    try {
      const response = await fetch(
        'https://command-centre-rho.vercel.app/api/sync',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: 'pixieset-invoices',
            value: invoices,
          }),
        }
      );

      if (!response.ok) {
        console.warn('Command centre sync returned non-200 status:', response.status);
      }
    } catch (err) {
      console.error('Error sending to command-centre:', err);
    }
  }

  // Main execution
  async function run() {
    showNotification('Scraping invoices...');

    const invoices = scrapeInvoices();
    if (!invoices) {
      return;
    }

    showNotification(`Found ${invoices.length} invoice(s). Syncing...`);

    // Send to both APIs in parallel
    await Promise.all([
      sendToDopamineApp(invoices),
      sendToCommandCentre(invoices),
    ]);

    showNotification(`Successfully synced ${invoices.length} invoice(s)!`);
  }

  run();
})();
