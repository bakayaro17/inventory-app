import type { OutboundShipment, ShipmentLine } from './types'

function summary(items: ShipmentLine[]): string {
  return items
    .filter((l) => l.item_name?.trim())
    .map((l) => (l.quantity > 1 ? `${l.item_name} (×${l.quantity})` : l.item_name))
    .join(', ')
}

const esc = (s: string) =>
  s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c] as string))

const prettyDate = (iso: string) =>
  new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })

/** Build a clean, printable HTML document for one day's shipments. */
export function buildShipmentsHtml(date: string, shipments: OutboundShipment[]): string {
  const rows = shipments
    .map(
      (o) => `
        <tr>
          <td class="items">${esc(summary(o.items))}</td>
          <td class="shipto">${esc(o.ship_to || '')}</td>
          <td class="initials">${esc(o.initials || '')}</td>
        </tr>`
    )
    .join('')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>Shipments ${esc(date)}</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; margin: 48px; }
  h1 { font-size: 18px; margin: 0 0 24px; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 14px; padding: 6px 12px 10px; border-bottom: 1px solid #111; }
  td { font-size: 14px; padding: 10px 12px; vertical-align: top; }
  .items { width: 60%; }
  .shipto { width: 28%; }
  .initials { width: 12%; }
  tbody tr { border-bottom: 1px solid #eee; }
  @media print { body { margin: 24px; } }
</style>
</head>
<body>
  <h1>Shipments — ${esc(prettyDate(date))}</h1>
  <table>
    <thead>
      <tr><th>Items</th><th>Ship To</th><th>Initials</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</body>
</html>`
}

/**
 * Open a day's shipments in a hidden frame and trigger the print dialog, where
 * it can be saved as PDF or sent to a printer. (Direct email-to-Epson is a
 * separate, configurable step — see emailShipments wiring.)
 */
export function printShipments(date: string, shipments: OutboundShipment[]): void {
  if (shipments.length === 0) return
  const html = buildShipmentsHtml(date, shipments)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.right = '0'
  iframe.style.bottom = '0'
  iframe.style.width = '0'
  iframe.style.height = '0'
  iframe.style.border = '0'
  document.body.appendChild(iframe)
  const doc = iframe.contentWindow?.document
  if (!doc) return
  doc.open()
  doc.write(html)
  doc.close()
  iframe.onload = () => {
    iframe.contentWindow?.focus()
    iframe.contentWindow?.print()
    setTimeout(() => document.body.removeChild(iframe), 1000)
  }
}
