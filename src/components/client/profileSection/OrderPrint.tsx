'use client';

import { PrinterIcon } from '@heroicons/react/24/outline';
import { formatPrice } from '@/utils/format';

interface OrderItem {
  productId: number;
  name: string;
  image: string;
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: number;
  total: number;
  status: 'pending' | 'confirmed' | 'delivered' | 'canceled';
  createdAt: string;
  items: OrderItem[];
}

export default function OrderPrint({ order }: { order: Order }) {
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the invoice');
      return;
    }

    // Helper: convert relative path to absolute URL
    const getAbsoluteUrl = (url: string) => {
      if (!url) return `${window.location.origin}/placeholder-product.png`;
      if (url.startsWith('http')) return url;
      if (url.startsWith('/')) return `${window.location.origin}${url}`;
      return `${window.location.origin}/${url}`;
    };

    const safeFormatPrice = (price: number) => {
      if (price === undefined || price === null) return '0.00 MAD';
      return formatPrice(price);
    };

    const escapeHtml = (str: string) => {
      return str.replace(/[&<>]/g, (m) => {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
      });
    };

    // Build table rows HTML
    const itemsRows = order.items
      .map(
        (item) => `
      <tr>
        <td class="py-3 px-4">
          <div class="flex items-center gap-3">
            <div class="relative w-10 h-10 rounded-lg overflow-hidden bg-slate-100 shadow-sm">
              <img src="${getAbsoluteUrl(item.image)}" alt="${escapeHtml(item.name)}" style="width:100%;height:100%;object-fit:cover" />
            </div>
            <span class="font-medium text-slate-800">${escapeHtml(item.name)}</span>
          </div>
        </td>
        <td class="text-center py-3 px-2 text-slate-600">${item.quantity}</td>
        <td class="text-right py-3 px-4 text-slate-600">${safeFormatPrice(item.priceAtPurchase)}</td>
        <td class="text-right py-3 px-4 font-semibold text-slate-800">${safeFormatPrice(item.priceAtPurchase * item.quantity)}</td>
      </tr>
    `
      )
      .join('');

    const html = `<!DOCTYPE html>
      <html>
        <head>
          <title>Fleur Marwa - Invoice #${order.id}</title>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
              background: linear-gradient(135deg, #fef9f0 0%, #ffffff 100%);
              padding: 2rem;
            }
            .invoice-container { 
              max-width: 56rem; 
              margin: 0 auto; 
              background: white;
              border-radius: 2rem;
              box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
              overflow: hidden;
              backdrop-filter: blur(2px);
            }
            .text-center { text-align: center; }
            .border-b { border-bottom: 1px solid #fef3c7; }
            .pb-6 { padding-bottom: 1.5rem; }
            .mb-8 { margin-bottom: 2rem; }
            .flex { display: flex; }
            .justify-center { justify-content: center; }
            .mb-4 { margin-bottom: 1rem; }
            .w-16 { width: 4rem; }
            .h-16 { height: 4rem; }
            .rounded-full { border-radius: 9999px; }
            .bg-gradient-to-br { background: linear-gradient(135deg, #f59e0b, #d97706); }
            .shadow-md { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
            .text-white { color: white; }
            .font-serif { font-family: 'Playfair Display', Georgia, 'Times New Roman', serif; }
            .text-2xl { font-size: 1.5rem; font-weight: 700; }
            .text-3xl { font-size: 1.875rem; font-weight: 300; }
            .tracking-tight { letter-spacing: -0.025em; }
            .text-slate-800 { color: #1e293b; }
            .w-12 { width: 3rem; }
            .h-px { height: 1px; }
            .bg-gradient-to-r { background: linear-gradient(90deg, #fbbf24, transparent); }
            .mt-2 { margin-top: 0.5rem; }
            .text-xs { font-size: 0.75rem; }
            .text-slate-400 { color: #94a3b8; }
            .uppercase { text-transform: uppercase; }
            .tracking-wider { letter-spacing: 0.05em; }
            .grid { display: grid; }
            .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .gap-4 { gap: 1rem; }
            .mb-10 { margin-bottom: 2.5rem; }
            .p-5 { padding: 1.25rem; }
            .bg-amber-50/40 { background-color: #fffbeb; }
            .rounded-2xl { border-radius: 1rem; }
            .border { border: 1px solid #fef3c7; }
            .space-y-1 > * + * { margin-top: 0.25rem; }
            .text-\\[10px\\] { font-size: 0.625rem; }
            .font-semibold { font-weight: 600; }
            .font-mono { font-family: monospace; }
            .font-medium { font-weight: 500; }
            .text-slate-700 { color: #334155; }
            .capitalize { text-transform: capitalize; }
            .text-emerald-600 { color: #059669; }
            .text-blue-600 { color: #2563eb; }
            .text-amber-600 { color: #d97706; }
            .text-sm { font-size: 0.875rem; }
            .border-l-2 { border-left: 2px solid #f59e0b; }
            .pl-3 { padding-left: 0.75rem; }
            .overflow-hidden { overflow: hidden; }
            .rounded-xl { border-radius: 0.75rem; }
            .w-full { width: 100%; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .py-3 { padding: 0.75rem 0; }
            .px-4 { padding-left: 1rem; padding-right: 1rem; }
            .divide-y > * + * { border-top: 1px solid #fef3c7; }
            .relative { position: relative; }
            .w-10 { width: 2.5rem; }
            .h-10 { height: 2.5rem; }
            .bg-slate-100 { background-color: #f1f5f9; }
            .shadow-sm { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05); }
            .object-cover { object-fit: cover; }
            .border-t-2 { border-top: 2px solid #e2e8f0; }
            .text-base { font-size: 1rem; }
            .text-xl { font-size: 1.25rem; }
            .pt-6 { padding-top: 1.5rem; }
            .mt-8 { margin-top: 2rem; }
            .mt-1 { margin-top: 0.25rem; }
            .italic { font-style: italic; }
            .bg-white\/80 { background-color: rgba(255,255,255,0.8); }
            .backdrop-blur-sm { backdrop-filter: blur(4px); }
            .shadow-inner { box-shadow: inset 0 1px 2px 0 rgba(0,0,0,0.05); }
            @media print {
              body { background: white; padding: 0; }
              .invoice-container { box-shadow: none; border-radius: 0; }
            }
          </style>
          <!-- Load Google Fonts for elegance -->
          <link href="https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300;14..32,400;14..32,500;14..32,600;14..32,700&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&display=swap" rel="stylesheet">
        </head>
        <body>
          <div class="invoice-container bg-white/80 backdrop-blur-sm shadow-inner">
            <!-- Header with Fleur Marwa branding -->
            <div class="text-center border-b border-amber-100 pb-6 mb-8 pt-8">
              <div class="flex justify-center mb-4">
                <div class="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-amber-100 to-amber-200 shadow-md ring-2 ring-amber-200/30">
                  <img src="${getAbsoluteUrl('/photos/image.png')}" alt="Fleur Marwa" style="width:100%;height:100%;object-fit:cover" />
                </div>
              </div>
              <h1 class="font-serif italic font-bold text-3xl tracking-tight bg-gradient-to-r from-amber-700 to-amber-500 bg-clip-text text-transparent">
                Fleur Marwa
              </h1>
              <div class="w-12 h-px bg-gradient-to-r from-amber-400 to-transparent mx-auto mt-2" />
            </div>

            <!-- Order Info Cards (glass style) -->
            <div class="grid grid-cols-2 gap-4 mb-10 px-6">
              <div class="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-1">
                <p class="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Order number</p>
                <p class="font-mono font-semibold text-slate-800">#${order.id}</p>
              </div>
              <div class="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-1">
                <p class="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Date</p>
                <p class="font-medium text-slate-700">${new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              </div>
              <div class="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-1">
                <p class="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Status</p>
                <p class="font-medium capitalize ${order.status === 'delivered' ? 'text-emerald-600' : order.status === 'confirmed' ? 'text-blue-600' : 'text-amber-600'}">${order.status}</p>
              </div>
              <div class="p-4 bg-amber-50/40 rounded-2xl border border-amber-100/60 space-y-1">
                <p class="text-[10px] text-amber-600 uppercase tracking-wider font-semibold">Delivery</p>
                <p class="font-medium text-slate-700">Express (24‑48h)</p>
              </div>
            </div>

            <!-- Items Table -->
            <div class="px-6 mb-8">
              <h3 class="text-sm font-semibold text-slate-700 mb-4 border-l-2 border-amber-500 pl-3">Order details</h3>
              <div class="overflow-hidden rounded-xl border border-amber-100 bg-white">
                <table class="w-full text-sm">
                  <thead class="bg-amber-50/60">
                    <tr>
                      <th class="text-left py-3 px-4 font-semibold text-amber-800">Product</th>
                      <th class="text-center py-3 px-2 font-semibold text-amber-800 w-16">Qty</th>
                      <th class="text-right py-3 px-4 font-semibold text-amber-800 w-28">Unit price</th>
                      <th class="text-right py-3 px-4 font-semibold text-amber-800 w-28">Total</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-amber-50">
                    ${itemsRows}
                  </tbody>
                  <tfoot class="bg-amber-50/40 border-t-2 border-amber-200">
                    <tr>
                      <td colspan="3" class="text-right py-4 px-4 text-base font-semibold text-slate-700">Total</td>
                      <td class="text-right py-4 px-4 text-xl font-bold text-amber-600">${safeFormatPrice(order.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            <!-- Footer with brand message -->
            <div class="text-center text-xs text-amber-600/70 border-t border-amber-100 pt-6 pb-8 px-6">
              <p class="font-serif italic">Fleur Marwa – 123 Rue des Roses, Marrakech 40000, Morocco – contact@fleurmarwa.com</p>
              <p class="mt-1 text-amber-500">Thank you for choosing Fleur Marwa – Nature’s elegance delivered.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();

    // Wait for all images to load before printing
    const images = printWindow.document.querySelectorAll('img');
    let imagesLoaded = 0;
    if (images.length === 0) {
      printWindow.print();
      return;
    }

    const onImageLoad = () => {
      imagesLoaded++;
      if (imagesLoaded === images.length) {
        printWindow.print();
      }
    };

    images.forEach((img) => {
      if (img.complete) {
        onImageLoad();
      } else {
        img.addEventListener('load', onImageLoad);
        img.addEventListener('error', onImageLoad);
      }
    });
  };

  return (
    <button
      onClick={handlePrint}
      className="p-2 text-slate-400 hover:text-amber-600 transition-colors duration-200 rounded-full hover:bg-amber-50/50"
      title="Print invoice"
    >
      <PrinterIcon className="w-5 h-5" />
    </button>
  );
}