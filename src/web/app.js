const app = document.querySelector('#app');
let role = localStorage.getItem('ndb-role') || '';
let cart = JSON.parse(sessionStorage.getItem('ndb-cart') || '{}');
const money = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });
const when = (value) => new Intl.DateTimeFormat('sl-SI', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(value));
const node = (tag, attrs = {}, ...children) => { const result = document.createElement(tag); for (const [key, value] of Object.entries(attrs)) { if (key === 'class') result.className = value; else if (key === 'text') result.textContent = value; else if (key.startsWith('on')) result.addEventListener(key.slice(2).toLowerCase(), value); else result.setAttribute(key, value); } result.append(...children.flat().filter(Boolean).map((child) => typeof child === 'string' ? document.createTextNode(child) : child)); return result; };
const button = (text, kind, click) => node('button', { class: kind, onClick: click, text });
const link = (text, href, kind = 'primary') => node('a', { href }, button(text, kind));
const api = async (path, options = {}) => { const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...options.headers } }); const data = await response.json(); if (!response.ok) throw Error(data.error || 'Povezava s strežnikom ni uspela.'); return data; };
const toast = (message, kind = 'success') => { const item = node('div', { class: `toast ${kind}`, role: 'status', text: message }); document.body.append(item); setTimeout(() => item.remove(), 4200); };
const confirmDialog = ({ title, description, confirmText, onConfirm }) => { const cancel = button('PREKLIČI', 'muted', () => portal.remove()); const confirm = button(confirmText, 'danger', async () => { confirm.disabled = true; confirm.textContent = 'SHRANJUJEM …'; try { await onConfirm(); portal.remove(); } catch (error) { confirm.disabled = false; confirm.textContent = confirmText; descriptionNode.textContent = error.message || 'Sprememb ni bilo mogoče shraniti.'; } }); const descriptionNode = node('p', { text: description }); const portal = node('div', { class: 'dialog-portal', role: 'presentation' }, node('div', { class: 'dialog-overlay', onClick: () => portal.remove() }), node('section', { class: 'dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'dialog-title' }, node('h2', { id: 'dialog-title', text: title }), descriptionNode, node('div', { class: 'dialog-actions' }, cancel, confirm))); document.body.append(portal); requestAnimationFrame(() => confirm.focus()); };
const logout = async () => { try { await api('/api/logout', { method: 'POST' }); } finally { localStorage.removeItem('ndb-role'); location.assign('/'); } };
const orderToken = (id) => sessionStorage.getItem(`ndb-order-${id}`) || '';
function shell(...content) { const staffLinks = role === 'club_admin' ? [['Pregled', '/admin'], ['Tekme', '/admin/tekme'], ['Blagajna', '/admin/blagajna'], ['Vstopnice', '/admin/vstopnice'], ['Poročila', '/admin/porocila']] : role === 'box_office' ? [['Blagajna', '/admin/blagajna'], ['Današnja prodaja', '/admin/blagajna']] : role === 'gate_staff' ? [['Skener', '/scanner']] : [['Domov', '/'], ['Vstopnice', '/vstopnice'], ['Sezonske', '/sezonske']]; const home = role === 'club_admin' ? '/admin' : role === 'box_office' ? '/admin/blagajna' : role === 'gate_staff' ? '/scanner' : '/'; const nav = node('nav', { class: 'nav' }, node('a', { class: 'brand', href: home }, node('span', { class: 'crest', text: 'NDB' }), node('span', { text: 'ND BELTINCI' }, node('br'), node('small', { text: role ? 'OSEBJE' : 'VSTOPNICE' }))), node('div', { class: 'links' }, staffLinks.map(([label, href]) => node('a', { class: location.pathname === href ? 'active' : '', href, text: label }))), role ? button('ODJAVA', 'switch-role', logout) : '', node('span', { class: 'demo', text: 'Demonstracijski sistem' })); app.replaceChildren(nav, node('main', { class: 'wrap' }, content)); }
function fail(error) { shell(node('section', { class: 'card' }, node('h1', { text: 'Nekaj ni uspelo' }), node('p', { text: error.message || 'Poskusite znova.' }), link('PRIJAVA', '/demo-login', 'primary'), document.createTextNode(' '), link('NAZAJ', '/', 'muted'))); }
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
const scanText = { accepted: ['✓', 'VSTOPNICA JE VELJAVNA', 'VSTOP DOVOLJEN'], already_used: ['✕', 'VSTOPNICA NI VELJAVNA', 'VSTOP NI DOVOLJEN'], invalid: ['✕', 'VSTOPNICA NI VELJAVNA', 'VSTOP NI DOVOLJEN'], wrong_event: ['✕', 'VSTOPNICA NI VELJAVNA', 'VSTOP NI DOVOLJEN'], cancelled: ['✕', 'VSTOPNICA NI VELJAVNA', 'VSTOP NI DOVOLJEN'], network_error: ['!', 'VSTOPNICE NI MOGOČE PREVERITI', 'Preverite internetno povezavo in poskusite znova.'] };
async function scanner() { const actor = await api('/api/session'); if (!actor.authenticated || !['gate_staff', 'club_admin'].includes(actor.role)) throw Error('Nimate potrebnih pravic. Prijavite se prek demo dostopa.'); const { events } = await api('/api/events'); let selectedEvent = events[0]; let selectedGate = ''; const gates = ['Vhod 1 — Stojišče', 'Vhod 2 — Stojišče', 'Vhod 3 — Tribuna']; const setup = () => { const match = node('select', {}, events.map((item) => node('option', { value: item.id, text: `Beltinci — ${item.opponent}` }))); match.addEventListener('change', () => { selectedEvent = events.find((item) => item.id === match.value); }); const gateButtons = gates.map((gate) => button(gate.toUpperCase(), selectedGate === gate ? 'primary gate-option selected' : 'muted gate-option', () => { selectedGate = gate; setup(); })); shell(node('section', { class: 'scanner-setup' }, node('div', { class: 'eyebrow', text: 'VSTOP NA STADION' }), node('h1', { text: 'Priprava skenerja' }), node('label', { class: 'setup-label' }, 'TEKMA', match), node('div', { class: 'setup-label', text: 'VHOD' }), node('div', { class: 'gate-options' }, gateButtons), button('ZAČNI SKENIRANJE', 'primary start-scan', () => { if (selectedGate) active(); else setup(); }))); }; const active = () => { const output = node('div'); const code = node('input', { required: '', placeholder: 'ndb_…', autocomplete: 'off' }); let busy = false; const validate = async (credential) => { if (busy || typeof credential !== 'string' || credential.length > 250) return; busy = true; let result; try { result = await api('/api/scans', { method: 'POST', body: JSON.stringify({ eventId: selectedEvent.id, gate: selectedGate, credential }) }); } catch { result = { result: 'network_error' }; } finally { busy = false; } const text = scanText[result.result] || scanText.invalid; output.replaceChildren(node('div', { class: `result ${result.result}` }, node('div', {}, node('div', { class: 'result-icon', text: text[0] }), node('h1', { text: text[1] }), node('h2', { text: text[2] }), result.ticket ? node('p', { text: `${result.ticket.type?.section || ''} ${result.ticket.type?.name || ''}` }) : ''))); if (result.result === 'accepted' && navigator.vibrate) navigator.vibrate(100); setTimeout(() => { output.replaceChildren(); code.focus(); }, result.result === 'accepted' ? 1400 : 2400); }; const form = node('form', { class: 'scan-entry' }, node('label', {}, 'VNESI KODO ROČNO', code), button('PREVERI', 'primary large')); form.addEventListener('submit', (submit) => { submit.preventDefault(); validate(code.value); }); shell(node('section', { class: 'scanner-active' }, node('div', { class: 'scanner-topline' }, node('div', {}, node('strong', { text: `BELTINCI — ${selectedEvent.opponent.toUpperCase()}` }), node('span', { text: selectedGate.toUpperCase() })), button('SPREMENI VHOD', 'muted', setup)), node('div', { class: 'scan-zone' }, node('div', { class: 'scan-symbol', text: '⌁' }), node('h1', { text: 'SKENIRAJ VSTOPNICO' }), node('p', { text: 'Usmerite QR kodo proti kameri ali vnesite kodo ročno.' })), form, output)); }; setup(); }
let cameraStream = null;
let cameraFrame = 0;
let cameraResultTimer = 0;
const stopCamera = () => {
  if (cameraFrame) cancelAnimationFrame(cameraFrame);
  if (cameraResultTimer) clearTimeout(cameraResultTimer);
  cameraFrame = 0;
  cameraResultTimer = 0;
  if (cameraStream) cameraStream.getTracks().forEach((track) => track.stop());
  cameraStream = null;
};
window.addEventListener('pagehide', stopCamera);
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
  let selectedGate = '';
  const gates = ['Vhod 1 — Stojišče', 'Vhod 2 — Stojišče', 'Vhod 3 — Tribuna'];
  const setup = () => {
    stopCamera();
    const match = node('select', {}, events.map((item) => node('option', { value: item.id, text: `Beltinci — ${item.opponent}` })));
    match.value = selectedEvent.id;
    match.addEventListener('change', () => { selectedEvent = events.find((item) => item.id === match.value) || selectedEvent; });
    const choices = gates.map((gate) => button(gate.toUpperCase(), selectedGate === gate ? 'primary gate-option selected' : 'muted gate-option', () => { selectedGate = gate; setup(); }));
    shell(node('section', { class: 'scanner-setup' }, node('div', { class: 'eyebrow', text: 'SKENIRANJE VSTOPNIC' }), node('h1', { text: 'Priprava skenerja' }), node('label', { class: 'setup-label' }, 'TEKMA', match), node('div', { class: 'setup-label', text: 'VHOD' }), node('div', { class: 'gate-options' }, choices), button('ZAČNI SKENIRANJE', 'primary start-scan', () => { if (selectedGate) active(true); })));
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
      // Admission is a deliberate lock: keep keyboard focus inside the body portal
      // until the steward explicitly confirms the result.
      const dialog = content.matches?.('[role="alertdialog"]') ? content : content.querySelector?.('[role="alertdialog"]');
      dialog?.addEventListener('keydown', (event) => {
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
      const extra = result.result === 'already_used' && admission ? `Prvi vstop: ${new Date(admission.scannedAt).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' })} · ${admission.gate}` : '';
      const kind = result.result === 'accepted' ? 'accepted' : result.result === 'network_error' ? 'network_error' : 'rejected';
      const continueScanning = () => { resultModal?.remove(); resultModal = null; ignoredCredential = credentialValue; ignoreUntil = Date.now() + 1800; state = cameraStream ? 'scanning' : 'idle'; message.textContent = cameraStream ? 'POSTAVITE QR KODO V OKVIR.' : 'Kamera ni aktivna. Uporabite ročni vnos ali znova zaženite kamero.'; if (cameraStream) resumeDecoding(); else manualCode.focus(); };
      const retry = () => { resultModal?.remove(); resultModal = null; state = 'qr_detected'; void validate(credentialValue); };
      const description = result.result === 'accepted' ? 'Vstopnica je bila uspešno potrjena.' : result.result === 'already_used' ? 'Vstopnica je že bila uporabljena.' : result.result === 'cancelled' ? 'Vstopnica je preklicana.' : result.result === 'wrong_event' ? 'Vstopnica ni za to tekmo.' : result.result === 'invalid' ? 'Vstopnice ni mogoče potrditi.' : copy[2];
      const confirmation = button(result.result === 'network_error' ? 'ZAPRI' : 'POTRDI', 'scanner-result-continue', continueScanning);
      resultModal = mountAlertDialog(kind, node('section', { class: 'scanner-result-modal alert-dialog-content', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'scanner-result-title', 'aria-describedby': 'scanner-result-description' }, node('div', { class: 'scanner-result-panel' }, node('div', { class: 'scanner-result-icon', 'aria-hidden': 'true', text: copy[0] }), node('header', { class: 'alert-dialog-header' }, node('h1', { id: 'scanner-result-title', text: copy[1] }), node('h2', { text: copy[2] }), node('p', { id: 'scanner-result-description', class: 'scanner-result-detail', text: description }), extra ? node('p', { class: 'scanner-result-extra', text: extra }) : ''), node('footer', { class: 'scanner-result-actions alert-dialog-footer' }, result.result === 'network_error' ? button('POSKUSI ZNOVA', 'scanner-result-retry', retry) : '', confirmation))));
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
      try { result = await api('/api/scans', { method: 'POST', body: JSON.stringify({ eventId: selectedEvent.id, gate: selectedGate, credential: credentialValue }) }); }
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
    manual.addEventListener('submit', (event) => { event.preventDefault(); validate(manualCode.value); });
    shell(node('section', { class: 'scanner-active' }, node('div', { class: 'scanner-topline' }, node('div', {}, node('span', { class: 'scanner-match-label', text: 'TEKMA IN VHOD' }), node('strong', { text: `BELTINCI — ${selectedEvent.opponent.toUpperCase()}` }), node('span', { text: selectedGate.toUpperCase() })), button('SPREMENI VHOD', 'muted', setup), node('div', { class: 'scanner-gate-detail' }, node('b', { text: selectedGate.toUpperCase() }), node('span', { text: 'SKENER PRIPRAVLJEN ZA PREVERJANJE' }))), node('section', { class: 'camera-zone' }, video, node('div', { class: 'camera-frame', 'aria-hidden': 'true' }), node('div', { class: 'camera-copy' }, node('h1', { text: 'SKENIRAJ VSTOPNICO' }), node('p', { class: 'camera-caption', text: 'Usmerite QR kodo v okvir.' }))), message, node('div', { class: 'scanner-actions' }, cameraButton, manualToggle), manual, output));
    document.querySelector('.nav')?.append(node('div', { class: 'scanner-live-status' }, node('span', { text: '● POVEZAN' }), node('small', { text: actor.role === 'gate_staff' ? 'VARNOSTNIK' : 'ADMINISTRATOR' })));
    if (startImmediately) void startCamera();
  };
  setup();
}
function login() { const choose = (chosen, destination) => async () => { try { const result = await api('/api/demo-login', { method: 'POST', body: JSON.stringify({ role: chosen }) }); role = result.role; localStorage.setItem('ndb-role', role); location.assign(destination); } catch (error) { fail(error); } }; const choice = (title, description, kind, selected, destination) => node('button', { class: `role-choice ${kind}`, onClick: choose(selected, destination) }, node('strong', { text: title }), node('span', { text: description })); shell(node('section', { class: 'login-workspace' }, node('div', { class: 'eyebrow', text: 'DEMONSTRACIJSKI DOSTOP' }), node('h1', { text: 'KDO STE?' }), node('p', { class: 'lead', text: 'Izberite delovno okolje za svojo nalogo.' }), node('div', { class: 'role-choices' }, choice('ADMINISTRATOR', 'Upravljanje tekem, prodaje in poročil', 'primary', 'club_admin', '/admin'), choice('BLAGAJNIK', 'Prodaja vstopnic na blagajni', 'secondary', 'box_office', '/admin/blagajna'), choice('VARNOSTNIK', 'Preverjanje vstopnic na vhodu', 'muted', 'gate_staff', '/scanner')))); }
async function admin() {
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
async function matches() { const { events, ticketTypes } = await api('/api/admin/events'); const metric = (label, value, detail, tone = '') => node('article', { class: `matches-metric ${tone}` }, node('span', { text: label }), node('strong', { text: value }), node('small', { text: detail })); const saleLabel = (event) => event.salesOpen ? '● PRODAJA ODPRTA' : new Date(event.salesStart) > new Date() ? 'PRODAJA ŠE NI ODPRTA' : 'PRODAJA USTAVLJENA'; const totalCapacity = ticketTypes.reduce((sum, type) => sum + type.capacity, 0); const totalSold = ticketTypes.reduce((sum, type) => sum + type.sold, 0); const revenue = ticketTypes.reduce((sum, type) => sum + type.sold * type.price, 0); const rows = events.map((event) => { const types = ticketTypes.filter((type) => type.eventId === event.id); const capacity = types.reduce((sum, type) => sum + type.capacity, 0); const sold = types.reduce((sum, type) => sum + type.sold, 0); const eventRevenue = types.reduce((sum, type) => sum + type.sold * type.price, 0); const percentage = capacity ? Math.round((sold / capacity) * 100) : 0; return node('article', { class: `match-management-row ${event.salesOpen ? 'open' : 'closed'}` }, node('div', { class: 'match-management-main' }, node('div', { class: 'match-management-tags' }, node('span', { class: `sale-badge ${event.salesOpen ? 'open' : 'closed'}`, text: saleLabel(event) }), node('span', { text: event.competition.toUpperCase() })), node('h2', { text: `ND BELTINCI ` }, node('em', { text: 'VS' }), ` ${event.opponent.toUpperCase()}`), node('p', { text: `▣ ${when(event.kickoff)}    ◷ ${event.venue}` })), node('div', { class: 'match-management-occupancy' }, node('strong', { text: `${percentage}%` }), node('span', { text: 'ZASEDENO' })), node('div', { class: 'match-management-stat' }, node('span', { text: 'VSTOPNICE' }), node('strong', { text: `${sold} / ${capacity}` }), node('small', { text: `${Math.max(0, capacity - sold)} ŠE NA VOLJO` })), node('div', { class: 'match-management-stat revenue' }, node('span', { text: 'SKUPNI PRIHODEK' }), node('strong', { text: money.format(eventRevenue) }), node('small', { text: 'IZ PRODANIH KATEGORIJ' })), node('div', { class: 'match-management-actions' }, link('UREDI TEKMO', `/admin/tekme/${event.id}`, 'muted'), event.salesOpen ? link('BLAGAJNA', '/admin/blagajna', 'secondary') : link('ODPRI PRODAJO', `/admin/tekme/${event.id}`, 'primary'))); }); shell(node('section', { class: 'matches-heading' }, node('div', { class: 'eyebrow', text: 'SEZONA · UPRAVLJANJE DOGODKOV' }), node('h1', { text: 'UPRAVLJANJE TEKEM' }), node('p', { text: 'Centraliziran pregled domačih tekem, spremljanje prodaje in urejanje razpoložljivih kategorij.' })), node('section', { class: 'matches-metrics' }, metric('SKUPNA ZASEDENOST', `${totalSold} / ${totalCapacity}`, totalCapacity ? `${Math.round((totalSold / totalCapacity) * 100)}% PRODAJNIH KAPACITET` : 'NI KAPACITET'), metric('SKUPNI IZKUPIČEK', money.format(revenue), 'IZ TRENUTNO EVIDENTIRANE PRODAJE', 'yellow'), metric('AKTIVNE BLAGAJNE', `${events.filter((event) => event.salesOpen).length} TEKME`, 'ODPRTA PRODAJA', 'green'), metric('STADION KAPACITETA', String(Math.max(...events.map((event) => ticketTypes.filter((type) => type.eventId === event.id).reduce((sum, type) => sum + type.capacity, 0)), 0)), 'NAJVEČJA KAPACITETA TEKME')), node('section', { class: 'matches-filter' }, node('b', { text: `VSE TEKME  ${events.length}` }), node('span', { text: `ODPRTA PRODAJA  ${events.filter((event) => event.salesOpen).length}` }), node('span', { text: 'UREJANJE Z REALNIMI PODATKI' })), node('section', { class: 'match-management-list' }, rows)); }
const localDateTime = (value) => { const instant = new Date(value); const local = new Date(instant.getTime() - instant.getTimezoneOffset() * 60_000); return { date: local.toISOString().slice(0, 10), time: local.toISOString().slice(11, 16) }; };
async function matchDetail(id) {
  const { events, ticketTypes } = await api('/api/admin/events');
  const event = events.find((item) => item.id === id);
  if (!event) throw Error('Tekme ni mogoče najti.');
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
  const feedback = node('p', { class: 'save-feedback', 'aria-live': 'polite' });
  const field = (label, input) => node('label', { class: 'match-field' }, label, input);
  const form = node('form', { class: 'form card match-form' });
  const typeRows = ticketTypes.filter((type) => type.eventId === id).map((type) => {
    const price = node('input', { type: 'number', min: '0', step: '0.01', required: '', value: String(type.price), 'aria-label': `Cena ${type.section} ${type.name}` });
    const capacity = node('input', { type: 'number', min: String(type.sold), step: '1', required: '', value: String(type.capacity), 'aria-label': `Kapaciteta ${type.section} ${type.name}` });
    const active = node('input', { type: 'checkbox', 'aria-label': `Aktivna ${type.section} ${type.name}` }); active.checked = type.active;
    return { type, price, capacity, active, row: node('article', { class: 'ticket-type-editor' }, node('div', {}, node('strong', { text: `${type.section} — ${type.name}` }), node('span', { class: 'meta', text: `${type.sold} prodanih` })), node('label', {}, 'Cena', price), node('label', {}, 'Kapaciteta', capacity), node('label', { class: 'type-active' }, active, 'Na voljo') ) };
  });
  const save = async (salesOpen = status.value === 'open') => {
    if (!form.reportValidity()) return;
    feedback.textContent = 'Shranjujem spremembe …';
    const submit = form.querySelector('[type="submit"]'); if (submit) submit.disabled = true;
    try {
      const response = await api(`/api/admin/events/${event.id}`, { method: 'PUT', body: JSON.stringify({ opponent: opponent.value, competition: competition.value, venue: venue.value, kickoff: `${date.value}T${time.value}`, salesStart: saleStart.value, salesEnd: saleEnd.value, salesOpen, ticketTypes: typeRows.map(({ type, price, capacity, active }) => ({ id: type.id, price: Number(price.value), capacity: Number(capacity.value), active: active.checked })) }) });
      status.value = response.event.salesOpen ? 'open' : 'closed';
      feedback.textContent = '✓ Spremembe so shranjene.'; toast('Spremembe so shranjene.');
      document.title = `ND Beltinci — ${response.event.opponent}`;
    } catch (error) { feedback.textContent = error.message || 'Sprememb ni bilo mogoče shraniti.'; } finally { if (submit) submit.disabled = false; }
  };
  form.append(node('h2', { text: 'OSNOVNI PODATKI' }), field('Nasprotnik', opponent), field('Tekmovanje', competition), node('div', { class: 'match-date-time' }, field('Datum', date), field('Čas začetka', time)), field('Prizorišče', venue), node('h2', { text: 'PRODAJA' }), field('Status prodaje', status), field('Začetek prodaje', saleStart), field('Konec prodaje', saleEnd), node('div', { class: 'action-row' }, node('button', { class: 'secondary', type: 'button', text: 'ODPRI PRODAJO', onClick: () => { status.value = 'open'; save(true); } }), node('button', { class: 'muted', type: 'button', text: 'USTAVI PRODAJO', onClick: () => confirmDialog({ title: 'Ustavim prodajo?', description: 'Nove spletne in blagajniške prodaje ne bodo več mogoče. Že izdane vstopnice bodo še vedno veljavne.', confirmText: 'USTAVI PRODAJO', onConfirm: async () => { status.value = 'closed'; await save(false); } }) })), node('h2', { text: 'KATEGORIJE VSTOPNIC' }), node('div', { class: 'ticket-type-editors' }, typeRows.map(({ row }) => row)), button('SHRANI SPREMEMBE', 'primary large'), feedback);
  form.addEventListener('submit', (submit) => { submit.preventDefault(); save(); });
  shell(link('← NAZAJ NA TEKME', '/admin/tekme', 'muted'), node('div', { class: 'eyebrow', text: 'UREJANJE TEKME' }), node('h1', { text: `BELTINCI — ${event.opponent.toUpperCase()}` }), node('p', { class: 'meta', text: `${event.competition} · ${when(event.kickoff)}` }), form);
}
async function ticketsAdmin() {
  const { tickets } = await api('/api/admin/tickets');
  const events = [...new Map(tickets.filter((ticket) => ticket.event).map((ticket) => [ticket.event.id, ticket.event])).values()];
  const statusOf = (ticket) => ticket.status === 'CANCELLED' ? 'cancelled' : ticket.admissions.length ? 'redeemed' : 'valid';
  const statusCopy = { valid: 'VELJAVNA', redeemed: 'UPORABLJENA', cancelled: 'PREKLICANA' };
  const metrics = [
    ['SKUPAJ VELJAVNIH', tickets.filter((ticket) => statusOf(ticket) === 'valid').length, 'PRIPRAVLJENIH ZA VSTOP', 'yellow'],
    ['PREHODI SKOZI VRATA', tickets.filter((ticket) => statusOf(ticket) === 'redeemed').length, 'EVIDENTIRANE POTRDITVE', 'green'],
  ].map(([label, value, detail, tone]) => node('article', { class: `ticket-admin-metric ${tone}` }, node('span', { text: label }), node('strong', { text: String(value) }), node('small', { text: detail })));
  const list = node('section', { class: 'ticket-result-list' });
  const search = node('input', { type: 'search', placeholder: 'Koda vstopnice, naročilo, kupec ali tekma', autocomplete: 'off' });
  const status = node('select', {}, node('option', { value: 'all', text: 'Vsi statusi' }), node('option', { value: 'valid', text: 'Veljavna' }), node('option', { value: 'redeemed', text: 'Uporabljena' }), node('option', { value: 'cancelled', text: 'Preklicana' }));
  const eventFilter = node('select', {}, node('option', { value: 'all', text: 'Vse tekme' }), events.map((event) => node('option', { value: event.id, text: `ND Beltinci vs ${event.opponent}` })));
  const channel = node('select', {}, node('option', { value: 'all', text: 'Vsi kanali' }), node('option', { value: 'ONLINE', text: 'Spletna prodaja' }), node('option', { value: 'BOX_OFFICE', text: 'Blagajna' }));
  const draw = () => {
    const query = search.value.trim().toLocaleLowerCase('sl-SI');
    const found = tickets.filter((ticket) => {
      const index = `${ticket.reference} ${ticket.order.reference} ${ticket.order.customer.firstName} ${ticket.order.customer.lastName} ${ticket.order.customer.email} ${ticket.event.opponent} ${ticket.type.section} ${ticket.type.name}`.toLocaleLowerCase('sl-SI');
      return (!query || index.includes(query)) && (status.value === 'all' || statusOf(ticket) === status.value) && (eventFilter.value === 'all' || ticket.event.id === eventFilter.value) && (channel.value === 'all' || ticket.order.channel === channel.value);
    });
    const rows = found.map((ticket) => {
      const ticketStatus = statusOf(ticket);
      const admission = ticket.admissions.at(-1);
      const stateDetail = ticketStatus === 'redeemed' ? `VSTOP: ${admission?.gate || 'evidentiran'} · ${admission ? new Date(admission.at).toLocaleTimeString('sl-SI', { hour: '2-digit', minute: '2-digit' }) : ''}` : ticketStatus === 'cancelled' ? 'VSTOP ZAVRNJEN' : 'ŠE NI VSTOPIL';
      const cancel = ticket.status === 'VALID' ? button('PREKLIČI VSTOPNICO', 'danger ticket-cancel', () => confirmDialog({ title: 'Prekličem vstopnico?', description: 'Vstopnica ne bo več veljavna za vstop. Tega dejanja ni mogoče razveljaviti.', confirmText: 'PREKLIČI VSTOPNICO', onConfirm: async () => { await api(`/api/admin/tickets/${ticket.id}/cancel`, { method: 'POST' }); toast('Vstopnica je preklicana.'); await ticketsAdmin(); } })) : node('span', { class: 'ticket-disabled-action', text: 'PREKLIC NI NA VOLJO' });
      return node('article', { class: `ticket-admin-row ${ticketStatus}` },
        node('div', { class: 'ticket-admin-id' }, node('strong', { text: `◉ ${ticket.reference}` }), node('div', {}, node('span', { class: `ticket-state ${ticketStatus}`, text: statusCopy[ticketStatus] }), node('span', { class: 'ticket-admission-state', text: stateDetail }))),
        node('div', { class: 'ticket-admin-event' }, node('span', { text: 'TEKMA & ČAS' }), node('strong', { text: `ND BELTINCI VS ${ticket.event.opponent.toUpperCase()}` }), node('small', { text: `${when(ticket.event.kickoff)} · ${ticket.event.venue}` })),
        node('div', { class: 'ticket-admin-owner' }, node('span', { text: 'IMETNIK & KONTAKT' }), node('strong', { text: `${ticket.order.customer.firstName} ${ticket.order.customer.lastName}` }), node('small', { text: ticket.order.customer.email })),
        node('div', { class: 'ticket-admin-type' }, node('span', { text: 'SEKTOR, KATEGORIJA & CENA' }), node('strong', { text: ticket.type.section }), node('small', { text: `${ticket.type.name} · ${money.format(ticket.type.price)} · ${ticket.order.channel === 'ONLINE' ? 'SPLET' : 'BLAGAJNA'}` })),
        node('div', { class: 'ticket-admin-actions' }, link('PODROBNOSTI', `/vstopnica/${ticket.id}`, 'secondary'), cancel));
    });
    list.replaceChildren(node('div', { class: 'ticket-result-command' }, node('b', { text: `● REZULTATI ISKANJA: ${found.length} / ${tickets.length}` }), node('span', { text: 'PODATKI IZ DEJANSKO IZDANIH VSTOPNIC' })), ...(rows.length ? rows : [node('article', { class: 'ticket-admin-empty' }, node('strong', { text: 'NI UJEMAJOČIH VSTOPNIC' }), node('p', { text: 'Spremenite iskalni niz ali aktivne filtre.' }))]));
  };
  [search, status, eventFilter, channel].forEach((control) => control.addEventListener('input', draw));
  draw();
  shell(node('section', { class: 'ticket-admin-heading' }, node('div', { class: 'eyebrow', text: 'MODUL VSTOPNIC // NADZORNA TOČKA' }), node('h1', { text: 'UPRAVLJANJE IN ISKALNIK VSTOPNIC' }), node('p', { text: 'Hitra verifikacija in operativni nadzor nad dejansko izdanimi, skeniranimi in preklicanimi vstopnicami.' }), node('div', { class: 'ticket-admin-metrics' }, metrics)), node('section', { class: 'ticket-search-panel' }, node('div', { class: 'ticket-search-main' }, search, button('POIŠČI V BAZI', 'primary', draw)), node('div', { class: 'ticket-search-filters' }, node('label', {}, 'STATUS VSTOPNICE', status), node('label', {}, 'IZBIRA TEKME', eventFilter), node('label', {}, 'PRODAJNI KANAL', channel))), list);
}
async function reports() { const data = await api('/api/admin/report'); const stats = [['Prodane vstopnice', data.sold], ['Prihodek', money.format(data.revenue)], ['Vstopilo', data.admitted], ['Ni še vstopilo', data.remaining]].map(([label, value]) => node('article', { class: 'stat' }, node('span', { text: label }), node('strong', { text: String(value) }))); const channels = data.channels.map((row) => node('p', { text: `${row.channel === 'ONLINE' ? 'Splet' : row.channel === 'BOX_OFFICE' ? 'Blagajna' : 'Brezplačne'}: ${row.tickets} · ${money.format(row.revenue)}` })); const categories = data.types.map((type) => node('p', { text: `${type.section} — ${type.name}: ${type.sold}/${type.capacity}` })); shell(node('div', { class: 'eyebrow', text: 'POROČILO TEKME' }), node('h1', { text: `BELTINCI — ${data.event.opponent.toUpperCase()}` }), node('section', { class: 'statgrid' }, stats), node('section', { class: 'admin-secondary' }, node('article', { class: 'card' }, node('h2', { text: 'PRODAJA' }), channels), node('article', { class: 'card' }, node('h2', { text: 'KATEGORIJE' }), categories))); }
function season() { shell(node('section', { class: 'hero' }, node('div', { class: 'eyebrow', text: 'SEZONSKA VSTOPNICA · DEMO' }), node('h1', { text: 'V vseh domačih trenutkih skupaj.' }), node('p', { text: 'Vse domače ligaške tekme, domače pokalne tekme in javne pripravljalne tekme.' }), node('h2', { text: '120,00 €' }))); }

// Pixel-led reconstruction of supplied POS reference. It uses only the real
// catalogue and box-office endpoint; reference-only cash/printer telemetry is
// deliberately not fabricated.
async function referencePos() {
  document.body.classList.add('reference-pos');
  const actor = await api('/api/session');
  if (!actor.authenticated || !['box_office', 'club_admin'].includes(actor.role)) throw Error('Nimate potrebnih pravic. Prijavite se prek demo dostopa.');
  const { events, ticketTypes } = await api('/api/events');
  const event = events[0];
  const types = ticketTypes.filter((type) => type.eventId === event.id);
  const quantities = Object.fromEntries(types.map((type) => [type.id, 0]));
  const draw = () => {
    const selected = types.filter((type) => quantities[type.id]);
    const total = selected.reduce((sum, type) => sum + quantities[type.id] * type.price, 0);
    const count = selected.reduce((sum, type) => sum + quantities[type.id], 0);
    const update = (type, delta) => { const next = quantities[type.id] + delta; if (next >= 0 && next <= Math.min(10, type.capacity - type.sold)) { quantities[type.id] = next; draw(); } };
    const finish = async (paymentMethod, admit = false) => {
      if (!selected.length) return toast('Najprej izberite vsaj eno vstopnico.', 'error');
      try {
        const response = await api('/api/box-office', { method: 'POST', body: JSON.stringify({ eventId: event.id, items: selected.map((type) => ({ ticketTypeId: type.id, quantity: quantities[type.id] })), paymentMethod, admit }) });
        const ticket = response.tickets[0];
        shell(node('section', { class: 'sale-success ref-sale-success' }, node('div', { class: 'result-icon', text: '✓' }), node('h1', { text: 'PRODAJA USPEŠNA' }), node('p', { text: `${response.tickets.length} vstopnic · ${money.format(response.order.amount)}` }), button('NATISNI VSTOPNICE', 'primary large', () => location.assign(`/narocilo/${response.order.id}`)), button('PRIKAŽI QR', 'secondary large', () => location.assign(`/vstopnica/${ticket.id}`)), button('NOVA PRODAJA', 'muted', () => { Object.keys(quantities).forEach((key) => { quantities[key] = 0; }); draw(); })));
      } catch (error) { fail(error); }
    };
    const cards = types.map((type, index) => node('article', { class: `ref-pos-ticket ${index === types.length - 1 && types.length % 2 ? 'ref-pos-ticket-wide' : ''}` },
      node('div', { class: 'ref-ticket-copy' }, node('span', { class: `ref-ticket-index ${type.price === 0 ? 'complimentary' : ''}`, text: `${String(index + 1).padStart(2, '0')} · ${type.section.toUpperCase()}` }), node('h2', { text: type.name === 'Mladi' ? 'Tribuna Do 15 let' : `${type.section} ${type.name}` }), node('p', { text: `${Math.max(0, type.capacity - type.sold)} prostih mest` })),
      node('div', { class: `ref-ticket-price ${type.price === 0 ? 'complimentary' : ''}` }, node('strong', { text: type.price ? money.format(type.price) : '0,00 €' }), node('small', { text: type.price ? '/ oseba' : 'GRATIS' })),
      node('div', { class: 'ref-quantity' }, button('−', 'ref-quantity-minus', () => update(type, -1)), node('output', { text: String(quantities[type.id]) }), button('+', 'ref-quantity-plus', () => update(type, 1)))));
    const basketRows = selected.length ? selected.map((type) => node('article', { class: 'ref-basket-row' }, node('div', {}, node('strong', { text: type.name === 'Mladi' ? 'Tribuna Do 15 let' : `${type.section} ${type.name}` }), node('small', { text: `${quantities[type.id]} × ${money.format(type.price)}` })), node('strong', { text: money.format(quantities[type.id] * type.price) }))) : [node('p', { class: 'ref-basket-empty', text: 'Nobena vstopnica ni izbrana.' })];
    const basket = node('aside', { class: 'ref-pos-basket' },
      node('header', { class: 'ref-basket-heading' }, node('h2', { text: '▣ TRENUTNI NAKUP' }), button('POČISTI', 'ref-clear', () => { Object.keys(quantities).forEach((key) => { quantities[key] = 0; }); draw(); })),
      node('section', { class: 'ref-basket-lines' }, basketRows),
      node('section', { class: 'ref-total-slab' }, node('div', {}, node('span', { text: 'ZA PLAČILO' }), node('small', { text: `Skupaj ${count} ${count === 1 ? 'vstopnica' : 'vstopnic'}` })), node('strong', { text: money.format(total) })),
      node('span', { class: 'ref-payment-label', text: 'NAČIN PLAČILA' }),
      node('div', { class: 'ref-payment-toggle' }, button('▣ GOTOVINA', 'ref-cash', () => finish('CASH')), button('▤ POS KARTICA', 'ref-card', () => finish('CARD'))),
      node('p', { class: 'ref-no-change', text: 'Znesek prejema in vračilo se prikažeta, ko ju podpira blagajniški tok.' }),
      button('▣ ZAKLJUČI IN NATISNI VSTOPNICE', 'ref-complete', () => finish('CASH')),
      button('PRODAJ + SPUSTI NA STADION', 'ref-admit', () => finish('CASH', true)));
    shell(node('section', { class: 'ref-pos-page' }, node('h1', { class: 'sr-only', text: `BELTINCI — ${event.opponent.toUpperCase()}` }),
      node('header', { class: 'ref-pos-status' }, node('span', { class: 'ref-status-pill', text: '● BLAGAJNA' }), node('strong', { text: `▣ ND BELTINCI VS ${event.opponent.toUpperCase()}` }), node('span', { class: `ref-sales-pill ${event.salesOpen ? 'open' : ''}`, text: event.salesOpen ? '◉ PRODAJA ODPRTA' : 'PRODAJA ZAPRTA' })),
      node('div', { class: 'ref-pos-layout' }, node('section', { class: 'ref-pos-catalogue' }, node('header', { class: 'ref-pos-title' }, node('h1', { text: '▣ IZBIRA KATEGORIJ' }), node('span', { text: 'HITRE TIPKE: [1] do [5]' })), node('div', { class: 'ref-pos-grid' }, cards)), basket)));
  };
  draw();
}
async function route() { try { const path = location.pathname; if (path !== '/scanner') stopCamera(); if (path === '/') return await home(); if (path === '/demo-login' || path === '/prijava-za-osebje') return login(); if (path === '/sezonske') return season(); if (path === '/admin') return await admin(); if (path === '/admin/tekme') return await matches(); if (path.startsWith('/admin/tekme/')) return await matchDetail(path.split('/').pop()); if (path === '/admin/vstopnice') return await ticketsAdmin(); if (path === '/admin/porocila') return await reports(); if (path === '/admin/blagajna') return await referencePos(); if (path === '/scanner') return await cameraScanner(); if (path === '/blagajna') return await checkout(); if (path.startsWith('/placilo/')) return await pay(path.split('/').pop()); if (path.startsWith('/narocilo/')) return await orderPage(path.split('/').pop()); if (path.startsWith('/vstopnica/')) return await ticketPage(path.split('/').pop()); if (path.startsWith('/vstopnice/')) return await eventPage(path.split('/').pop()); return await home(); } catch (error) { fail(error); } }
route();
