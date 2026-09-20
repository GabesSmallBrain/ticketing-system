import { clubAsset } from '/assets/clubs/manifest.js';

const app = document.querySelector('#app');
let role = '';
let cart = JSON.parse(sessionStorage.getItem('ndb-cart') || '{}');
const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });
const when = (value) => new Intl.DateTimeFormat('sl-SI', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(value));
const node = (tag, attrs = {}, ...children) => { const result = document.createElement(tag); for (const [key, value] of Object.entries(attrs)) { if (key === 'class') result.className = value; else if (key === 'text') result.textContent = value; else if (key.startsWith('on')) result.addEventListener(key.slice(2).toLowerCase(), value); else result.setAttribute(key, value); } result.append(...children.flat().filter(Boolean).map((child) => typeof child === 'string' ? document.createTextNode(child) : child)); return result; };
const button = (text, kind, click) => node('button', { class: kind, onClick: click, text });
const link = (text, href, kind = 'primary') => node('a', { href }, button(text, kind));
const api = async (path, options = {}) => { const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...options.headers } }); const data = await response.json(); if (!response.ok) throw Error(data.error || 'Povezava s strežnikom ni uspela.'); return data; };
const toast = (message, kind = 'success') => { const item = node('div', { class: `toast ${kind}`, role: 'status', text: message }); document.body.append(item); setTimeout(() => item.remove(), 4200); };
const confirmDialog = ({ title, description, confirmText, onConfirm }) => { const cancel = button('PREKLIČI', 'muted', () => portal.remove()); const confirm = button(confirmText, 'danger', async () => { confirm.disabled = true; confirm.textContent = 'SHRANJUJEM …'; try { await onConfirm(); portal.remove(); } catch (error) { confirm.disabled = false; confirm.textContent = confirmText; descriptionNode.textContent = error.message || 'Sprememb ni bilo mogoče shraniti.'; } }); const descriptionNode = node('p', { text: description }); const portal = node('div', { class: 'dialog-portal', role: 'presentation' }, node('div', { class: 'dialog-overlay', onClick: () => portal.remove() }), node('section', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' }, node('h2', { id: 'dialog-title', text: title }), descriptionNode, node('div', { class: 'dialog-actions' }, cancel, confirm))); document.body.append(portal); requestAnimationFrame(() => confirm.focus()); };
const destinationForRole = (value) => value === 'club_admin' ? '/admin' : value === 'box_office' ? '/admin/blagajna' : '/scanner';
const logout = async () => { try { await api('/api/logout', { method: 'POST' }); } finally { role = ''; location.assign('/prijava-za-osebje'); } };
const orderToken = (id) => sessionStorage.getItem(`ndb-order-${id}`) || '';
function shell(...content) { const staffLinks = role === 'club_admin' ? [['Pregled', '/admin'], ['Tekme', '/admin/tekme'], ['Blagajna', '/admin/blagajna'], ['Vstopnice', '/admin/vstopnice'], ['Poročila', '/admin/porocila']] : role === 'box_office' ? [['Blagajna', '/admin/blagajna'], ['Današnja prodaja', '/admin/blagajna']] : role === 'gate_staff' ? [['Skener', '/scanner']] : [['Domov', '/'], ['Vstopnice', '/vstopnice'], ['Sezonske', '/sezonske']]; const home = role === 'club_admin' ? '/admin' : role === 'box_office' ? '/admin/blagajna' : role === 'gate_staff' ? '/scanner' : '/'; const nav = node('nav', { class: 'nav' }, node('a', { class: 'brand', href: home }, node('span', { class: 'crest', text: 'NDB' }), node('span', { text: 'ND BELTINCI' }, node('br'), node('small', { text: role ? 'OSEBJE' : 'VSTOPNICE' }))), node('div', { class: 'links' }, staffLinks.map(([label, href]) => node('a', { class: location.pathname === href ? 'active' : '', href, text: label }))), role ? button('ODJAVA', 'switch-role', logout) : '', node('span', { class: 'demo', text: 'Demonstracijski sistem' })); app.replaceChildren(nav, node('main', { class: 'wrap' }, content)); }
function fail(error) { shell(node('section', { class: 'card' }, node('h1', { text: 'Nekaj ni uspelo' }), node('p', { text: error.message || 'Poskusite znova.' }), link('PRIJAVA', '/prijava-za-osebje', 'primary'), document.createTextNode(' '), link('NAZAJ', '/', 'muted'))); }
async function home() {
  const { events, ticketTypes } = await api('/api/events');
  const next = events[0];
  const remaining = (event) => ticketTypes.filter((type) => type.eventId === event.id && type.active).reduce((sum, type) => sum + Math.max(0, type.capacity - type.sold), 0);
  const cards = events.map((event) => node('article', { class: 'public-home-card' },
    node('span', { text: event.competition.toUpperCase() }),
    node('h3', { text: `ND BELTINCI — ${event.opponent.toUpperCase()}` }),
    node('p', { text: `${when(event.kickoff)} · ${event.venue}` }),
    node('div', {}, node('b', { text: `${remaining(event)} PROSTIH MEST` }), link('IZBERI', `/vstopnice/${event.slug}`, 'secondary'))
  ));
  shell(node('section', { class: 'public-home' },
    node('div', { class: 'public-home-kicker', text: 'DOMAČA TEKMA · VSTOPNICE' }),
    node('div', { class: 'public-home-hero' },
      node('div', { class: 'public-home-copy' },
        node('span', { text: next.competition.toUpperCase() }),
        node('h1', { text: 'ND BELTINCI ' }, node('em', { text: 'VS' }), ` ${next.opponent.toUpperCase()}`),
        node('p', { text: `${when(next.kickoff)} · ${next.venue}` }),
        node('div', { class: 'public-home-hero-actions' }, link('KUPI VSTOPNICE', `/vstopnice/${next.slug}`, 'primary'), link('VSE TEKME', '#upcoming', 'muted'))
      ),
      node('div', { class: 'public-home-countdown' }, node('span', { text: 'NASLEDNJA DOMAČA TEKMA' }), node('strong', { text: String(remaining(next)) }), node('small', { text: 'VSTOPNIC ŠE NA VOLJO' }))
    ),
    node('section', { id: 'upcoming', class: 'public-home-upcoming' },
      node('div', { class: 'public-home-section-title' }, node('div', {}, node('span', { text: 'RAZPORED' }), node('h2', { text: 'PRIHAJAJOČE TEKME' })), node('p', { text: 'Izberite tekmo in varno kupite digitalne vstopnice.' })),
      node('div', { class: 'public-home-grid' }, cards)
    ),
    node('section', { class: 'public-home-info' }, node('strong', { text: 'DIGITALNA VSTOPNICA' }), node('p', { text: 'Po potrjenem plačilu QR vstopnico prejmete takoj. Ob vhodu jo pokažite na zaslonu telefona.' }))
  ));
}
async function ticketShop() { const { events, ticketTypes } = await api('/api/events'); const remaining = (event) => ticketTypes.filter((type) => type.eventId === event.id && type.active).reduce((sum, type) => sum + Math.max(0, type.capacity - type.sold), 0); const eventCount = events.length; shell(node('section', { class: 'ticket-shop' }, node('header', { class: 'ticket-shop-heading' }, node('div', {}, node('span', { text: 'ND BELTINCI · DOMAČE TEKME' }), node('h1', { text: 'VSTOPNICE' }), node('p', { text: 'Izberite domačo tekmo in si zagotovite digitalno vstopnico.' })), node('aside', { class: 'ticket-shop-assurance' }, node('strong', { text: 'VARNA DIGITALNA VSTOPNICA' }), node('span', { text: 'QR kodo prejmete po potrjenem plačilu.' }))), node('div', { class: 'ticket-shop-summary' }, node('span', { text: 'RAZPORED' }), node('strong', { text: `${eventCount} ${eventCount === 1 ? 'TEKMA' : 'TEKME'}` }), node('small', { text: 'V PRODAJI' })), node('div', { class: 'ticket-shop-list' }, events.map((event, index) => node('article', { class: 'ticket-shop-match' }, node('div', { class: 'ticket-shop-date' }, node('span', { text: new Intl.DateTimeFormat('sl-SI', { day: '2-digit', month: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(event.kickoff)).toUpperCase() }), node('b', { text: new Intl.DateTimeFormat('sl-SI', { weekday: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(event.kickoff)).toUpperCase() })), node('div', { class: 'ticket-shop-fixture' }, node('span', { text: event.competition.toUpperCase() }), node('h2', { text: `ND BELTINCI — ${event.opponent.toUpperCase()}` }), node('p', { text: `${when(event.kickoff)} · ${event.venue}` })), node('div', { class: 'ticket-shop-availability' }, node('b', { text: String(remaining(event)) }), node('span', { text: 'PROSTIH MEST' })), link(index === 0 ? 'KUPI ZDAJ' : 'IZBERI TEKMO', `/vstopnice/${event.slug}`, 'secondary')))))); }
async function eventPage(slug) { const { event, ticketTypes } = await api(`/api/events/${slug}`); cart = cart.eventId === event.id ? cart : { eventId: event.id, items: {} }; const draw = () => { const chosen = ticketTypes.map((type) => ({ ...type, q: cart.items[type.id] || 0 })); const total = chosen.reduce((sum, type) => sum + type.q * type.price, 0); const types = chosen.map((type) => { const change = (delta) => { const next = type.q + delta; if (next >= 0 && next <= Math.min(10, type.capacity - type.sold)) cart.items[type.id] = next; sessionStorage.setItem('ndb-cart', JSON.stringify(cart)); draw(); }; return node('div', { class: 'type' }, node('div', {}, node('strong', { text: `${type.section} — ${type.name}` }), node('div', { class: 'meta', text: `${type.capacity - type.sold} prostih mest · ${money.format(type.price)}` })), node('div', { class: 'counter' }, button('−', 'muted', () => change(-1)), node('strong', { text: String(type.q) }), button('+', 'muted', () => change(1)))); }); const summary = node('aside', { class: 'card sticky' }, node('h2', { text: 'Povzetek' }), ...chosen.filter((type) => type.q).map((type) => node('p', { text: `${type.q} × ${type.section} — ${type.name}: ${money.format(type.q * type.price)}` })), node('div', { class: 'total', text: money.format(total) }), total ? link('NADALJUJ NA PLAČILO', '/blagajna') : node('p', { class: 'empty', text: 'Izberite vstopnice.' })); shell(node('div', { class: 'detail' }, node('section', {}, node('div', { class: 'eyebrow', text: event.competition }), node('h1', { text: `ND BELTINCI — ${event.opponent.toUpperCase()}` }), node('p', { class: 'meta', text: `${when(event.kickoff)} · ${event.venue}` }), event.opponent === 'NŠ Mura' ? node('p', { class: 'notice', text: 'Zaradi pričakovanega večjega obiska priporočamo zgodnji prihod.' }) : '', node('article', { class: 'card' }, node('h2', { text: 'Izberi vstopnice' }), node('div', { class: 'types' }, types))), summary)); }; draw(); }
async function checkout() { if (!cart.eventId) return location.assign('/'); const listing = await api('/api/events'); const slug = listing.events.find((event) => event.id === cart.eventId)?.slug; const { event, ticketTypes } = await api(`/api/events/${slug}`); const items = ticketTypes.filter((type) => cart.items[type.id]).map((type) => ({ ...type, quantity: cart.items[type.id] })); const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0); const form = node('form', { class: 'form card' }); [['Ime', 'firstName', 'text', true], ['Priimek', 'lastName', 'text', true], ['E-pošta', 'email', 'email', true], ['Telefon (neobvezno)', 'phone', 'tel', false]].forEach(([label, name, type, required]) => form.append(node('label', {}, label, node('input', { name, type, ...(required ? { required: '' } : {}) })))); form.append(button('Nadaljuj na testno plačilo', 'primary')); form.addEventListener('submit', async (submit) => { submit.preventDefault(); try { const values = Object.fromEntries(new FormData(form)); const result = await api('/api/checkout', { method: 'POST', body: JSON.stringify({ ...values, eventId: event.id, items: items.map((item) => ({ ticketTypeId: item.id, quantity: item.quantity })) }) }); sessionStorage.setItem(`ndb-order-${result.order.id}`, result.order.accessToken); sessionStorage.setItem(`ndb-payment-${result.order.id}`, result.order.paymentSecret); location.assign(`/placilo/${result.order.id}`); } catch (error) { fail(error); } }); shell(node('div', { class: 'detail' }, node('section', {}, node('div', { class: 'eyebrow', text: 'VAREN NAKUP · DEMO' }), node('h1', { text: 'Zaključite naročilo' }), form), node('aside', { class: 'card sticky' }, node('h2', { text: 'Povzetek naročila' }), node('p', { text: `${event.opponent} · ${when(event.kickoff)}` }), ...items.map((item) => node('p', { text: `${item.quantity} × ${item.section} — ${item.name}: ${money.format(item.quantity * item.price)}` })), node('div', { class: 'total', text: money.format(total) }), node('p', { class: 'notice', text: 'TESTNO PLAČILO · Kartični podatki niso potrebni.' })))); }
async function pay(id) { const access = orderToken(id); const { order } = await api(`/api/orders/${id}`, { headers: { 'x-order-access': access } }); const process = async (outcome) => { try { const result = await api('/api/payments/callback', { method: 'POST', headers: { 'x-demo-payment-secret': sessionStorage.getItem(`ndb-payment-${id}`) || '' }, body: JSON.stringify({ orderId: id, outcome, transaction: `demo_${id}` }) }); if (outcome === 'success') { sessionStorage.removeItem('ndb-cart'); location.assign(`/narocilo/${result.order.id}`); } else fail(Error('Plačilo ni uspelo. Poskusite ponovno.')); } catch (error) { fail(error); } }; shell(node('section', { class: 'card narrow' }, node('div', { class: 'eyebrow', text: 'DEMO PAYMENT PROVIDER' }), node('h1', { text: `Plačilo ${money.format(order.amount)}` }), node('p', { text: 'Potrditev sproži strežniški callback; vstopnice se izdajo šele po uspešni potrditvi.' }), button('PLAČILO USPEŠNO', 'primary large', () => process('success')), button('PLAČILO ZAVRNJENO', 'muted large', () => process('failed')))); }
async function orderPage(id) { const { order, tickets } = await api(`/api/orders/${id}`, { headers: { 'x-order-access': orderToken(id) } }); shell(node('div', { class: 'eyebrow', text: 'PLAČILO USPEŠNO' }), node('h1', { text: 'Hvala za nakup.' }), node('p', { text: `Naročilo ${order.reference} smo pripravili za ${order.customer.email}.` }), node('section', { class: 'grid' }, tickets.map((ticket) => node('article', { class: 'card' }, node('h2', { text: `${ticket.type.section} · ${ticket.type.name}` }), node('p', { text: `${ticket.event.opponent} · ${when(ticket.event.kickoff)}` }), link('PRIKAŽI QR', `/vstopnica/${ticket.id}?order=${id}`, 'secondary'))), link('NAZAJ NA VSTOPNICE', '/'))); }
async function ticketPage(id) { const access = orderToken(new URLSearchParams(location.search).get('order')); const [{ qr }, { ticket }] = await Promise.all([api(`/api/tickets/${id}/qr`, { headers: { 'x-order-access': access } }), api(`/api/tickets/${id}`, { headers: { 'x-order-access': access } })]); shell(node('article', { class: 'ticket' }, node('div', { class: 'eyebrow', text: 'ND BELTINCI · VSTOPNICA' }), node('h1', { text: `BELTINCI — ${ticket.event.opponent.toUpperCase()}` }), node('p', { text: `${ticket.type.section} · ${ticket.type.name}` }), node('img', { class: 'qr', src: qr, alt: 'QR koda vstopnice' }), node('p', { class: 'ref', text: ticket.reference }), node('p', { text: `${when(ticket.event.kickoff)} · ${ticket.event.venue}` }), node('p', { text: 'Vstopnica velja za en vstop.' })), button('NATISNI VSTOPNICO', 'muted no-print', () => print())); if (new URLSearchParams(location.search).get('print') === '1') setTimeout(() => print(), 250); }
const scanText = { accepted: ['✓', 'VELJAVNA VSTOPNICA', 'VSTOP DOVOLJEN'], already_used: ['✕', 'ŽE UPORABLJENA', 'VSTOP NI DOVOLJEN'], invalid: ['✕', 'NEVELJAVNA VSTOPNICA', 'VSTOP NI DOVOLJEN'], wrong_event: ['✕', 'NAPAČNA TEKMA', 'VSTOP NI DOVOLJEN'], cancelled: ['✕', 'VSTOPNICA PREKLICANA', 'VSTOP NI DOVOLJEN'], network_error: ['!', 'TEŽAVA S POVEZAVO', 'Veljavnost ni bila preverjena. Preverite povezavo in poskusite znova.'] };
let cameraStream = null;
let cameraFrame = 0;
let cameraResultTimer = 0;
let cameraOnHidden = null;
const stopCamera = () => {
  if (cameraFrame) cancelAnimationFrame(cameraFrame);
  if (cameraResultTimer) clearTimeout(cameraResultTimer);
  cameraFrame = 0;
  cameraResultTimer = 0;
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
};
window.addEventListener('pagehide', stopCamera);
document.addEventListener('visibilitychange', () => { if (document.hidden) { stopCamera(); cameraOnHidden?.(); } });
const parseTicketCredential = (value) => {
  const candidate = typeof value === 'string' ? value.trim() : '';
  return /^ndb_[A-Za-z0-9_-]{32}$/.test(candidate) ? candidate : null;
};
const cameraErrorMessage = (error) => {
  if (!window.isSecureContext) return 'KAMERA ZAHTEVA VARNO POVEZAVO (HTTPS). Uporabite ročni vnos kode.';
  if (error?.name === 'NotAllowedError') return 'DOSTOP DO KAMERE NI DOVOLJEN. Dovolite kamero v nastavitvah brskalnika in poskusite znova.';
  if (error?.name === 'SecurityError') return 'VARNOSTNA POLITIKA JE PREPREČILA DOSTOP DO KAMERE. Preverite HTTPS in dovoljenje kamere.';
  if (error?.name === 'NotFoundError') return 'KAMERE NI MOGOČE NAJTI. Uporabite ročni vnos kode.';
  if (error?.name === 'NotReadableError') return 'KAMERA JE TRENUTNO ZASEDENA ALI NEDOSTOPNA. Zaprite drugo aplikacijo in poskusite znova.';
  if (error?.name === 'OverconstrainedError') return 'IZBRANE KAMERE NI MOGOČE UPORABITI. Poskusite znova ali uporabite ročni vnos.';
  if (error?.name === 'AbortError') return 'ZAGON KAMERE JE BIL PREKINJEN. Poskusite znova.';
  return 'KAMERE NI BILO MOGOČE ZAGNATI. Poskusite znova ali uporabite ročni vnos.';
};
async function cameraScanner() {
  document.body.classList.add('reference-scanner');
  const actor = await api('/api/session');
  if (!actor.authenticated || !['gate_staff', 'club_admin'].includes(actor.role)) throw Error('Nimate potrebnih pravic. Prijavite se prek demo dostopa.');
  const { events } = await api('/api/events');
  let selectedEvent = events[0];
  const setup = () => {
    stopCamera();
    cameraOnHidden = null;
    const match = node('select', {}, events.map((item) => node('option', { value: item.id, text: `Beltinci — ${item.opponent}` })));
    match.value = selectedEvent.id;
    match.addEventListener('change', () => { selectedEvent = events.find((item) => item.id === match.value) || selectedEvent; });
    const start = button('ZAČNI SKENIRANJE', 'primary start-scan', () => active(true));
    shell(node('section', { class: 'scanner-setup' }, node('div', { class: 'eyebrow', text: 'SKENIRANJE VSTOPNIC' }), node('h1', { text: 'Priprava skenerja' }), node('p', { class: 'scanner-setup-copy', text: 'Izberite tekmo za neprekinjeno skeniranje vstopnic.' }), node('label', { class: 'setup-label' }, 'TEKMA', match), node('p', { class: 'scanner-selected-match', text: `${when(selectedEvent.kickoff)} · ${selectedEvent.venue}` }), start));
  };
  const active = (startImmediately = false) => {
    stopCamera();
    let state = 'idle';
    let ignoredCredential = '';
    let ignoreUntil = 0;
    let activeDetector = null;
    let resumeDecoding = () => {};
    const output = node('div', { class: 'scanner-result' });
    const message = node('p', { class: 'camera-message', text: 'Pripravite kamero za skeniranje QR kode.' });
    const video = node('video', { class: 'camera-preview', autoplay: '', muted: '', playsinline: '' });
    video.autoplay = true; video.muted = true; video.playsInline = true;
    const canvas = document.createElement('canvas');
    const manualCode = node('input', { required: '', placeholder: 'ndb_…', autocomplete: 'off' });
    const manual = node('form', { class: 'scan-entry manual-entry', hidden: '' }, node('label', {}, 'KODA VSTOPNICE', manualCode), button('PREVERI', 'primary large'));
    const manualToggle = button('ROČNI VNOS KODE', 'muted', () => { manual.hidden = !manual.hidden; if (!manual.hidden) manualCode.focus(); });
    const cameraButton = button('OMOGOČI KAMERO', 'primary large', () => startCamera());
    let resultModal = null;
    const pauseDecoding = () => { if (cameraFrame) cancelAnimationFrame(cameraFrame); cameraFrame = 0; };
    const mountAlertDialog = (kind, content) => {
      const overlay = node('div', { class: 'scanner-alert-overlay', 'aria-hidden': 'true' });
      const portal = node('div', { class: `scanner-alert-portal ${kind}`, 'data-alert-dialog-portal': '' }, overlay, content);
      document.body.append(portal);
      app.inert = true;
      // Admission is a deliberate lock: keep keyboard focus inside the body portal
      // until the steward explicitly confirms the result.
      const dialog = content.matches?.('[role="alertdialog"]') ? content : content.querySelector?.('[role="alertdialog"]');
      dialog?.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') { event.preventDefault(); return; }
        if (event.key !== 'Tab') return;
        const focusable = [...dialog.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])')];
        if (!focusable.length) return event.preventDefault();
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      });
      return portal;
    };
    const showResultModal = (result, credentialValue) => {
      const copy = scanText[result.result] || scanText.invalid;
      const admission = result.ticket?.admissions?.[0];
      const extra = result.result === 'already_used' && admission ? `Prvi vstop: ${new Date(admission.scannedAt).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })}${admission.gate ? ` · ${admission.gate}` : ''}` : '';
      const kind = result.result === 'accepted' ? 'accepted' : result.result === 'network_error' ? 'network_error' : 'rejected';
      const continueScanning = () => { resultModal?.remove(); resultModal = null; app.inert = false; ignoredCredential = credentialValue; ignoreUntil = Date.now() + 1800; state = cameraStream ? 'scanning' : 'idle'; message.textContent = cameraStream ? 'POSTAVITE QR KODO V OKVIR.' : 'Kamera ni aktivna. Uporabite ročni vnos ali znova zaženite kamero.'; if (cameraStream) resumeDecoding(); else manualCode.focus(); };
      const retry = () => { resultModal?.remove(); resultModal = null; state = 'qr_detected'; void validate(credentialValue); };
      const description = result.result === 'accepted' ? 'Vstopnica je bila uspešno potrjena.' : result.result === 'already_used' ? 'Vstopnica je že bila uporabljena.' : result.result === 'cancelled' ? 'Vstopnica je preklicana.' : result.result === 'wrong_event' ? 'Vstopnica pripada drugi tekmi.' : result.result === 'invalid' ? 'Kode ni mogoče povezati z veljavno vstopnico.' : copy[2];
      const confirmation = button(result.result === 'network_error' ? 'ZAPRI' : 'POTRDI', 'scanner-result-continue', continueScanning);
      resultModal = mountAlertDialog(kind, node('section', { class: 'scanner-result-modal alert-dialog-content', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'scanner-result-title', 'aria-describedby': 'scanner-result-description' }, node('div', { class: 'scanner-result-panel' }, node('div', { class: 'scanner-result-icon', 'aria-hidden': 'true', text: copy[0] }), node('header', { class: 'alert-dialog-header' }, node('h1', { id: 'scanner-result-title', text: copy[1] }), node('h2', { text: copy[2] }), node('p', { id: 'scanner-result-description', class: 'scanner-result-detail', text: description }), result.ticket?.type ? node('p', { class: 'scanner-result-ticket', text: `${result.ticket.type.section} · ${result.ticket.type.name}` }) : '', node('p', { class: 'scanner-result-context', text: `ND Beltinci — ${selectedEvent.opponent} · ${when(selectedEvent.kickoff)}` }), extra ? node('p', { class: 'scanner-result-extra', text: extra }) : ''), node('footer', { class: 'scanner-result-actions alert-dialog-footer' }, result.result === 'network_error' ? button('POSKUSI ZNOVA', 'scanner-result-retry', retry) : '', confirmation))));
      requestAnimationFrame(() => confirmation.focus());
      if (result.result === 'accepted' && navigator.vibrate) navigator.vibrate(100);
      if (result.result !== 'accepted' && navigator.vibrate) navigator.vibrate([70, 60, 70]);
    };
    const showValidatingModal = () => { resultModal = mountAlertDialog('validating', node('section', { class: 'scanner-result-modal alert-dialog-content', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'scanner-result-title', 'aria-describedby': 'scanner-result-description' }, node('div', { class: 'scanner-result-panel' }, node('div', { class: 'scanner-result-icon', 'aria-hidden': 'true', text: '…' }), node('header', { class: 'alert-dialog-header' }, node('h1', { id: 'scanner-result-title', text: 'PREVERJAM VSTOPNICO …' }), node('p', { id: 'scanner-result-description', class: 'scanner-result-detail', text: 'Prosimo, počakajte.' }))))); };
    const validate = async (rawCredential) => {
      const credentialValue = parseTicketCredential(rawCredential);
      if (!credentialValue || !['scanning', 'qr_detected', 'idle'].includes(state)) return;
      state = 'validating'; pauseDecoding(); message.textContent = 'PREVERJAM VSTOPNICO …'; showValidatingModal();
      let result;
      try { result = await api('/api/scans', { method: 'POST', body: JSON.stringify({ eventId: selectedEvent.id, credential: credentialValue }) }); }
      catch { result = { result: 'network_error' }; }
      resultModal?.remove(); resultModal = null;
      state = 'result_modal'; showResultModal(result, credentialValue);
    };
    const decodeFrame = async (detector) => {
      if (state !== 'scanning' || !cameraStream) return;
      try {
        let value = '';
        if (detector) {
          const codes = await detector.detect(video);
          value = codes[0]?.rawValue || '';
        } else if (window.jsQR && video.videoWidth && video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (context) {
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            const image = context.getImageData(0, 0, canvas.width, canvas.height);
            value = window.jsQR(image.data, image.width, image.height, { inversionAttempts: 'dontInvert' })?.data || '';
          }
        }
        const credentialValue = parseTicketCredential(value);
        if (credentialValue && !(credentialValue === ignoredCredential && Date.now() < ignoreUntil)) { state = 'qr_detected'; void validate(credentialValue); }
      } catch {
        message.textContent = 'QR kode trenutno ni mogoče prebrati. Poskusite znova ali uporabite ročni vnos.';
      } finally {
        if (cameraStream && state === 'scanning') cameraFrame = requestAnimationFrame(() => decodeFrame(detector));
      }
    };
    resumeDecoding = () => { if (cameraStream && state === 'scanning') decodeFrame(activeDetector); };
    const startCamera = async () => {
      if (!window.isSecureContext) { message.textContent = cameraErrorMessage(); return; }
      if (!navigator.mediaDevices?.getUserMedia) { message.textContent = 'Skeniranje s kamero v tem brskalniku ni na voljo. Uporabite ročni vnos kode.'; return; }
      cameraButton.disabled = true;
      cameraButton.textContent = 'ZAGANJAM KAMERO …';
      message.textContent = 'ZAGANJAM KAMERO … Prosimo, dovolite dostop do kamere.';
      try {
        try { cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false }); }
        catch (error) { if (error?.name !== 'OverconstrainedError') throw error; cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false }); }
        video.srcObject = cameraStream;
        await video.play();
        if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) await new Promise((resolve) => { const timeout = window.setTimeout(resolve, 600); video.addEventListener('loadeddata', () => { clearTimeout(timeout); resolve(undefined); }, { once: true }); });
        activeDetector = window.BarcodeDetector ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null;
        if (!activeDetector && !window.jsQR) throw new Error('decoder_unavailable');
        state = 'scanning';
        cameraButton.textContent = 'KAMERA AKTIVNA';
        message.textContent = 'POSTAVITE QR KODO V OKVIR.';
        resumeDecoding();
      } catch (error) {
        stopCamera();
        cameraButton.disabled = false;
        cameraButton.textContent = 'ZNOVA POSKUSI KAMERO';
        message.textContent = error?.message === 'decoder_unavailable' ? 'QR skener v tem brskalniku ni na voljo. Uporabite ročni vnos kode.' : cameraErrorMessage(error);
      }
    };
    cameraOnHidden = () => { state = 'idle'; cameraButton.disabled = false; cameraButton.textContent = 'ZNOVA ZAŽENI KAMERO'; message.textContent = 'Kamera je bila ustavljena, ker aplikacija ni bila v ospredju.'; };
    manual.addEventListener('submit', (event) => { event.preventDefault(); validate(manualCode.value); });
    shell(node('section', { class: 'scanner-active' }, node('div', { class: 'scanner-topline' }, node('div', { class: 'scanner-match-context' }, node('span', { class: 'scanner-match-label', text: 'IZBRANA TEKMA' }), node('strong', { text: `BELTINCI — ${selectedEvent.opponent.toUpperCase()}` }), node('span', { class: 'scanner-match-date', text: when(selectedEvent.kickoff) })), button('SPREMENI TEKMO', 'muted', setup), node('div', { class: 'scanner-session-status' }, node('span', { text: 'SKENER PRIPRAVLJEN ZA PREVERJANJE' }))), node('section', { class: 'camera-zone' }, video, node('div', { class: 'camera-frame', 'aria-hidden': 'true' }), node('div', { class: 'camera-copy' }, node('h1', { text: 'SKENIRAJ VSTOPNICO' }), node('p', { class: 'camera-caption', text: 'Usmerite QR kodo v okvir.' }))), message, node('div', { class: 'scanner-actions' }, cameraButton, manualToggle), manual, output));
    document.querySelector('.nav')?.append(node('div', { class: 'scanner-live-status' }, node('span', { text: '● POVEZAN' }), node('small', { text: actor.role === 'gate_staff' ? 'VARNOSTNIK' : 'ADMINISTRATOR' })));
    if (startImmediately) void startCamera();
  };
  setup();
}
async function login() {
  const session = await api('/api/session');
  if (session.authenticated) return location.assign(destinationForRole(session.role));
  const email = node('input', { id: 'staff-email', name: 'email', type: 'email', autocomplete: 'username', required: '', placeholder: 'ime@ndbeltinci.si' });
  const password = node('input', { id: 'staff-password', name: 'password', type: 'password', autocomplete: 'current-password', required: '', placeholder: '••••••••••••' });
  const feedback = node('p', { class: 'staff-login-feedback', role: 'alert', 'aria-live': 'polite' });
  const visibility = button('POKAŽI', 'staff-password-toggle', () => { const hidden = password.type === 'password'; password.type = hidden ? 'text' : 'password'; visibility.textContent = hidden ? 'SKRIJ' : 'POKAŽI'; visibility.setAttribute('aria-label', hidden ? 'Skrij geslo' : 'Pokaži geslo'); });
  visibility.type = 'button'; visibility.setAttribute('aria-label', 'Pokaži geslo');
  const submit = button('PRIJAVA', 'primary staff-login-submit');
  const form = node('form', { class: 'staff-login-form' }, node('label', { for: 'staff-email' }, node('span', { text: 'E-POŠTA' }), email), node('div', { class: 'staff-form-field' }, node('label', { for: 'staff-password', text: 'GESLO' }), node('div', { class: 'staff-password-field' }, password, visibility)), feedback, submit);
  form.addEventListener('submit', async (event) => { event.preventDefault(); if (submit.disabled) return; feedback.textContent = ''; submit.disabled = true; submit.textContent = 'PREVERJAM ...'; try { const result = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email: email.value, password: password.value }) }); role = result.user.role; location.assign(destinationForRole(result.user.role)); } catch (error) { feedback.textContent = error.message || 'Napačen e-poštni naslov ali geslo.'; password.focus(); } finally { submit.disabled = false; submit.textContent = 'PRIJAVA'; } });
  shell(node('section', { class: 'staff-login-page' }, node('aside', { class: 'staff-login-identity' }, node('div', { class: 'staff-login-mark', text: 'NDB' }), node('span', { class: 'eyebrow', text: 'URADNI SISTEM' }), node('h1', { text: 'ND BELTINCI' }), node('p', { text: 'MATCHDAY OPERATING SYSTEM' }), node('div', { class: 'staff-login-operation' }, node('strong', { text: 'OPERATIVNI DOSTOP' }), node('span', { text: 'Vloga se določi samodejno glede na pooblastila vašega računa.' }))), node('section', { class: 'staff-login-card' }, node('span', { class: 'eyebrow', text: 'AVTENTIKACIJA OSEBJA' }), node('h1', { text: 'PRIJAVA ZA OSEBJE' }), node('p', { text: 'Vnesite službene podatke za dostop do operativnega okolja na dan tekme.' }), form, node('a', { class: 'staff-return-link', href: '/', text: '← NAZAJ NA VSTOPNICE' }))));
}
function demoLogin() { const choose = (selected, destination) => async () => { const result = await api('/api/demo-login', { method: 'POST', body: JSON.stringify({ role: selected }) }); role = result.role; location.assign(destination); }; const choice = (title, description, kind, selected, destination) => node('button', { class: `role-choice ${kind}`, onClick: choose(selected, destination) }, node('strong', { text: title }), node('span', { text: description })); shell(node('section', { class: 'login-workspace' }, node('div', { class: 'eyebrow', text: 'DEMONSTRACIJSKI DOSTOP · RAZVOJ' }), node('h1', { text: 'KDO STE?' }), node('p', { class: 'lead', text: 'Ta izbira je na voljo izključno v razvoj/test okolju.' }), node('div', { class: 'role-choices' }, choice('ADMINISTRATOR', 'Upravljanje tekem, prodaje in poročil', 'primary', 'club_admin', '/admin'), choice('BLAGAJNIK', 'Prodaja vstopnic na blagajni', 'secondary', 'box_office', '/admin/blagajna'), choice('VARNOSTNIK', 'Preverjanje vstopnic na vhodu', 'muted', 'gate_staff', '/scanner')))); }
async function adminLegacy() {
  const data = await api('/api/admin/dashboard');
  const capacity = Math.max(data.capacity || 0, data.sold || 0);
  const soldPercent = capacity ? Math.round((data.sold / capacity) * 100) : 0;
  const scannedPercent = data.sold ? Math.round((data.scanned / data.sold) * 100) : 0;
  const onlineShare = data.sold ? Math.round(((data.channels[0]?.tickets || 0) / data.sold) * 10) * 10 : 0;
  const metric = (label, value, note, tone = '') => node('article', { class: `admin-metric ${tone}` }, node('span', { text: label }), node('strong', { text: value }), node('small', { text: note }));
  const channelCards = data.channels.map((channel) => node('article', { class: 'admin-channel-card' }, node('span', { text: channel.channel === 'ONLINE' ? 'SPLETNA PRODAJA' : 'FIZIČNA BLAGAJNA' }), node('strong', { text: `${channel.tickets} kart` }), node('b', { text: money.format(channel.revenue) })));
  const activity = data.recent.length ? data.recent.slice(0, 6).map((item) => node('article', { class: 'admin-activity-row' }, node('span', { class: 'admin-activity-dot', text: item.type.startsWith('ticket.') ? '✓' : '•' }), node('div', {}, node('strong', { text: item.type.replaceAll('.', ' ').toUpperCase() }), node('small', { text: item.detail })), node('time', { text: new Date(item.at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }) }))) : [node('p', { class: 'admin-empty', text: 'Za to tekmo še ni evidentirane dejavnosti.' })];
  const gateRows = data.gates.length ? data.gates.map((gate) => node('article', { class: 'admin-gate-card' }, node('span', { text: gate.gate.toUpperCase() }), node('strong', { text: String(gate.admitted) }), node('small', { text: 'POTRJENIH VSTOPOV' }))) : [node('article', { class: 'admin-gate-empty' }, node('strong', { text: 'NI TELEMETRIJE VHODOV' }), node('p', { text: 'Prikaz se napolni z dejanskimi potrditvami skenerja.' }))];
  const matchCard = node('section', { class: 'admin-command-panel' }, node('div', { class: 'admin-command-copy' }, node('div', { class: 'admin-command-tags' }, node('span', { class: `status ${data.event.salesOpen ? 'open' : 'closed'}`, text: data.event.salesOpen ? '● PRODAJA ODPRTA' : 'PRODAJA USTAVLJENA' }), node('span', { text: data.event.competition.toUpperCase() })), node('p', { text: 'NASLEDNJI PREVET V ŽIVO' }), node('h1', { 'aria-label': `ND BELTINCI — ${data.event.opponent.toUpperCase()}`, text: 'ND BELTINCI ' }, node('em', { text: 'VS' }), ` ${data.event.opponent.toUpperCase()}`), node('div', { class: 'admin-event-meta' }, node('span', { text: `▣ ${when(data.event.kickoff)}` }), node('span', { text: `◷ ${data.event.venue}` }))), node('div', { class: 'admin-command-actions' }, link('UREDI TEKMO', `/admin/tekme/${data.event.id}`, 'primary'), link('ODPRI BLAGAJNO', '/admin/blagajna', 'primary'), link('VSTOPNICE', '/admin/vstopnice', 'primary'), link('POROČILA', '/admin/porocila', 'primary')));
  shell(
    node('div', { class: 'admin-crumb' }, node('span', { text: 'OPERATIVNA NADZORNA PLOŠČA' }), node('b', { text: '/ PREGLED V ŽIVO' }), node('i', { text: '● LOKALNA POVEZAVA AKTIVNA' })),
    matchCard,
    node('section', { class: 'admin-metrics-grid' }, metric('PRODANE VSTOPNICE', `${data.sold} / ${capacity}`, `${soldPercent}% ZASEDENOSTI`), metric('SKUPNI PRIHODEK', money.format(data.revenue), 'DEJANSKO POTRJENA PLAČILA', 'yellow'), metric('VSTOPILI NA STADION', `${data.scanned}`, `${scannedPercent}% OD PRODANIH`, 'green'), metric('PREOSTALA KAPACITETA', String(Math.max(0, capacity - data.sold)), 'RAZPOLOŽLJIVIH MEST', 'blue')),
    node('section', { class: 'admin-dashboard-grid' }, node('article', { class: 'admin-sales-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'FINANČNA STRUKTURA' }), node('h2', { text: 'PRODAJA PO KANALIH' })), node('b', { text: `SKUPAJ: ${data.sold} VSTOPNIC` })), node('div', { class: 'admin-sales-bar' }, node('i', { class: `admin-sales-bar-fill share-${onlineShare}` })), node('div', { class: 'admin-channel-grid' }, channelCards)), node('article', { class: 'admin-activity-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'TELEMETRIJA DOGODKOV' }), node('h2', { text: 'ZADNJE DEJAVNOSTI' })), node('b', { class: 'admin-live', text: '● V ŽIVO' })), activity)),
    node('section', { class: 'admin-gates-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'KONTROLA DOSTOPA' }), node('h2', { text: 'STANJE VHODOV STADIONA' })), node('b', { class: 'admin-live', text: '● PODATKI SKENERJA' })), node('div', { class: 'admin-gate-grid' }, gateRows)),
    node('section', { class: 'admin-notice-bar' }, node('strong', { text: 'VARNOSTNA IN PRIREDITELJSKA SLUŽBA' }), node('span', { text: 'Operativni podatki se posodabljajo ob resnični prodaji in potrditvah vstopa.' }), button('RESETIRAJ DEMO', 'muted', async () => { await api('/api/demo/reset', { method: 'POST' }); location.reload(); }))
  );
}
async function pos() { const actor = await api('/api/session'); if (!actor.authenticated || !['box_office', 'club_admin'].includes(actor.role)) throw Error('Nimate potrebnih pravic. Prijavite se prek demo dostopa.'); const { events, ticketTypes } = await api('/api/events'); const event = events[0]; const types = ticketTypes.filter((type) => type.eventId === event.id); const quantities = Object.fromEntries(types.map((type) => [type.id, 0])); const draw = () => { const total = types.reduce((sum, type) => sum + quantities[type.id] * type.price, 0); const count = Object.values(quantities).reduce((sum, value) => sum + value, 0); const cards = types.map((type) => { const update = (delta) => { const next = quantities[type.id] + delta; if (next >= 0 && next <= Math.min(10, type.capacity - type.sold)) quantities[type.id] = next; draw(); }; return node('article', { class: 'ticket-choice' }, node('div', {}, node('span', { class: 'ticket-section', text: type.section }), node('h2', { text: type.name === 'Mladi' ? 'Do 15 let' : type.name }), node('strong', { class: 'ticket-price', text: type.price ? money.format(type.price) : 'BREZPLAČNO' })), node('div', { class: 'quantity-control' }, button('−', 'quantity-button', () => update(-1)), node('strong', { text: String(quantities[type.id]) }), button('+', 'quantity-button', () => update(1)))); }); const finish = async (paymentMethod, admit = false) => { const selected = types.filter((type) => quantities[type.id]); if (!selected.length) return; try { const response = await api('/api/box-office', { method: 'POST', body: JSON.stringify({ eventId: event.id, items: selected.map((type) => ({ ticketTypeId: type.id, quantity: quantities[type.id] })), paymentMethod, admit }) }); const ticket = response.tickets[0]; const success = node('section', { class: 'sale-success' }, node('div', { class: 'result-icon', text: '✓' }), node('h1', { text: 'PRODAJA USPEŠNA' }), node('p', { text: `${response.tickets.length} ${response.tickets.length === 1 ? 'vstopnica' : 'vstopnice'} · ${money.format(response.order.amount)}` }), button('NATISNI VSTOPNICE', 'primary large', () => location.assign(`/narocilo/${response.order.id}`)), button('PRIKAŽI QR', 'secondary large', () => location.assign(`/vstopnica/${ticket.id}`)), button('NOVA PRODAJA', 'muted', () => { Object.keys(quantities).forEach((key) => { quantities[key] = 0; }); draw(); })); shell(success); } catch (error) { fail(error); } }; const payment = node('aside', { class: 'payment-panel sticky' }, node('span', { class: 'eyebrow', text: 'SKUPAJ' }), node('div', { class: 'pos-total', text: money.format(total) }), node('p', { class: 'meta', text: count ? `${count} izbranih vstopnic` : 'Najprej izberite vstopnice.' }), node('h2', { text: 'NAČIN PLAČILA' }), button('GOTOVINA', 'primary large', () => finish('CASH')), button('KARTICA', 'secondary large', () => finish('CARD')), button('PRODAJ + SPUSTI NA STADION', 'muted', () => finish('CASH', true))); shell(node('section', { class: 'pos-header' }, node('div', { class: 'eyebrow', text: 'BLAGAJNA' }), node('h1', { text: `BELTINCI — ${event.opponent.toUpperCase()}` }), node('p', { text: `${when(event.kickoff)} · ${event.venue}` })), node('div', { class: 'pos-workspace' }, node('section', { class: 'ticket-grid' }, cards), payment)); }; draw(); }
function matchesState(kind) {
  const empty = kind === 'empty';
  shell(node('section', { class: `matches-page-refined matches-page-state ${kind}` }, node('span', { text: empty ? 'PROGRAM TEKEM' : 'UPRAVLJANJE TEKEM' }), node('h1', { text: empty ? 'TRENUTNO NI TEKEM.' : 'TEKEM NI MOGOČE NALOŽITI.' }), node('p', { text: empty ? 'Ko bodo tekme dodane v sistem, bodo prikazane na tem mestu.' : 'Poskusite znova. Če se težava ponovi, obvestite skrbnika sistema.' }), empty ? '' : link('POSKUSI ZNOVA', '/admin/tekme', 'primary')));
}
async function matches() {
  let data;
  try { data = await api('/api/admin/events'); } catch { return matchesState('error'); }
  const events = Array.isArray(data.events) ? data.events : [], ticketTypes = Array.isArray(data.ticketTypes) ? data.ticketTypes : [];
  if (!events.length) return matchesState('empty');
  const now = Date.now();
  const isCompleted = (event) => new Date(event.kickoff).getTime() < now;
  events.sort((left, right) => Number(isCompleted(left)) - Number(isCompleted(right)) || (isCompleted(left) ? new Date(right.kickoff) - new Date(left.kickoff) : new Date(left.kickoff) - new Date(right.kickoff)));
  const teamName = (clubId) => String(clubId || '').split('_').filter(Boolean).map((part) => part.toLowerCase() === 'nd' ? part.toUpperCase() : `${part[0]?.toUpperCase() || ''}${part.slice(1)}`).join(' ');
  const factsFor = (event) => {
    const types = ticketTypes.filter((type) => type.eventId === event.id);
    const capacity = types.reduce((sum, type) => sum + Number(type.capacity || 0), 0);
    const issued = types.reduce((sum, type) => sum + Number(type.sold || 0), 0);
    return { capacity, issued, remaining: Math.max(0, capacity - issued), occupancy: capacity ? Math.min(100, Math.round(issued / capacity * 100)) : 0 };
  };
  const totalCapacity = events.reduce((sum, event) => sum + factsFor(event).capacity, 0), totalIssued = events.reduce((sum, event) => sum + factsFor(event).issued, 0);
  const upcoming = events.filter((event) => !isCompleted(event)), completed = events.filter(isCompleted), open = upcoming.filter((event) => event.salesOpen && factsFor(event).remaining > 0);
  const seasonDate = new Date([...events].sort((a, b) => new Date(a.kickoff) - new Date(b.kickoff))[0].kickoff), seasonStart = seasonDate.getUTCMonth() >= 6 ? seasonDate.getUTCFullYear() : seasonDate.getUTCFullYear() - 1, seasonLabel = `${seasonStart}/${String(seasonStart + 1).slice(-2)}`;
  const metric = (label, value, detail, tone = '') => node('article', { class: `matches-metric ${tone}` }, node('span', { text: label }), node('strong', { text: value }), node('small', { text: detail }));
  const list = node('section', { class: 'match-management-list', 'aria-live': 'polite' });
  const filters = node('section', { class: 'matches-filter', 'aria-label': 'Filtri tekem' });
  let activeFilter = 'all';
  const filterData = [
    ['all', 'VSE TEKME', events.length],
    ['upcoming', 'PRIHAJAJOČE', upcoming.length],
    ['completed', 'KONČANE TEKME', completed.length]
  ];
  const saleState = (event, facts) => isCompleted(event) ? ['completed', '● TEKMA KONČANA'] : facts.capacity > 0 && facts.remaining === 0 ? ['sold-out', '● RAZPRODANO'] : event.salesOpen ? ['open', '● PRODAJA ODPRTA'] : new Date(event.salesStart).getTime() > now ? ['pending', 'PRODAJA ŠE NI ODPRTA'] : ['closed', 'PRODAJA ZAPRTA'];
  const matchCard = (event) => {
    const facts = factsFor(event), [state, stateLabel] = saleState(event, facts), homeTeam = teamName(event.clubId);
    return node('article', { class: `match-management-row ${state}` },
      node('div', { class: 'match-management-main' },
        node('div', { class: 'match-management-tags' }, node('span', { class: `sale-badge ${state}`, text: stateLabel }), node('span', { text: event.competition.toUpperCase() })),
        node('div', { class: 'matches-fixture' }, adminCrest(homeTeam, 'matches-team-crest'), node('h2', { class: 'matches-matchup' }, node('span', { class: 'matches-matchup-first' }, node('b', { text: homeTeam }), node('em', { text: 'VS' })), node('span', { class: 'matches-opponent', text: event.opponent })), adminCrest(event.opponent, 'matches-team-crest away')),
        node('p', { class: 'matches-event-meta' }, node('span', { text: `▣ ${when(event.kickoff)}` }), node('span', { text: `⌖ ${event.venue}` }))),
      node('div', { class: `match-management-occupancy ${facts.occupancy ? 'has-occupancy' : ''}` }, node('strong', { text: `${facts.occupancy}%` }), node('span', { text: 'ZASEDENO' })),
      node('div', { class: 'match-management-stat' }, node('span', { text: 'SKUPAJ IZDANE' }), node('strong', { text: `${facts.issued} / ${facts.capacity}` }), node('small', { text: facts.capacity ? `${facts.remaining} ŠE NA VOLJO` : 'KAPACITETA NI NASTAVLJENA' })),
      node('div', { class: 'match-management-actions' }, link('UREDI TEKMO', `/admin/tekme/${event.id}`, state === 'closed' || state === 'pending' ? 'primary' : 'secondary')));
  };
  const draw = () => {
    const visible = activeFilter === 'upcoming' ? upcoming : activeFilter === 'completed' ? completed : events;
    filters.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item.dataset.filter === activeFilter));
    list.replaceChildren(...(visible.length ? visible.map(matchCard) : [node('div', { class: 'matches-filter-empty' }, node('strong', { text: 'V TEJ SKUPINI NI TEKEM.' }), node('span', { text: 'Izberite drug filter za pregled programa.' }))]));
  };
  filterData.forEach(([value, label, count]) => { const control = button(`${label}  ${count}`, '', () => { activeFilter = value; draw(); }); control.dataset.filter = value; filters.append(control); });
  shell(node('section', { class: 'matches-page-refined' },
    node('header', { class: 'matches-heading' }, node('div', { class: 'matches-heading-kicker' }, node('span', { text: `SEZONA ${seasonLabel}` }), node('i'), node('b', { text: 'UPRAVLJANJE DOMAČIH TEKEM' })), node('h1', { text: 'UPRAVLJANJE TEKEM' }), node('p', { text: 'Centraliziran pregled domačih tekem, prodajnega stanja in razpoložljivih kapacitet.' })),
    node('section', { class: 'matches-metrics' }, metric('SKUPAJ IZDANE', `${totalIssued} / ${totalCapacity}`, totalCapacity ? `${Math.round(totalIssued / totalCapacity * 100)}% SKUPNE KAPACITETE` : 'NI NASTAVLJENE KAPACITETE'), metric('PRIHAJAJOČE TEKME', String(upcoming.length), `${completed.length} KONČANIH`, 'yellow'), metric('ODPRTA PRODAJA', String(open.length), 'PRIHAJAJOČE TEKME', 'green'), metric('NAJVEČJA KAPACITETA', String(Math.max(0, ...events.map((event) => factsFor(event).capacity))), 'SEDEŽEV / TEKMO')),
    filters,
    list));
  draw();
}
const localDateTime = (value) => { const instant = new Date(value); const local = new Date(instant.getTime() - instant.getTimezoneOffset() * 60_000); return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) }; };
function matchDetailState(kind) {
  const missing = kind === 'missing';
  shell(node('section', { class: `match-detail-page match-detail-state ${kind}` }, node('span', { text: 'UPRAVLJANJE TEKME' }), node('h1', { text: missing ? 'TEKMA NI NA VOLJO.' : 'TEKME NI MOGOČE NALOŽITI.' }), node('p', { text: missing ? 'Tekma ne obstaja ali zanjo nimate potrebnih pravic.' : 'Poskusite znova. Če se težava ponovi, obvestite skrbnika sistema.' }), link('NAZAJ NA TEKME', '/admin/tekme', 'primary')));
}
async function matchDetail(id) {
  let data;
  try { data = await api('/api/admin/events'); } catch { return matchDetailState('error'); }
  const { events, ticketTypes } = data;
  const event = events.find((item) => item.id === id);
  if (!event) return matchDetailState('missing');
  const kickoff = localDateTime(event.kickoff);
  const salesStart = localDateTime(event.salesStart);
  const salesEnd = localDateTime(event.salesEnd);
  const opponent = node('input', { name: 'opponent', required: '', value: event.opponent });
  const competition = node('input', { name: 'competition', required: '', value: event.competition });
  const venue = node('input', { name: 'venue', required: '', value: event.venue });
  const date = node('input', { name: 'date', type: 'date', required: '', value: kickoff.date });
  const time = node('input', { name: 'time', type: 'time', required: '', value: kickoff.time });
  const saleStart = node('input', { name: 'salesStart', type: 'datetime-local', required: '', value: `${salesStart.date}T${salesStart.time}` });
  const saleEnd = node('input', { name: 'salesEnd', type: 'datetime-local', required: '', value: `${salesEnd.date}T${salesEnd.time}` });
  const status = node('select', { name: 'salesOpen' }, node('option', { value: 'open', text: 'PRODAJA ODPRTA' }), node('option', { value: 'closed', text: 'PRODAJA ZAPRTA' }));
  status.value = event.salesOpen ? 'open' : 'closed';
  const feedback = node('p', { class: 'save-feedback', role: 'status', 'aria-live': 'polite' });
  const field = (label, input, note = '') => node('label', { class: 'match-field' }, node('span', { text: label }), input, note ? node('small', { text: note }) : '');
  const form = node('form', { class: 'match-detail-form' });
  const typeRows = ticketTypes.filter((type) => type.eventId === id).map((type) => {
    const price = node('input', { type: 'number', min: '0', step: '0.01', required: '', value: String(type.price), 'aria-label': `Cena ${type.section} ${type.name}` });
    const capacity = node('input', { type: 'number', min: String(type.sold), step: '1', required: '', value: String(type.capacity), 'aria-label': `Kapaciteta ${type.section} ${type.name}` });
    const active = node('input', { type: 'checkbox', 'aria-label': `Aktivna ${type.section} ${type.name}` }); active.checked = type.active;
    const error = node('small', { class: 'ticket-capacity-error', 'aria-live': 'polite' });
    const validateCapacity = () => { const invalid = Number(capacity.value) < Number(type.sold); const message = invalid ? `Kapaciteta ne sme biti nižja od že izdanih vstopnic (${type.sold}).` : ''; capacity.setCustomValidity(message); error.textContent = message; return !invalid; };
    capacity.addEventListener('input', validateCapacity);
    const remaining = Math.max(0, Number(type.capacity) - Number(type.sold));
    return { type, price, capacity, active, validateCapacity, row: node('article', { class: 'ticket-category-editor' }, node('header', {}, node('div', {}, node('span', { text: type.section.toUpperCase() }), node('h3', { text: type.name })), node('div', { class: 'ticket-category-facts' }, node('span', {}, node('b', { text: String(type.sold) }), ' IZDANIH'), node('span', {}, node('b', { text: String(remaining) }), ' PROSTIH'))), node('div', { class: 'ticket-category-controls' }, node('label', {}, node('span', { text: 'CENA' }), node('div', { class: 'price-input' }, price, node('b', { text: '€' })), node('small', { text: type.price === 0 ? 'Kategorija z vrednostjo 0,00 €' : 'Cena za eno vstopnico' })), node('label', {}, node('span', { text: 'KAPACITETA' }), capacity, error), node('label', { class: 'type-active' }, active, node('span', {}, node('b', { text: 'NA VOLJO ZA PRODAJO' }), node('small', { text: 'Kategorija je vidna v prodajnih kanalih.' })))) ) };
  });
  const identity = node('div', { class: 'match-detail-identity' });
  const drawIdentity = (value) => {
    const homeTeam = String(value.clubId || '').split('_').filter(Boolean).map((part) => part.toLowerCase() === 'nd' ? part.toUpperCase() : `${part[0]?.toUpperCase() || ''}${part.slice(1)}`).join(' ');
    identity.replaceChildren(adminCrest(homeTeam, 'match-detail-crest'), node('h1', { 'aria-label': `BELTINCI — ${value.opponent.toUpperCase()}` }, node('span', {}, node('b', { text: homeTeam }), node('em', { text: 'VS' })), node('strong', { text: value.opponent })), adminCrest(value.opponent, 'match-detail-crest away'));
  };
  drawIdentity(event);
  const save = async (salesOpen = status.value === 'open') => {
    const capacitiesValid = typeRows.every(({ validateCapacity }) => validateCapacity());
    if (!capacitiesValid || !form.reportValidity()) return;
    feedback.textContent = 'Shranjujem spremembe …';
    feedback.className = 'save-feedback';
    const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
    try {
      const response = await api(`/api/admin/events/${event.id}`, { method: 'PUT', body: JSON.stringify({ opponent: opponent.value, competition: competition.value, venue: venue.value, kickoff: `${date.value}T${time.value}`, salesStart: saleStart.value, salesEnd: saleEnd.value, salesOpen, ticketTypes: typeRows.map(({ type, price, capacity, active }) => ({ id: type.id, price: Number(price.value), capacity: Number(capacity.value), active: active.checked })) }) });
      status.value = response.event.salesOpen ? 'open' : 'closed';
      [statusBadge, heroStatusBadge].forEach((badge) => { badge.className = `match-detail-status ${response.event.salesOpen ? 'open' : 'closed'}`; badge.textContent = response.event.salesOpen ? '● PRODAJA ODPRTA' : 'PRODAJA ZAPRTA'; });
      competitionTag.textContent = response.event.competition.toUpperCase();
      matchMeta.replaceChildren(node('span', { text: `▣ ${when(response.event.kickoff)}` }), node('span', { text: `⌖ ${response.event.venue}` }));
      drawIdentity(response.event);
      feedback.className = 'save-feedback success'; feedback.textContent = '✓ Spremembe so shranjene.'; toast('Spremembe so shranjene.');
      document.title = `ND Beltinci — ${response.event.opponent}`;
    } catch (error) { const message = String(error.message || ''); feedback.className = 'save-feedback error'; feedback.textContent = /Preverite podatke tekme|Kategorije vstopnic ni mogoče shraniti/.test(message) ? message : 'Sprememb ni bilo mogoče shraniti. Poskusite znova.'; } finally { if (submit) submit.disabled = false; }
  };
  const statusBadge = node('span', { class: `match-detail-status ${event.salesOpen ? 'open' : 'closed'}`, text: event.salesOpen ? '● PRODAJA ODPRTA' : 'PRODAJA ZAPRTA' });
  const heroStatusBadge = statusBadge.cloneNode(true);
  const competitionTag = node('span', { text: event.competition.toUpperCase() });
  const matchMeta = node('div', { class: 'match-detail-meta' }, node('span', { text: `▣ ${when(event.kickoff)}` }), node('span', { text: `⌖ ${event.venue}` }));
  const openSales = node('button', { class: 'secondary', type: 'button', text: 'ODPRI PRODAJO', onClick: () => { status.value = 'open'; save(true); } });
  const stopSales = node('button', { class: 'match-stop-sales', type: 'button', text: 'USTAVI PRODAJO', onClick: () => confirmDialog({ title: 'Ustavim prodajo?', description: 'Nove spletne in blagajniške prodaje ne bodo več mogoče. Že izdane vstopnice bodo še vedno veljavne.', confirmText: 'USTAVI PRODAJO', onConfirm: async () => { status.value = 'closed'; await save(false); } }) });
  const saveButton = button('SHRANI SPREMEMBE', 'primary match-detail-save'); saveButton.type = 'submit';
  form.append(
    node('div', { class: 'match-detail-layout' },
      node('section', { class: 'match-detail-card match-information' }, node('header', {}, node('span', { text: '01' }), node('div', {}, node('b', { text: 'PODROBNOSTI TEKME' }), node('small', { text: 'Nasprotnik, tekmovanje in termin' }))), node('div', { class: 'match-detail-fields' }, field('NASPROTNIK', opponent), field('TEKMOVANJE', competition), field('PRIZORIŠČE', venue), node('div', { class: 'match-date-time' }, field('DATUM TEKME', date), field('URA ZAČETKA', time)))),
      node('section', { class: 'match-detail-card match-sales' }, node('header', {}, node('span', { text: '02' }), node('div', {}, node('b', { text: 'PRODAJA VSTOPNIC' }), node('small', { text: 'Prodajno okno in trenutno stanje' })), statusBadge), node('div', { class: 'match-detail-fields' }, field('STATUS PRODAJE', status), field('ZAČETEK PRODAJE', saleStart), field('KONEC PRODAJE', saleEnd)), node('p', { class: 'sales-safety-copy', text: 'Ustavitev prodaje prepreči nove nakupe. Že izdane vstopnice ostanejo veljavne.' }), node('div', { class: 'match-sales-actions' }, openSales, stopSales)),
      node('section', { class: 'match-detail-card match-ticket-types' }, node('header', {}, node('span', { text: '03' }), node('div', {}, node('b', { text: 'KATEGORIJE VSTOPNIC' }), node('small', { text: 'Cene, kapacitete in razpoložljivost' }))), node('div', { class: 'ticket-category-list' }, typeRows.map(({ row }) => row)))
    ),
    node('footer', { class: 'match-detail-savebar' }, node('div', {}, node('strong', { text: 'PRIPRAVLJENO ZA SHRANJEVANJE' }), node('span', { text: 'Spremembe začnejo veljati po potrditvi.' })), feedback, saveButton)
  );
  form.addEventListener('submit', (submit) => { submit.preventDefault(); save(); });
  shell(node('section', { class: 'match-detail-page' }, node('a', { class: 'match-detail-back', href: '/admin/tekme', text: '← NAZAJ NA TEKME' }), node('header', { class: 'match-detail-hero' }, node('div', { class: 'match-detail-tags' }, heroStatusBadge, competitionTag), identity, matchMeta), form));
}
async function ticketsAdmin() {
  let data;
  try { data = await api('/api/admin/tickets'); } catch { return shell(node('section', { class: 'ticket-admin-state error' }, node('span', { text: 'MODUL VSTOPNIC' }), node('h1', { text: 'VSTOPNIC NI MOGOČE NALOŽITI.' }), node('p', { text: 'Poskusite znova. Če se težava ponovi, obvestite skrbnika sistema.' }), link('POSKUSI ZNOVA', '/admin/vstopnice', 'primary'))); }
  const { tickets, events, ticketTypes } = data;
  const statusOf = (ticket) => ticket.status === 'CANCELLED' ? 'cancelled' : ticket.admissions.length ? 'redeemed' : 'valid';
  const statusCopy = { valid: 'VELJAVNA', redeemed: 'UPORABLJENA', cancelled: 'PREKLICANA' };
  const metrics = [
    ['SKUPAJ VELJAVNIH', tickets.filter((ticket) => statusOf(ticket) === 'valid').length, 'PRIPRAVLJENIH ZA VSTOP', 'yellow'],
    ['PREHODI SKOZI VRATA', tickets.filter((ticket) => statusOf(ticket) === 'redeemed').length, 'EVIDENTIRANE POTRDITVE', 'green'],
  ].map(([label, value, detail, tone]) => node('article', { class: `ticket-admin-metric ${tone}` }, node('span', { text: label }), node('strong', { text: String(value) }), node('small', { text: detail })));
  const list = node('section', { class: 'ticket-result-list' });
  const search = node('input', { type: 'search', placeholder: 'Referenca vstopnice, naročila ali tekma', autocomplete: 'off', 'aria-label': 'Iskanje vstopnic' });
  const status = node('select', {}, node('option', { value: 'all', text: 'Vsi statusi' }), node('option', { value: 'valid', text: 'Veljavna' }), node('option', { value: 'redeemed', text: 'Uporabljena' }), node('option', { value: 'cancelled', text: 'Preklicana' }));
  const eventFilter = node('select', {}, node('option', { value: 'all', text: 'Vse tekme' }), events.map((event) => node('option', { value: event.id, text: `ND Beltinci vs ${event.opponent}` })));
  const channel = node('select', {}, node('option', { value: 'all', text: 'Vsi kanali' }), node('option', { value: 'ONLINE', text: 'Spletna prodaja' }), node('option', { value: 'BOX_OFFICE', text: 'Blagajna' }), node('option', { value: 'COMPLIMENTARY', text: 'Brezplačna izdaja' }));
  const category = node('select', {}, node('option', { value: 'all', text: 'Vse kategorije' }), ticketTypes.map((type) => node('option', { value: type.id, text: `${type.section} — ${type.name}` })));
  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase('sl-SI');
    const found = tickets.filter((ticket) => {
      const index = `${ticket.reference} ${ticket.order.reference} ${ticket.event.opponent} ${ticket.type.section} ${ticket.type.name}`.toLocaleLowerCase('sl-SI');
      return (!query || index.includes(query)) && (status.value === 'all' || statusOf(ticket) === status.value) && (eventFilter.value === 'all' || ticket.event.id === eventFilter.value) && (channel.value === 'all' || ticket.order.channel === channel.value) && (category.value === 'all' || ticket.type.id === category.value);
    });
    const rows = found.map((ticket) => {
      const ticketStatus = statusOf(ticket);
      const admission = ticket.admissions.at(-1);
      const stateDetail = ticketStatus === 'redeemed' ? `VSTOP: ${admission?.gate || 'evidentiran'} · ${admission ? new Date(admission.scannedAt).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }) : ''}` : ticketStatus === 'cancelled' ? 'VSTOP ZAVRNJEN' : 'ŠE NI VSTOPIL';
      const cancel = ticket.status === 'VALID' ? button('PREKLIČI VSTOPNICO', 'danger ticket-cancel', () => confirmDialog({ title: 'Prekličem vstopnico?', description: 'Vstopnica ne bo več veljavna za vstop. Tega dejanja ni mogoče razveljaviti.', confirmText: 'PREKLIČI VSTOPNICO', onConfirm: async () => { await api(`/api/admin/tickets/${ticket.id}/cancel`, { method: 'POST' }); toast('Vstopnica je preklicana.'); await ticketsAdmin(); } })) : node('span', { class: 'ticket-disabled-action', text: 'PREKLIC NI NA VOLJO' });
      return node('article', { class: `ticket-admin-row ${ticketStatus}` },
        node('div', { class: 'ticket-admin-id' }, node('strong', { text: `◉ ${ticket.reference}` }), node('div', {}, node('span', { class: `ticket-state ${ticketStatus}`, text: statusCopy[ticketStatus] }), node('span', { class: 'ticket-admission-state', text: stateDetail }))),
        node('div', { class: 'ticket-admin-event' }, node('span', { text: 'TEKMA & ČAS' }), node('strong', { text: `ND BELTINCI VS ${ticket.event.opponent.toUpperCase()}` }), node('small', { text: `${when(ticket.event.kickoff)} · ${ticket.event.venue}` })),
        node('div', { class: 'ticket-admin-owner' }, node('span', { text: 'NAROČILO & IZDAJA' }), node('strong', { text: ticket.order.reference }), node('small', { text: `${ticket.order.channel === 'ONLINE' ? 'SPLET' : ticket.order.channel === 'BOX_OFFICE' ? 'BLAGAJNA' : 'BREZPLAČNA'} · ${ticket.order.issuer || 'Samodejna izdaja'}` })),
        node('div', { class: 'ticket-admin-type' }, node('span', { text: 'SEKTOR, KATEGORIJA & VREDNOST' }), node('strong', { text: ticket.type.section }), node('small', { text: `${ticket.type.name} · ${ticket.order.channel === 'COMPLIMENTARY' ? 'BREZPLAČNA IZDAJA · 0,00 €' : money.format(ticket.type.price)}` }), node('small', { text: `Izdano ${new Intl.DateTimeFormat('sl-SI', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(ticket.issuedAt))}` })),
        node('div', { class: 'ticket-admin-actions' }, link('PODROBNOSTI', `/vstopnica/${ticket.id}`, 'secondary'), cancel));
    });
    list.replaceChildren(node('div', { class: 'ticket-result-command' }, node('b', { text: `● REZULTATI ISKANJA: ${found.length} / ${tickets.length}` }), node('span', { text: 'PODATKI IZ DEJANSKO IZDANIH VSTOPNIC' })), ...(rows.length ? rows : [node('article', { class: 'ticket-admin-empty' }, node('strong', { text: tickets.length ? 'NI UJEMAJOČIH VSTOPNIC' : 'VSTOPNICE ŠE NISO IZDANE' }), node('p', { text: tickets.length ? 'Spremenite iskalni niz ali aktivne filtre.' : 'Ko bo izdana prva vstopnica, bo prikazana na tem mestu.' }))]));
  };
  [search, status, eventFilter, channel, category].forEach((control) => control.addEventListener('input', draw));
  const openComplimentary = () => {
    const event = node('select', {}, events.map((item) => node('option', { value: item.id, text: `ND Beltinci vs ${item.opponent} · ${when(item.kickoff)}` }))), type = node('select'), quantity = node('input', { type: 'number', min: '1', max: '10', step: '1', value: '1', required: '' }), recipient = node('input', { type: 'text', maxlength: '120', placeholder: 'npr. Gost kluba (neobvezno)' }), feedback = node('p', { class: 'complimentary-feedback', role: 'status', 'aria-live': 'polite' });
    let portal, form;
    const close = () => portal.remove();
    const confirm = button('POTRDI IZDAJO', 'primary complimentary-confirm', async () => { if (!form.reportValidity() || confirm.disabled) return; confirm.disabled = true; confirm.textContent = 'IZDAJAM …'; feedback.textContent = ''; try { const result = await api('/api/admin/tickets/complimentary', { method: 'POST', body: JSON.stringify({ eventId: event.value, ticketTypeId: type.value, quantity: Number(quantity.value), recipient: recipient.value }) }); close(); toast(`Izdano: ${result.tickets.length} brezplačnih vstopnic.`); await ticketsAdmin(); } catch (error) { feedback.textContent = error.message || 'Brezplačnih vstopnic ni mogoče izdati.'; confirm.disabled = false; confirm.textContent = 'POTRDI IZDAJO'; } });
    const refreshTypes = () => { const available = ticketTypes.filter((item) => item.eventId === event.value && item.active); type.replaceChildren(...available.map((item) => node('option', { value: item.id, text: `${item.section} — ${item.name} · ${Math.max(0, item.capacity - item.sold)} prostih` }))); confirm.disabled = !available.length; };
    event.addEventListener('change', refreshTypes);
    form = node('form', { class: 'complimentary-form' }, node('div', { class: 'complimentary-heading' }, node('span', { text: 'ADMINISTRATORSKA IZDAJA' }), node('h2', { id: 'complimentary-title', text: 'IZDAJ BREZPLAČNE VSTOPNICE' }), node('p', { text: 'Izdaja porabi dejansko kapaciteto in ustvari običajne veljavne QR vstopnice brez plačila.' })), node('label', {}, node('span', { text: 'TEKMA' }), event), node('label', {}, node('span', { text: 'KATEGORIJA' }), type), node('div', { class: 'complimentary-split' }, node('label', {}, node('span', { text: 'KOLIČINA' }), quantity), node('label', {}, node('span', { text: 'PREJEMNIK' }), recipient)), node('aside', {}, node('strong', { text: 'KANAL: COMPLIMENTARY' }), node('span', { text: 'Vrednost naročila in prihodek: 0,00 €' })), feedback, node('div', { class: 'complimentary-actions' }, button('PREKLIČI', 'muted', close), confirm));
    form.addEventListener('submit', (submit) => { submit.preventDefault(); confirm.click(); });
    portal = node('div', { class: 'dialog-portal complimentary-portal' }, node('div', { class: 'dialog-overlay', onClick: close }), node('section', { class: 'complimentary-dialog', role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'complimentary-title' }, form)); document.body.append(portal); refreshTypes(); requestAnimationFrame(() => event.focus());
  };
  draw();
  shell(node('section', { class: 'ticket-admin-heading' }, node('div', { class: 'eyebrow', text: 'MODUL VSTOPNIC // NADZORNA TOČKA' }), node('h1', { text: 'UPRAVLJANJE IN ISKALNIK VSTOPNIC' }), node('p', { text: 'Hitra verifikacija in operativni nadzor nad izdanimi, uporabljenimi in preklicanimi vstopnicami.' }), node('div', { class: 'ticket-admin-heading-actions' }, button('IZDAJ BREZPLAČNE VSTOPNICE', 'secondary', openComplimentary)), node('div', { class: 'ticket-admin-metrics' }, metrics)), node('section', { class: 'ticket-search-panel' }, node('div', { class: 'ticket-search-main' }, search, button('POIŠČI V BAZI', 'primary', draw)), node('div', { class: 'ticket-search-filters' }, node('label', {}, 'STATUS VSTOPNICE', status), node('label', {}, 'IZBIRA TEKME', eventFilter), node('label', {}, 'PRODAJNI KANAL', channel), node('label', {}, 'KATEGORIJA', category))), list);
}
async function ordersAdmin() {
  let orders;
  try { ({ orders } = await api('/api/admin/orders')); } catch { return shell(node('section', { class: 'orders-state error' }, node('span', { text: 'MODUL NAROČIL' }), node('h1', { text: 'NAROČIL NI MOGOČE NALOŽITI.' }), node('p', { text: 'Poskusite znova. Če se težava ponovi, obvestite skrbnika sistema.' }), link('POSKUSI ZNOVA', '/admin/narocila', 'primary'))); }
  const channelCopy = { ONLINE: 'SPLET', BOX_OFFICE: 'BLAGAJNA', COMPLIMENTARY: 'BREZPLAČNO' };
  const statusCopy = { PAID: 'PLAČANO', PENDING_PAYMENT: 'ČAKA PLAČILO', FAILED: 'NEUSPEŠNO', CANCELLED: 'PREKLICANO', REFUNDED: 'POVRNJENO', EXPIRED: 'POTEKLO' };
  const paymentCopy = (order) => order.channel === 'COMPLIMENTARY' ? 'PLAČILO NI POTREBNO' : order.payment.method === 'CASH' ? 'GOTOVINA' : order.payment.method === 'CARD' ? 'KARTICA' : order.payment.method === 'DEMO' ? 'DEMO PLAČILO' : order.payment.status === 'PENDING' ? 'V ČAKANJU' : 'BREZ POTRDITVE';
  const search = node('input', { type: 'search', placeholder: 'Išči po referenci naročila', autocomplete: 'off', 'aria-label': 'Iskanje naročil' });
  const channel = node('select', {}, node('option', { value: 'all', text: 'Vsi kanali' }), ...Object.entries(channelCopy).map(([value, text]) => node('option', { value, text })));
  const status = node('select', {}, node('option', { value: 'all', text: 'Vsi statusi' }), ...[...new Set(orders.map((order) => order.status))].map((value) => node('option', { value, text: statusCopy[value] || value })));
  const product = node('select', {}, node('option', { value: 'all', text: 'Vse tekme in produkti' }), ...[...new Map(orders.map((order) => [order.event?.id || order.seasonProduct?.id, order.event ? `ND Beltinci vs ${order.event.opponent}` : `${order.seasonProduct?.name} ${order.seasonProduct?.season}`])).entries()].filter(([value]) => value).map(([value, text]) => node('option', { value, text })));
  const list = node('section', { class: 'orders-list' });
  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase('sl-SI');
    const found = orders.filter((order) => (!query || order.reference.toLocaleLowerCase('sl-SI').includes(query)) && (channel.value === 'all' || order.channel === channel.value) && (status.value === 'all' || order.status === status.value) && (product.value === 'all' || (order.event?.id || order.seasonProduct?.id) === product.value));
    const rows = found.map((order) => {
      const subject = order.event ? `ND BELTINCI VS ${order.event.opponent.toUpperCase()}` : `${order.seasonProduct?.name || 'SEZONSKA VSTOPNICA'} · ${order.seasonProduct?.season || ''}`;
      const issued = order.kind === 'SEASON' ? `${order.entitlementCount} SEZONSKIH PRAVIC` : `${order.issuedCount} IZDANIH VSTOPNIC`;
      const cancelled = order.ticketStatus.cancelled ? ` · ${order.ticketStatus.cancelled} PREKLICANIH` : '';
      const details = node('div', { class: 'order-detail' }, node('span', { text: `PLAČILO: ${paymentCopy(order)}` }), order.seller ? node('span', { text: `OSEBJE: ${order.seller}` }) : '', node('span', { text: `${issued}${cancelled}` }), order.customer.email ? node('span', { text: `KUPEC: ${order.customer.name || order.customer.email}` }) : '');
      const toggle = button('PODROBNOSTI', 'muted order-toggle', () => { const open = details.classList.toggle('open'); toggle.textContent = open ? 'SKRIJ' : 'PODROBNOSTI'; });
      return node('article', { class: `order-row ${order.status.toLowerCase()} ${order.channel.toLowerCase()}` },
        node('div', { class: 'order-reference' }, node('strong', { text: `#${order.reference}` }), node('time', { datetime: order.createdAt, text: new Intl.DateTimeFormat('sl-SI', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt)) })),
        node('div', { class: 'order-subject' }, node('span', { text: order.kind === 'SEASON' ? 'SEZONSKI PRODUKT' : 'TEKMA / POSTAVKA' }), node('strong', { text: subject }), node('small', { text: order.event ? `${order.event.competition} · ${when(order.event.kickoff)}` : 'SEZONSKO NAROČILO' })),
        node('div', { class: 'order-quantity' }, node('strong', { text: String(order.quantity) }), node('span', { text: order.kind === 'SEASON' ? 'SEZONSKIH' : 'VSTOPNIC' })),
        node('span', { class: `order-channel ${order.channel.toLowerCase()}`, text: channelCopy[order.channel] || order.channel }),
        node('div', { class: 'order-total' }, node('strong', { text: money.format(order.amount) }), node('small', { text: paymentCopy(order) })),
        node('span', { class: `order-status ${order.status.toLowerCase()}`, text: `● ${statusCopy[order.status] || order.status}` }),
        toggle, details);
    });
    list.replaceChildren(node('header', {}, node('b', { text: `PRIKAZANIH ${found.length} OD ${orders.length} NAROČIL` }), node('span', { text: 'NAJNOVEJŠA NAJPREJ' })), ...(rows.length ? rows : [node('article', { class: 'orders-empty' }, node('strong', { text: orders.length ? 'NI UJEMAJOČIH NAROČIL' : 'NAROČIL ŠE NI' }), node('p', { text: orders.length ? 'Spremenite iskalni niz ali aktivne filtre.' : 'Ko bo ustvarjeno prvo naročilo, bo prikazano na tem mestu.' }))]));
  };
  [search, channel, status, product].forEach((control) => control.addEventListener('input', draw)); draw();
  const paid = orders.filter((order) => order.status === 'PAID'), online = paid.filter((order) => order.channel === 'ONLINE'), issued = orders.reduce((sum, order) => sum + order.issuedCount, 0);
  shell(node('section', { class: 'orders-heading' }, node('div', {}, node('span', { text: 'FINANČNI MODUL // OPERATIVNA ZGODOVINA' }), node('h1', { text: 'NAROČILA IN TRANSAKCIJE' }), node('p', { text: 'Pregled spletnih nakupov, blagajniških prodaj in brezplačnih izdaj na enem mestu.' }))), node('section', { class: 'orders-metrics' }, node('article', {}, node('span', { text: 'VSA NAROČILA' }), node('strong', { text: String(orders.length) }), node('small', { text: `${issued} IZDANIH ENOT` })), node('article', {}, node('span', { text: 'SPLETNA NAROČILA' }), node('strong', { text: String(online.length) }), node('small', { text: money.format(online.reduce((sum, order) => sum + order.amount, 0)) })), node('article', {}, node('span', { text: 'POTRJENA VREDNOST' }), node('strong', { text: money.format(paid.reduce((sum, order) => sum + order.amount, 0)) }), node('small', { text: 'BREZ BREZPLAČNIH IZDAJ' }))), node('section', { class: 'orders-filters' }, search, channel, status, product), list, node('p', { class: 'orders-demo-note', text: 'SPLETNA PLAČILA V TEM PROTOTIPU UPORABLJAJO DEMONSTRACIJSKE POTRDITVE. POVRAČILA NISO IMPLEMENTIRANA.' }));
}
async function reports() {
  let data;
  try { data = await api('/api/admin/report'); } catch { return shell(node('section', { class: 'reports-state error' }, node('span', { text: 'POROČILA' }), node('h1', { text: 'POROČILA NI MOGOČE NALOŽITI.' }), node('p', { text: 'Poskusite znova. Če se težava ponovi, obvestite skrbnika sistema.' }), link('POSKUSI ZNOVA', '/admin/porocila', 'primary'))); }
  const { totals, channels, matches, season } = data, channelCopy = { ONLINE: 'SPLET', BOX_OFFICE: 'BLAGAJNA', COMPLIMENTARY: 'BREZPLAČNO' };
  const matchSelect = node('select', { 'aria-label': 'Filtriraj poročilo po tekmi' }, node('option', { value: 'all', text: 'Vse tekme' }), ...matches.map((match) => node('option', { value: match.event.id, text: `ND Beltinci vs ${match.event.opponent}` })));
  const matchList = node('section', { class: 'report-match-list' });
  const draw = () => { const shown = matches.filter((match) => matchSelect.value === 'all' || match.event.id === matchSelect.value); matchList.replaceChildren(node('header', {}, node('div', {}, node('span', { text: 'USPEŠNOST DOGODKOV' }), node('h2', { text: 'POROČILA PO TEKMAH' })), node('b', { text: `${shown.length} ${shown.length === 1 ? 'TEKMA' : 'TEKEM'}` })), ...(shown.length ? shown.map((match) => node('article', { class: 'report-match-row' }, node('div', { class: 'report-match-name' }, adminCrest('ND Beltinci', 'report-crest'), node('div', {}, node('span', { text: match.event.competition.toUpperCase() }), node('strong', { text: `ND BELTINCI VS ${match.event.opponent.toUpperCase()}` }), node('small', { text: when(match.event.kickoff) })), adminCrest(match.event.opponent, 'report-crest away')), node('div', { class: 'report-match-stat' }, node('span', { text: 'IZDANO' }), node('strong', { text: String(match.totalIssued) }), node('small', { text: `${match.paidTickets} plačanih` })), node('div', { class: 'report-match-stat comp' }, node('span', { text: 'BREZPLAČNE' }), node('strong', { text: String(match.complimentary) }), node('small', { text: '0,00 €' })), node('div', { class: 'report-match-stat' }, node('span', { text: 'VSTOPILI' }), node('strong', { text: String(match.admissions) }), node('small', { text: `${match.remainingCapacity} prostih mest` })), node('div', { class: 'report-match-revenue' }, node('span', { text: 'PRIHODEK' }), node('strong', { text: money.format(match.revenue) }), node('small', { text: `${match.capacity} kapaciteta` })))) : [node('article', { class: 'reports-empty' }, node('strong', { text: 'NI PODATKOV ZA PRIKAZ' }), node('p', { text: 'Za izbrano tekmo še ni poročevalskih podatkov.' }))])); };
  matchSelect.addEventListener('change', draw); draw();
  const metrics = [['SKUPAJ IZDANO', totals.totalIssued, `${totals.paidTickets} PLAČANIH`, 'issued'], ['PRIHODEK OD VSTOPNIC', money.format(totals.revenue), 'SAMO POTRJENA NAROČILA', 'revenue'], ['VSTOPILI', totals.admissions, 'DEJANSKI PREHODI', 'admitted'], ['BREZPLAČNE', totals.complimentary, 'IZRECNO COMPLIMENTARY', 'complimentary'], ['PREOSTALA KAPACITETA', totals.remainingCapacity, `${totals.capacity} SKUPNIH MEST`, 'capacity']].map(([label, value, detail, tone]) => node('article', { class: `report-metric ${tone}` }, node('span', { text: label }), node('strong', { text: String(value) }), node('small', { text: detail })));
  const channelCards = channels.map((channel) => node('article', { class: `report-channel ${channel.channel.toLowerCase()}` }, node('span', { text: channelCopy[channel.channel] || channel.channel }), node('strong', { text: `${channel.tickets} VSTOPNIC` }), node('b', { text: money.format(channel.revenue) }), node('small', { text: channel.channel === 'COMPLIMENTARY' ? 'BREZ PRIHODKA' : 'POTRJENA VREDNOST' })));
  shell(node('header', { class: 'reports-heading' }, node('div', {}, node('span', { text: 'OPERATIVNO POROČANJE // REALNI PODATKI' }), node('h1', { text: 'PRODAJA IN OBISK' }), node('p', { text: 'Jasen pregled izdanih vstopnic, prihodka, brezplačnih izdaj in dejanskih vstopov po tekmah.' })), node('label', {}, node('span', { text: 'IZBIRA TEKME' }), matchSelect)), matches.length ? node('section', { class: 'report-metrics' }, metrics) : node('section', { class: 'reports-empty top' }, node('strong', { text: 'POROČEVALSKIH PODATKOV ŠE NI' }), node('p', { text: 'Ko bodo tekme in prodaja evidentirane, bodo ključni kazalniki prikazani tukaj.' })), matches.length ? node('section', { class: 'report-channel-panel' }, node('header', {}, node('span', { text: 'PRODAJNI KANALI' }), node('h2', { text: 'IZVOR IZDANIH VSTOPNIC' }), node('p', { text: 'Kanali prikazujejo samo naročilom sledljive vstopnice; zgodovinska osnovna prodaja ostaja vključena v skupnih rezultatih tekem.' })), node('div', {}, channelCards)) : '', matchList, node('aside', { class: 'report-season' }, node('div', {}, node('span', { text: 'SEZONSKI PRODUKTI — LOČENO OD TEKEM' }), node('strong', { text: `${season.entitlements} IZDANIH SEZONSKIH PRAVIC` }), node('small', { text: `${season.orders} potrjenih naročil · ${money.format(season.revenue)}` })), node('p', { text: 'Sezonski prihodek ni vključen v zgornji prihodek posameznih tekem. Evidentiranje sezonskih vstopov še ni implementirano.' })));
}
function season() { shell(node('section', { class: 'hero' }, node('div', { class: 'eyebrow', text: 'SEZONSKA VSTOPNICA · DEMO' }), node('h1', { text: 'V vseh domačih trenutkih skupaj.' }), node('p', { text: 'Vse domače ligaške tekme, domače pokalne tekme in javne pripravljalne tekme.' }), node('h2', { text: '120,00 €' }))); }

// Pixel-led reconstruction of supplied POS reference. It uses only the real
// catalogue and box-office endpoint; reference-only cash/printer telemetry is
// deliberately not fabricated.
async function referencePos() {
  document.body.classList.add('reference-pos');
  const actor = await api('/api/session');
  if (!actor.authenticated || !['box_office', 'club_admin'].includes(actor.role)) throw Error('Nimate potrebnih pravic. Prijavite se prek demo dostopa.');
  let { events, ticketTypes } = await api('/api/events');
  if (!events.length) return shell(node('section', { class: 'pos-state error' }, node('span', { text: 'BLAGAJNA' }), node('h1', { text: 'TEKMA NI NA VOLJO.' }), node('p', { text: 'Prodaje ni mogoče začeti, ker ni razpoložljive tekme.' })));
  let event = events.find((item) => item.salesOpen) || events[0];
  let paymentMethod = 'CASH';
  let busy = false;
  let quantities = {};
  const resetQuantities = () => { quantities = Object.fromEntries(ticketTypes.filter((type) => type.eventId === event.id && type.active).map((type) => [type.id, 0])); };
  resetQuantities();
  const draw = () => {
    const types = ticketTypes.filter((type) => type.eventId === event.id && type.active);
    const selected = types.filter((type) => quantities[type.id]);
    const total = selected.reduce((sum, type) => sum + quantities[type.id] * type.price, 0);
    const count = selected.reduce((sum, type) => sum + quantities[type.id], 0);
    const update = (type, delta) => { const remaining = Math.max(0, type.capacity - type.sold); const next = quantities[type.id] + delta; if (next >= 0 && next <= Math.min(10, remaining)) { quantities[type.id] = next; draw(); } else if (delta > 0 && !remaining) toast('Ta kategorija je razprodana.', 'error'); };
    const finish = async (chosenMethod, admit = false) => {
      if (!selected.length) return toast('Najprej izberite vsaj eno vstopnico.', 'error');
      if (!event.salesOpen) return toast('Prodaja za izbrano tekmo je zaprta.', 'error');
      if (busy) return;
      busy = true;
      draw();
      try {
        const completedTypes = new Map(types.map((type) => [type.id, type]));
        const response = await api('/api/box-office', { method: 'POST', body: JSON.stringify({ eventId: event.id, items: selected.map((type) => ({ ticketTypeId: type.id, quantity: quantities[type.id] })), paymentMethod: chosenMethod, admit }) });
        const ticket = response.tickets[0];
        const methodLabel = chosenMethod === 'CASH' ? 'Gotovina' : 'Kartica · zunanji terminal';
        const completedLines = response.order.items.map((item) => ({ ...item, type: completedTypes.get(item.ticketTypeId) }));
        const refreshed = await api('/api/events');
        events = refreshed.events;
        ticketTypes = refreshed.ticketTypes;
        event = events.find((item) => item.id === response.order.eventId) || event;
        busy = false;
        resetQuantities();
        document.querySelectorAll('.toast').forEach((item) => item.remove());
        const newSale = () => { paymentMethod = 'CASH'; busy = false; resetQuantities(); document.querySelectorAll('.toast').forEach((item) => item.remove()); draw(); };
        shell(node('section', { class: 'pos-success', role: 'status' }, node('div', { class: 'pos-success-icon', text: '✓' }), node('span', { text: admit ? 'PRODAJA IN VSTOP ZAKLJUČENA' : 'PRODAJA ZAKLJUČENA' }), node('h1', { text: 'PRODAJA USPEŠNA' }), node('p', { class: 'pos-success-match', text: `ND Beltinci — ${event.opponent} · ${when(event.kickoff)}` }), node('section', { class: 'pos-success-lines' }, completedLines.map((line) => node('article', {}, node('div', {}, node('strong', { text: line.type ? `${line.type.section} ${line.type.name}` : 'Vstopnica' }), node('small', { text: `${line.quantity} × ${money.format(line.price)}` })), node('strong', { text: money.format(line.quantity * line.price) })))), node('div', { class: 'pos-success-summary' }, node('p', {}, node('small', { text: 'IZDANE VSTOPNICE' }), node('strong', { text: String(response.tickets.length) })), node('p', {}, node('small', { text: 'SKUPAJ' }), node('strong', { text: money.format(response.order.amount) })), node('p', {}, node('small', { text: 'PLAČILO' }), node('strong', { text: methodLabel }))), node('p', { class: 'pos-success-reference', text: `Naročilo ${response.order.reference}${admit ? ' · vstop je že evidentiran' : ''}` }), node('p', { class: 'pos-success-tickets', text: response.tickets.map((item) => item.reference).join(' · ') }), node('div', { class: 'pos-success-actions' }, link('PRIKAŽI IZDANE VSTOPNICE', `/narocilo/${response.order.id}`, 'secondary'), ticket ? link('PRIKAŽI PRVI QR', `/vstopnica/${ticket.id}`, 'muted') : '', button('NOVA PRODAJA', 'primary', newSale))));
      } catch (error) {
        busy = false;
        draw();
        const safe = ['Prodaja za tekmo ni odprta.', 'Ena od izbranih vstopnic ni več na voljo.'];
        toast(safe.includes(error.message) ? error.message : 'Prodaje ni bilo mogoče zaključiti. Poskusite znova.', 'error');
      }
    };
    const cards = types.map((type, index) => { const remaining = Math.max(0, type.capacity - type.sold); const soldOut = remaining === 0; return node('article', { class: `ref-pos-ticket ${soldOut ? 'sold-out' : ''} ${index === types.length - 1 && types.length % 2 ? 'ref-pos-ticket-wide' : ''}` },
      node('div', { class: 'ref-ticket-copy' }, node('span', { class: `ref-ticket-index ${type.price === 0 ? 'complimentary' : ''}`, text: `${String(index + 1).padStart(2, '0')} · ${type.section.toUpperCase()}` }), node('h2', { text: type.name === 'Mladi' ? 'Tribuna Do 15 let' : `${type.section} ${type.name}` }), node('p', { text: `${Math.max(0, type.capacity - type.sold)} prostih mest` })),
      node('div', { class: `ref-ticket-price ${type.price === 0 ? 'complimentary' : ''}` }, node('strong', { text: money.format(type.price) }), node('small', { text: type.price ? '/ oseba' : 'CENA KATEGORIJE' })),
      node('div', { class: 'ref-quantity' }, button('−', 'ref-quantity-minus', () => update(type, -1)), node('output', { 'aria-label': `Količina za ${type.name}`, text: String(quantities[type.id]) }), button(soldOut ? '×' : '+', 'ref-quantity-plus', () => update(type, 1)))); });
    const basketRows = selected.length ? selected.map((type) => node('article', { class: 'ref-basket-row' }, node('div', {}, node('strong', { text: type.name === 'Mladi' ? 'Tribuna Do 15 let' : `${type.section} ${type.name}` }), node('small', { text: `${quantities[type.id]} × ${money.format(type.price)}` })), node('strong', { text: money.format(quantities[type.id] * type.price) }))) : [node('p', { class: 'ref-basket-empty', text: 'Nobena vstopnica ni izbrana.' })];
    const basket = node('aside', { class: 'ref-pos-basket' },
      node('header', { class: 'ref-basket-heading' }, node('h2', { text: '▣ TRENUTNI NAKUP' }), button('POČISTI', 'ref-clear', () => { Object.keys(quantities).forEach((key) => { quantities[key] = 0; }); draw(); })),
      node('section', { class: 'ref-basket-lines' }, basketRows),
      node('section', { class: 'ref-total-slab' }, node('div', {}, node('span', { text: 'ZA PLAČILO' }), node('small', { text: `Skupaj ${count} ${count === 1 ? 'vstopnica' : 'vstopnic'}` })), node('strong', { text: money.format(total) })),
      node('span', { class: 'ref-payment-label', text: 'NAČIN PLAČILA' }),
      node('div', { class: 'ref-payment-toggle' }, button('▣ GOTOVINA', paymentMethod === 'CASH' ? 'selected' : '', () => { paymentMethod = 'CASH'; draw(); }), button('▤ KARTICA', paymentMethod === 'CARD' ? 'selected' : '', () => { paymentMethod = 'CARD'; draw(); })),
      node('p', { class: 'ref-no-change', text: paymentMethod === 'CARD' ? 'Potrdite šele, ko je plačilo uspešno zaključeno na zunanjem POS terminalu.' : 'Gotovinsko plačilo evidentirajte po prejemu celotnega zneska.' }),
      button(busy ? 'PRODAJO ZAKLJUČUJEMO …' : '▣ ZAKLJUČI PRODAJO', 'ref-complete', () => finish(paymentMethod)),
      button(busy ? 'PRODAJO ZAKLJUČUJEMO …' : 'PRODAJ + SPUSTI NA STADION', 'ref-admit', () => finish(paymentMethod, true)));
    const selector = node('select', { class: 'ref-event-select', 'aria-label': 'Izberi tekmo' }, events.map((item) => node('option', { value: item.id, text: `ND Beltinci — ${item.opponent} · ${when(item.kickoff)}` })));
    selector.value = event.id;
    selector.addEventListener('change', () => { event = events.find((item) => item.id === selector.value) || event; resetQuantities(); draw(); });
    shell(node('section', { class: 'ref-pos-page' }, node('h1', { class: 'sr-only', text: `BELTINCI — ${event.opponent.toUpperCase()}` }),
      node('header', { class: 'ref-pos-status' }, node('span', { class: 'ref-status-pill', text: '● BLAGAJNA' }), node('div', { class: 'ref-pos-fixture' }, adminCrest('ND Beltinci', 'ref-pos-crest'), node('strong', { text: `ND BELTINCI VS ${event.opponent.toUpperCase()}` }), adminCrest(event.opponent, 'ref-pos-crest')), node('span', { class: `ref-sales-pill ${event.salesOpen ? 'open' : ''}`, text: event.salesOpen ? '◉ PRODAJA ODPRTA' : 'PRODAJA ZAPRTA' })),
      node('label', { class: 'ref-event-picker' }, node('span', { text: 'IZBRANA TEKMA' }), selector, node('small', { text: `${event.venue} · ${event.competition}` })),
      node('div', { class: 'ref-pos-layout' }, node('section', { class: 'ref-pos-catalogue' }, node('header', { class: 'ref-pos-title' }, node('h1', { text: '▣ IZBIRA KATEGORIJ' }), node('span', { text: `${types.length} AKTIVNIH KATEGORIJ` })), types.length ? node('div', { class: 'ref-pos-grid' }, cards) : node('div', { class: 'pos-state' }, node('h2', { text: 'NI AKTIVNIH KATEGORIJ.' }), node('p', { text: 'Za izbrano tekmo prodaja vstopnic ni nastavljena.' }))), basket)));
    document.querySelectorAll('.ref-complete,.ref-admit').forEach((control) => { control.disabled = busy || !count || !event.salesOpen; });
    document.querySelectorAll('.ref-pos-ticket.sold-out button').forEach((control) => { control.disabled = true; });
  };
  draw();
}
async function route() { try { const path = location.pathname; if (path !== '/scanner') stopCamera(); if (path === '/demo-login') return demoLogin(); if (path === '/prijava-za-osebje') return login(); const protectedRoute = path === '/scanner' || path === '/admin' || path.startsWith('/admin/'); if (protectedRoute) { const session = await api('/api/session'); if (!session.authenticated) return location.assign('/prijava-za-osebje'); role = session.role; } if (path === '/') return await home(); if (path === '/sezonske') return season(); if (path === '/admin') return await admin(); if (path === '/admin/tekme') return await matches(); if (path.startsWith('/admin/tekme/')) return await matchDetail(path.split('/').pop()); if (path === '/admin/vstopnice') return await ticketsAdmin(); if (path === '/admin/narocila') return await ordersAdmin(); if (path === '/admin/porocila') return await reports(); if (path === '/admin/blagajna') return await referencePos(); if (path === '/scanner') return await cameraScanner(); if (path === '/blagajna') return await checkout(); if (path.startsWith('/placilo/')) return await pay(path.split('/').pop()); if (path.startsWith('/narocilo/')) return await orderPage(path.split('/').pop()); if (path.startsWith('/vstopnica/')) return await ticketPage(path.split('/').pop()); if (path.startsWith('/vstopnice/')) return await eventPage(path.split('/').pop()); return await home(); } catch (error) { fail(error); } }
function adminCrest(club, className) {
  const source = clubAsset(club);
  return source ? node('img', { class: className, src: source, alt: `Grb ${club}` }) : node('span', { class: `${className} admin-team-fallback`, text: club.slice(0, 2).toUpperCase(), 'aria-label': `Grb za ${club} ni na voljo` });
}
function adminActivityLabel(type) {
  return ({ 'payment.confirmed': 'Plačilo potrjeno', 'order.created': 'Novo naročilo', 'box_office.sale': 'Prodaja na blagajni', 'ticket.redeemed': 'Vstop potrjen', 'ticket.cancelled': 'Vstopnica preklicana', 'event.updated': 'Tekma posodobljena' }[type] || 'Operativna dejavnost');
}
function adminShellState(kind, detail) {
  shell(node('section', { class: `admin-dashboard admin-dashboard-state ${kind}` }, node('span', { class: 'admin-state-kicker', text: kind === 'loading' ? 'PRIPRAVLJAMO PREGLED' : kind === 'empty' ? 'NI PRIHAJAJOČE TEKME' : 'PREGLED TRENUTNO NI DOSEGLJIV' }), node('h1', { text: kind === 'loading' ? 'NADZORNA PLOŠČA' : kind === 'empty' ? 'ZA ZDAJ JE MIRNO.' : 'PREGLEDA NI MOGOČE ODPRETI.' }), node('p', { text: detail }), kind === 'loading' ? node('div', { class: 'admin-state-loader', 'aria-label': 'Nalaganje', role: 'status' }) : link(kind === 'empty' ? 'UPRAVLJAJ TEKME' : 'POSKUSI ZNOVA', kind === 'empty' ? '/admin/tekme' : '/admin', 'primary')));
}
async function adminRefinementLegacy() {
  adminShellState('loading', 'Nalagam trenutno stanje kluba in naslednjo domačo tekmo.');
  let data;
  try { data = await api('/api/admin/dashboard'); } catch (error) { return adminShellState(/tekme ni mogoče najti/i.test(error.message || '') ? 'empty' : 'error', error.message || 'Poskusite znova čez nekaj trenutkov.'); }
  if (!data.event) return adminShellState('empty', 'Ko je domača tekma pripravljena za prodajo, bo njen pregled prikazan tukaj.');
  const capacity = Math.max(Number(data.capacity) || 0, Number(data.sold) || 0), sold = Number(data.sold) || 0, admitted = Number(data.admitted ?? data.scanned) || 0, remaining = Math.max(0, capacity - sold), soldPercent = capacity ? Math.round(sold / capacity * 100) : 0, admittedPercent = sold ? Math.round(admitted / sold * 100) : 0;
  const online = data.channels?.find((channel) => channel.channel === 'ONLINE') || { tickets: 0 }, onlineShare = sold ? Math.min(100, Math.round(Number(online.tickets) / sold * 10) * 10) : 0, saleState = !data.event.salesOpen ? 'PRODAJA ZAPRTA' : remaining === 0 ? 'RAZPRODANO' : 'PRODAJA ODPRTA';
  const metric = (label, value, note, tone, percent) => node('article', { class: `admin-metric ${tone}` }, node('span', { text: label }), node('strong', { text: value }), node('small', { text: note }), node('div', { class: 'admin-meter' }, node('i', { class: `share-${percent}` })));
  const channels = (data.channels || []).filter((channel) => channel.channel === 'ONLINE' || channel.channel === 'BOX_OFFICE').map((channel) => node('article', { class: 'admin-channel-card' }, node('span', { text: channel.channel === 'ONLINE' ? 'SPLETNA PRODAJA' : 'BLAGAJNA' }), node('strong', { text: `${channel.tickets} ${channel.tickets === 1 ? 'vstopnica' : 'vstopnic'}` }), node('b', { text: money.format(channel.revenue) })));
  const activity = data.recent?.length ? data.recent.slice(0, 5).map((item) => node('article', { class: 'admin-activity-row' }, node('span', { class: 'admin-activity-dot', text: item.type === 'ticket.redeemed' ? '✓' : '•' }), node('div', {}, node('strong', { text: adminActivityLabel(item.type) }), node('small', { text: item.detail })), node('time', { text: new Date(item.at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }) }))) : [node('p', { class: 'admin-empty', text: 'Še ni zabeleženih prodaj, vstopov ali sprememb.' })];
  const typeRows = (data.types || []).filter((type) => type.active).map((type) => node('li', {}, node('span', { text: `${type.section} · ${type.name}` }), node('b', { text: `${Math.max(0, type.capacity - type.sold)} prostih` })));
  shell(node('section', { class: 'admin-dashboard' }, node('div', { class: 'admin-crumb' }, node('span', { text: 'OPERATIVNA NADZORNA PLOŠČA' }), node('b', { text: '/ PREGLED V ŽIVO' }), node('i', { text: '● STANJE JE POSODOBLJENO' })), node('section', { class: 'admin-command-panel' }, node('div', { class: 'admin-command-copy' }, node('div', { class: 'admin-command-tags' }, node('span', { class: `status ${data.event.salesOpen && remaining ? 'open' : 'closed'}`, text: `● ${saleState}` }), node('span', { text: data.event.competition.toUpperCase() }), node('span', { text: data.event.venue.toUpperCase() })), node('p', { text: 'NASLEDNJA DOMAČA TEKMA' }), node('div', { class: 'admin-fixture' }, adminCrest('ND Beltinci', 'admin-team-crest'), node('h1', { text: 'ND BELTINCI ' }, node('em', { text: 'VS' }), ` ${data.event.opponent.toUpperCase()}`), adminCrest(data.event.opponent, 'admin-team-crest away')), node('div', { class: 'admin-event-meta' }, node('span', { text: `▣ ${when(data.event.kickoff)}` }), node('span', { text: `⌖ ${data.event.venue}` }), node('span', { text: `${remaining} prostih mest` }))), node('div', { class: 'admin-command-actions' }, link('UREDI TEKMO', `/admin/tekme/${data.event.id}`, 'primary'), data.event.salesOpen ? link('ODPRI BLAGAJNO', '/admin/blagajna', 'primary') : link('UREDI PRODAJO', `/admin/tekme/${data.event.id}`, 'primary'), link('VSTOPNICE', '/admin/vstopnice', 'primary'), link('POROČILA', '/admin/porocila', 'primary'))), node('section', { class: 'admin-metrics-grid' }, metric('PRODANE VSTOPNICE', `${sold} / ${capacity}`, capacity ? `${soldPercent}% ZASEDENOSTI` : 'KAPACITETA NI NASTAVLJENA', 'sales', soldPercent), metric('SKUPNI PRIHODEK', money.format(data.revenue || 0), 'POTRJENA PLAČILA', 'revenue', 100), metric('VSTOPILI NA STADION', String(admitted), sold ? `${admittedPercent}% OD PRODANIH` : 'ŠE BREZ VSTOPA', 'attendance', admittedPercent), metric('PREOSTALA KAPACITETA', String(remaining), remaining ? 'RAZPOLOŽLJIVIH MEST' : 'TEKMA JE RAZPRODANA', 'capacity', soldPercent)), node('section', { class: 'admin-dashboard-grid' }, node('article', { class: 'admin-sales-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'FINANČNA STRUKTURA' }), node('h2', { text: 'PRODAJA PO KANALIH' })), node('b', { text: `${sold} VSTOPNIC` })), node('div', { class: 'admin-sales-bar' }, node('i', { class: `admin-sales-bar-fill share-${onlineShare}` })), node('div', { class: 'admin-channel-grid' }, channels.length ? channels : node('p', { class: 'admin-empty', text: 'Za to tekmo še ni prodaje.' }))), node('article', { class: 'admin-activity-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'OPERATIVNI DOGODKI' }), node('h2', { text: 'ZADNJE DEJAVNOSTI' })), node('b', { class: 'admin-live', text: '● V ŽIVO' })), activity)), node('section', { class: 'admin-capacity-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'RAZPOLOŽLJIVOST' }), node('h2', { text: 'KATEGORIJE VSTOPNIC' })), node('b', { text: saleState })), typeRows.length ? node('ul', { class: 'admin-capacity-list' }, typeRows) : node('p', { class: 'admin-empty', text: 'Za to tekmo ni aktivnih kategorij vstopnic.' }))));
}
async function admin() {
  adminShellState('loading', 'Nalagam trenutno stanje kluba in naslednjo domačo tekmo.');
  let data;
  try { data = await api('/api/admin/dashboard'); } catch (error) { return adminShellState(/tekme ni mogoče najti/i.test(error.message || '') ? 'empty' : 'error', error.message || 'Poskusite znova čez nekaj trenutkov.'); }
  const teamName = (clubId) => String(clubId || '').split('_').filter(Boolean).map((part) => part.toLowerCase() === 'nd' ? part.toUpperCase() : `${part[0]?.toUpperCase() || ''}${part.slice(1)}`).join(' ');
  const homeTeam = teamName(data.event.clubId);
  const capacity = Number(data.capacity) || 0, paid = Number(data.paidIssued) || 0, complimentary = Number(data.complimentaryIssued) || 0, total = Number(data.totalIssued) || paid + complimentary, admitted = Number(data.admitted) || 0, remaining = Math.max(0, capacity - total), issuedPercent = capacity ? Math.round(total / capacity * 100) : 0, admittedPercent = total ? Math.round(admitted / total * 100) : 0;
  const saleState = !data.event.salesOpen ? 'PRODAJA ZAPRTA' : remaining === 0 ? 'RAZPRODANO' : 'PRODAJA ODPRTA';
  const metric = (label, value, note, tone, percent) => node('article', { class: `admin-metric ${tone}` }, node('span', { text: label }), node('strong', { text: value }), node('small', { text: note }), node('div', { class: 'admin-meter' }, node('i', { class: `share-${percent}` })));
  const channelLabel = { ONLINE: 'SPLETNA PRODAJA', BOX_OFFICE: 'BLAGAJNA', COMPLIMENTARY: 'BREZPLAČNE' };
  const channels = (data.channels || []).map((channel) => node('article', { class: `admin-channel-card ${channel.channel === 'COMPLIMENTARY' ? 'complimentary' : ''}` }, node('span', { text: channelLabel[channel.channel] || channel.channel }), node('strong', { text: `${channel.tickets} ${channel.tickets === 1 ? 'vstopnica' : 'vstopnic'}` }), node('b', { text: channel.channel === 'COMPLIMENTARY' ? '0,00 €' : money.format(channel.revenue) })));
  const typeRows = (data.types || []).filter((type) => type.active).map((type) => node('li', {}, node('span', { text: `${type.section} · ${type.name}` }), node('b', { text: `${Math.max(0, type.capacity - type.sold)} prostih` })));
  shell(node('section', { class: 'admin-dashboard admin-dashboard-refined' },
    node('div', { class: 'admin-crumb' }, node('span', { text: 'OPERATIVNA NADZORNA PLOŠČA' }), node('b', { text: '/ PREGLED V ŽIVO' }), node('i', { text: '● STANJE JE POSODOBLJENO' })),
    node('section', { class: 'admin-command-panel' }, node('div', { class: 'admin-command-copy' }, node('div', { class: 'admin-command-tags' }, node('span', { class: `status ${data.event.salesOpen && remaining ? 'open' : 'closed'}`, text: `● ${saleState}` }), node('span', { text: data.event.competition.toUpperCase() }), node('span', { text: data.event.venue.toUpperCase() })), node('p', { text: 'NASLEDNJA DOMAČA TEKMA' }), node('div', { class: 'admin-fixture' }, adminCrest(homeTeam, 'admin-team-crest'), node('h1', { class: 'admin-matchup-title' }, node('span', { class: 'admin-matchup-home', text: homeTeam }), node('em', { text: 'VS' }), node('span', { class: 'admin-matchup-opponent', text: data.event.opponent })), adminCrest(data.event.opponent, 'admin-team-crest away')), node('div', { class: 'admin-event-meta' }, node('span', { text: `▣ ${when(data.event.kickoff)}` }), node('span', { text: `⌖ ${data.event.venue}` }), node('span', { text: `${remaining} prostih mest` }))), node('div', { class: 'admin-command-actions' }, link('UREDI TEKMO', `/admin/tekme/${data.event.id}`, 'primary'), data.event.salesOpen ? link('ODPRI BLAGAJNO', '/admin/blagajna', 'primary') : link('UREDI PRODAJO', `/admin/tekme/${data.event.id}`, 'primary'), link('VSTOPNICE', '/admin/vstopnice', 'primary'), link('POROČILA', '/admin/porocila', 'primary'))),
    node('section', { class: 'admin-metrics-grid' }, metric('PRODANE VSTOPNICE', String(paid), 'PLAČLJIVO IZDANE', 'sales', issuedPercent), metric('BREZPLAČNE', String(complimentary), 'KOMPLIMENTARNO IZDANE', 'complimentary', complimentary ? issuedPercent : 0), metric('SKUPAJ IZDANE', `${total} / ${capacity}`, capacity ? `${issuedPercent}% KAPACITETE` : 'KAPACITETA NI NASTAVLJENA', 'issued', issuedPercent), metric('PREOSTALA KAPACITETA', String(remaining), remaining ? 'RAZPOLOŽLJIVIH MEST' : 'TEKMA JE RAZPRODANA', 'capacity', issuedPercent)),
    node('section', { class: 'admin-dashboard-grid' }, node('article', { class: 'admin-sales-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'PRODAJA IN VSTOP' }), node('h2', { text: 'POVZETEK TEKME' })), node('b', { text: saleState })), node('div', { class: 'admin-summary-grid' }, node('div', {}, node('span', { text: 'SKUPNI PRIHODEK' }), node('strong', { text: money.format(data.revenue || 0) }), node('small', { text: 'BREZPLAČNE VSTOPNICE: 0,00 €' })), node('div', {}, node('span', { text: 'VSTOPILI NA STADION' }), node('strong', { text: String(admitted) }), node('small', { text: total ? `${admittedPercent}% OD IZDANIH` : 'ŠE BREZ VSTOPA' }))), node('div', { class: 'admin-channel-grid' }, channels)),
    node('section', { class: 'admin-capacity-panel' }, node('div', { class: 'admin-panel-heading' }, node('div', {}, node('span', { text: 'RAZPOLOŽLJIVOST' }), node('h2', { text: 'KATEGORIJE VSTOPNIC' })), node('b', { text: saleState })), typeRows.length ? node('ul', { class: 'admin-capacity-list' }, typeRows) : node('p', { class: 'admin-empty', text: 'Za to tekmo ni aktivnih kategorij vstopnic.' }))
  )));
}
route();
