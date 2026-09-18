import { clubAsset } from '/assets/clubs/manifest.js';

const app = document.querySelector('#public-app');
const euro = new Intl.NumberFormat('sl-SI', { style: 'currency', currency: 'EUR' });
const dateTime = (value) => new Intl.DateTimeFormat('sl-SI', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(value));
const dateOnly = (value) => new Intl.DateTimeFormat('sl-SI', { day: 'numeric', month: 'long', timeZone: 'Europe/Ljubljana' }).format(new Date(value));
const el = (tag, attrs = {}, ...children) => { const node = document.createElement(tag); Object.entries(attrs).forEach(([key, value]) => { if (key === 'class') node.className = value; else if (key === 'text') node.textContent = value; else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), value); else node.setAttribute(key, value); }); node.append(...children.flat().filter(Boolean).map((child) => typeof child === 'string' ? document.createTextNode(child) : child)); return node; };
const link = (text, href, kind = 'button primary') => el('a', { class: kind, href, text });
const button = (text, kind, click) => el('button', { class: kind, type: 'button', text, onClick: click });
const disable = (node, value) => { node.toggleAttribute('disabled', value); return node; };
const api = async (path, options = {}) => { const response = await fetch(path, { ...options, credentials: 'same-origin', headers: { 'content-type': 'application/json', ...options.headers } }); const data = await response.json(); if (!response.ok) throw Error(data.error || 'Povezava s sistemom ni uspela.'); return data; };
const cartKey = 'beltinci-shop-cart';
const ordersKey = 'beltinci-shop-orders';
const cart = () => JSON.parse(sessionStorage.getItem(cartKey) || '{"eventId":"","items":{}}');
const setCart = (value) => sessionStorage.setItem(cartKey, JSON.stringify(value));
const orderAccess = (id) => sessionStorage.getItem(`beltinci-order-${id}`) || '';
const ownedOrders = () => JSON.parse(sessionStorage.getItem(ordersKey) || '[]');
const rememberOrder = (id) => sessionStorage.setItem(ordersKey, JSON.stringify([...new Set([id, ...ownedOrders()]) ]));
const status = (event, types = []) => { const now = Date.now(); if (!event.salesOpen || new Date(event.salesEnd).getTime() < now) return ['closed', 'PRODAJA VSTOPNIC JE ZAPRTA']; if (new Date(event.salesStart).getTime() > now) return ['pending', 'PRODAJA ŠE NI ODPRTA']; if (types.length && types.every((type) => type.capacity - type.sold <= 0)) return ['soldout', 'RAZPRODANO']; return ['open', 'PRODAJA ODPRTA']; };
const crest = (small = false) => el('img', { class: `shop-crest crest-image ${small ? 'small' : ''}`, src: clubAsset('ND Beltinci'), alt: 'Grb ND Beltinci' });
const clubCrest = (club, className = 'club-crest') => {
  const src = clubAsset(club);
  return src
    ? el('img', { class: `crest-image ${className}`, src, alt: `Grb ${club}` })
    : el('span', { class: `${className} club-crest-fallback`, text: club.slice(0, 2).toUpperCase(), 'aria-label': `Grb za ${club} ni na voljo` });
};
function header() {
  const menuId = 'public-mobile-menu';
  let open = false;
  const panel = el('nav', { class: 'public-mobile-menu', id: menuId, 'aria-label': 'Mobilna navigacija', hidden: '' },
    el('a', { href: '/', text: 'VSTOPNICE' }),
    el('a', { href: '/sezonske', text: 'SEZONSKE VSTOPNICE' }),
    el('a', { href: '/moje-vstopnice', text: 'MOJE VSTOPNICE' }),
    el('a', { class: 'public-mobile-staff-link', href: '/prijava-za-osebje', text: 'PRIJAVA ZA OSEBJE' })
  );
  panel.querySelectorAll('a').forEach((item) => { if (item.getAttribute('href') === location.pathname) { item.classList.add('active'); item.setAttribute('aria-current', 'page'); } });
  const toggle = button('☰', 'public-mobile-menu-toggle', () => setOpen(!open));
  toggle.setAttribute('aria-label', 'Odpri navigacijo');
  toggle.setAttribute('aria-controls', menuId);
  toggle.setAttribute('aria-expanded', 'false');
  const setOpen = (value) => {
    open = value;
    panel.hidden = !open;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Zapri navigacijo' : 'Odpri navigacijo');
    toggle.textContent = open ? '×' : '☰';
    if (open) panel.querySelector('a')?.focus();
  };
  panel.addEventListener('click', () => setOpen(false));
  panel.addEventListener('keydown', (event) => { if (event.key === 'Escape') { setOpen(false); toggle.focus(); } });
  toggle.addEventListener('keydown', (event) => { if (event.key === 'Escape' && open) { setOpen(false); toggle.focus(); } });
  return el('header', { class: 'shop-header' }, el('div', { class: 'shop-header-inner' }, el('a', { class: 'shop-brand', href: '/' }, crest(), el('span', {}, el('strong', { text: 'ND BELTINCI' }), el('small', { text: 'VSTOPNICE' }))), el('nav', { class: 'shop-nav', 'aria-label': 'Glavna navigacija' }, el('a', { href: '/', text: 'VSTOPNICE' }), el('a', { href: '/sezonske', text: 'SEZONSKE VSTOPNICE' }), el('a', { href: '/moje-vstopnice', text: 'MOJE VSTOPNICE' })), el('a', { class: 'staff-login-link', href: '/prijava-za-osebje', text: 'PRIJAVA ZA OSEBJE' }), toggle, panel));
}
function shell(...content) { app.replaceChildren(header(), el('main', { class: 'shop-main' }, content), el('footer', { class: 'shop-footer' }, el('div', {}, el('strong', { text: 'ND BELTINCI' }), el('span', { text: 'Vstopnice · Sezonske vstopnice · Moje vstopnice' })), el('div', { class: 'footer-actions' }, el('span', { text: 'Varno demo plačilo · QR vstopnice' }), el('a', { href: '/prijava-za-osebje', text: 'PRIJAVA ZA OSEBJE' })))); }
function errorPage(error) { shell(el('section', { class: 'shop-empty' }, el('span', { class: 'eyebrow', text: 'OBVESTILO' }), el('h1', { text: 'Nekaj ni uspelo.' }), el('p', { text: error.message || 'Poskusite znova.' }), link('NAZAJ NA VSTOPNICE', '/'))); }
function matchTitle(event) { return `ND Beltinci — ${event.opponent}`; }
function matchMeta(event) { return el('div', { class: 'match-meta' }, el('span', { text: dateOnly(event.kickoff) }), el('span', { text: new Intl.DateTimeFormat('sl-SI', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' }).format(new Date(event.kickoff)) }), el('span', { text: event.venue })); }
function quantityRow(type, amount, onChange, disabled) { return el('article', { class: 'ticket-type' }, el('div', { class: 'ticket-type-icon', text: type.section.slice(0, 1) }), el('div', { class: 'ticket-type-copy' }, el('span', { class: 'eyebrow blue', text: type.section }), el('h3', { text: type.name }), el('small', { text: `${type.capacity - type.sold} prostih mest` })), el('strong', { class: 'ticket-price', text: type.price ? euro.format(type.price) : 'BREZPLAČNO' }), el('div', { class: 'stepper' }, disable(button('−', 'step', () => onChange(-1)), disabled || !amount), el('output', { text: String(amount) }), disable(button('+', 'step', () => onChange(1)), disabled || amount >= Math.min(10, type.capacity - type.sold)))); }
async function eventPage(slug) {
  const [{ event, ticketTypes }, { events }] = await Promise.all([api(`/api/events/${slug}`), api('/api/events')]);
  const [state, label] = status(event, ticketTypes);
  let selected = cart();
  if (selected.eventId !== event.id) selected = { eventId: event.id, items: {} };
  const draw = () => {
    const count = ticketTypes.reduce((sum, type) => sum + (selected.items[type.id] || 0), 0);
    const total = ticketTypes.reduce((sum, type) => sum + (selected.items[type.id] || 0) * type.price, 0);
    const setQuantity = (type, change) => {
      const next = (selected.items[type.id] || 0) + change;
      if (next >= 0 && next <= Math.min(10, type.capacity - type.sold)) { selected.items[type.id] = next; setCart(selected); draw(); }
    };
    const activeTypes = ticketTypes.filter((type) => type.active);
    const rows = state === 'open' ? activeTypes.map((type) => quantityRow(type, selected.items[type.id] || 0, (change) => setQuantity(type, change), false)) : [el('section', { class: 'sale-closed' }, el('span', { class: `status ${state}`, text: label }), el('h3', { text: label }), el('p', { text: 'Za to tekmo trenutno ni mogoče izbrati vstopnic.' }))];
    const ticketGroups = [...activeTypes.reduce((groups, type) => {
      const group = groups.get(type.section) || [];
      group.push(type); groups.set(type.section, group); return groups;
    }, new Map()).entries()];
    const summary = el('aside', { class: 'cart-summary' },
      el('span', { class: 'eyebrow', text: 'VAŠ IZBOR' }),
      el('h2', { text: count ? `${count} ${count === 1 ? 'VSTOPNICA' : 'VSTOPNICE'}` : 'Izberite vstopnice' }),
      ...ticketTypes.filter((type) => selected.items[type.id]).map((type) => el('p', { text: `${selected.items[type.id]} × ${type.section} — ${type.name}` })),
      el('div', { class: 'summary-total' }, el('span', { text: 'SKUPAJ' }), el('strong', { text: euro.format(total) })),
      count && state === 'open' ? link('NADALJUJ', '/kosarica', 'button primary full') : el('p', { class: 'summary-note', text: state === 'open' ? 'Izberite vsaj eno vstopnico.' : label })
    );
    if (innerWidth <= 760) {
      document.body.classList.add('stitch-ticket-selection');
      const occupied = activeTypes.reduce((sum, type) => sum + type.sold, 0);
      const totalCapacity = activeTypes.reduce((sum, type) => sum + type.capacity, 0);
      const occupancy = totalCapacity ? Math.round((occupied / totalCapacity) * 100) : 0;
      const mobileCard = (type) => el('article', { class: `stitch-select-ticket${selected.items[type.id] ? ' is-selected' : ''}` },
        el('div', { class: 'stitch-select-ticket-head' }, el('div', {}, el('h3', { text: `${type.section} — ${type.name}` }), el('span', { text: `${Math.max(0, type.capacity - type.sold)} prostih mest` })), el('strong', { text: type.price ? euro.format(type.price) : 'BREZPLAČNO' })),
        el('div', { class: 'stitch-select-ticket-control' }, el('span', { text: 'Izberite število:' }), el('div', { class: 'stepper' }, disable(button('−', 'step', () => setQuantity(type, -1)), !selected.items[type.id]), el('output', { text: String(selected.items[type.id] || 0) }), disable(button('+', 'step', () => setQuantity(type, 1)), (selected.items[type.id] || 0) >= Math.min(10, type.capacity - type.sold))))
      );
      shell(
        el('section', { class: 'stitch-select-intro' }, link('‹', '/', 'stitch-select-back'), el('div', {}, el('span', { text: '02 VSTOPNICE' }), el('h1', { text: 'IZBIRA VSTOPNIC' }))),
        el('section', { class: 'stitch-select-match' }, el('div', { class: 'stitch-select-match-top' }, el('span', { text: event.competition }), el('b', { text: `${occupancy}% ZASEDENO` })), el('div', { class: 'stitch-select-teams' }, el('div', {}, crest(true), el('strong', { text: 'ND BELTINCI' })), el('em', { text: 'VS' }), el('div', {}, clubCrest(event.opponent, 'stitch-select-crest'), el('strong', { text: event.opponent }))), el('div', { class: 'stitch-select-match-meta' }, el('span', { text: dateTime(event.kickoff).replace(',', ' ·') }), el('span', { text: event.venue }))),
        el('section', { class: 'stitch-select-catalogue' }, el('div', { class: 'stitch-select-catalogue-head' }, el('h2', { text: 'KATEGORIJE VSTOPNIC' }), el('span', { text: 'Maks. 10 kart' })), ...activeTypes.map(mobileCard), el('p', { class: 'stitch-select-note', text: '✓ Takojšnja digitalna QR vstopnica · Vstop z mobilnim telefonom' })),
        el('div', { class: 'stitch-select-checkout' }, el('div', {}, el('span', { text: `SKUPAJ: ${count} VSTOPNIC${count === 1 ? 'A' : ''}` }), el('strong', { text: euro.format(total) })), count ? link('NADALJUJ NA BLAGAJNO →', '/kosarica', 'button primary') : el('span', { class: 'stitch-select-disabled', text: 'IZBERITE VSTOPNICE' }))
      );
      return;
    }
    const selection = el('section', { class: 'selection-layout' },
      el('div', {}, el('div', { class: 'section-head' }, el('div', {}, el('span', { class: 'eyebrow blue', text: 'KORAK 1 OD 2' }), el('h2', { text: 'IZBIRA SEKTORJA IN VSTOPNIC' }))),
        el('section', { class: 'ref-stadium-map' }, el('div', {}, el('strong', { text: `Tloris stadiona ${event.venue}` }), el('span', { text: `${activeTypes.reduce((sum, type) => sum + Math.max(0, type.capacity - type.sold), 0)} PROSTIH MEST` })), el('div', { class: 'ref-pitch', text: 'IGRIŠČE ND BELTINCI' })),
        state === 'open'
          ? ticketGroups.map(([section, types]) => el('section', { class: 'ref-ticket-group' },
            el('div', { class: 'ref-ticket-group-head' }, el('h3', { text: section }), el('span', { text: `${types.reduce((sum, type) => sum + Math.max(0, type.capacity - type.sold), 0)} MEST` })),
            el('div', { class: 'ticket-list' }, types.map((type) => quantityRow(type, selected.items[type.id] || 0, (change) => setQuantity(type, change), false)))
          ))
          : el('div', { class: 'ticket-list' }, rows)
      ),
      summary,
      count && state === 'open' ? el('div', { class: 'mobile-cart' }, el('div', {}, el('small', { text: `${count} VSTOPNICE` }), el('strong', { text: euro.format(total) })), link('NADALJUJ', '/kosarica', 'button primary')) : ''
    );
    const upcoming = events.filter((item) => item.id !== event.id).slice(0, 3);
    shell(
      el('section', { class: 'match-banner' }, el('div', { class: 'ref-hero-copy' }, el('span', { class: 'eyebrow yellow', text: event.competition }), el('p', { class: 'ref-hero-kicker', text: 'URADNA KLUBSKA BLAGAJNA' }), el('div', { class: 'match-banner-teams' }, crest(), el('h1', { text: 'ND BELTINCI VSTOPNICE' })), el('p', { class: 'ref-hero-support', text: 'Skupaj za žute. Izberite vstopnico in jo pokažite ob vstopu.' }), matchMeta(event)), el('aside', { class: 'ref-hero-fixture' }, el('span', { class: 'status pending', text: state === 'open' ? 'VISOKO POVPRAŠEVANJE' : label }), el('div', {}, crest(true), el('strong', { text: 'ND BELTINCI' }), el('small', { text: 'DOMAČI' })), el('b', { text: 'VS' }), el('div', {}, clubCrest(event.opponent, 'club-crest ref-fixture-crest'), el('strong', { text: event.opponent.toUpperCase() }), el('small', { text: event.competition })), el('div', { class: 'ref-fixture-meta', text: `${dateOnly(event.kickoff)} · ${event.venue}` }))),
      selection,
      upcoming.length ? el('section', { class: 'ref-upcoming' }, el('div', { class: 'ref-upcoming-head' }, el('span', { class: 'eyebrow yellow', text: 'RAZPORED TEKEM' }), el('h2', { text: 'PRIHAJAJOČE TEKME V ŠPORTNEM PARKU' })), el('div', { class: 'ref-upcoming-grid' }, upcoming.map((item) => el('article', { class: 'ref-upcoming-card' }, el('span', { class: 'status open', text: item.salesOpen ? 'PRODAJA ODPRTA' : 'NI V PRODAJI' }), el('h3', { text: `BELTINCI VS ${item.opponent.toUpperCase()}` }), matchMeta(item), link('IZBERI VSTOPNICE', `/vstopnice/${item.slug}`, 'button ghost full'))))) : ''
    );
  };
  draw();
}
async function cartPage() {
  const selected = cart();
  if (!selected.eventId) return shell(el('section', { class: 'stitch-cart-empty' }, el('span', { class: 'eyebrow yellow', text: 'KOŠARICA' }), el('h1', { text: 'Košarica je prazna' }), el('p', { text: 'Izberite vstopnice za naslednjo domačo tekmo.' }), link('POGLEJ TEKME', '/', 'button primary')));
  const { events } = await api('/api/events'); const event = events.find((item) => item.id === selected.eventId);
  if (!event) return location.assign('/');
  const { ticketTypes } = await api(`/api/events/${event.slug}`); const [state, label] = status(event, ticketTypes);
  const draw = () => {
    const items = ticketTypes.filter((type) => selected.items[type.id]);
    const total = items.reduce((sum, type) => sum + selected.items[type.id] * type.price, 0);
    const set = (type, change) => { const next = selected.items[type.id] + change; const maximum = Math.min(10, Math.max(0, type.capacity - type.sold)); if (next > 0 && next <= maximum) selected.items[type.id] = next; else if (next <= 0) delete selected.items[type.id]; setCart(selected); draw(); };
    const itemNodes = items.map((type) => el('article', { class: 'cart-line' },
      el('div', { class: 'stitch-cart-line-copy' }, el('span', { class: 'eyebrow blue', text: type.section }), el('h2', { text: type.name }), el('p', { text: `Cena ${euro.format(type.price)} / vstopnico` })),
      el('div', { class: 'stitch-cart-line-action' }, el('strong', { text: euro.format(selected.items[type.id] * type.price) }), el('span', { text: `${selected.items[type.id]} × ${euro.format(type.price)}` }), el('div', { class: 'stepper compact-stepper' }, button('−', 'step', () => set(type, -1)), el('output', { text: String(selected.items[type.id]) }), disable(button('+', 'step', () => set(type, 1)), selected.items[type.id] >= Math.min(10, Math.max(0, type.capacity - type.sold)))))
    ));
    const count = items.reduce((sum, item) => sum + selected.items[item.id], 0);
    const list = el('div', { class: 'cart-items' }, el('div', { class: 'stitch-cart-match' }, el('div', { class: 'stitch-cart-crests' }, crest(true), clubCrest(event.opponent, 'stitch-cart-crest')), el('div', {}, el('span', { class: 'eyebrow yellow', text: event.competition }), el('strong', { text: matchTitle(event) }), el('small', { text: `${dateTime(event.kickoff).replace(',', ' ·')} · ${event.venue}` }))), ...itemNodes);
    const summary = el('aside', { class: 'cart-summary stitch-cart-summary' }, el('span', { class: 'eyebrow', text: `${count} ${count === 1 ? 'VSTOPNICA' : 'VSTOPNICE'}` }), el('div', { class: 'summary-total' }, el('span', { text: 'SKUPAJ' }), el('strong', { text: euro.format(total) })), items.length && state === 'open' ? link('NADALJUJ NA BLAGAJNO', '/checkout', 'button primary full') : el('p', { class: 'summary-note', text: label }));
    shell(el('section', { class: 'stitch-cart-heading' }, link('‹', `/vstopnice/${event.slug}`, 'stitch-cart-back'), el('div', {}, el('span', { class: 'eyebrow yellow', text: 'KORAK 2 OD 3' }), el('h1', { text: 'KOŠARICA' }))), el('section', { class: 'cart-layout stitch-cart-layout' }, list, summary));
  };
  draw();
}
async function checkout() {
  const selected = cart(); const { events } = await api('/api/events'); const event = events.find((item) => item.id === selected.eventId);
  if (!event) return location.assign('/');
  const { ticketTypes } = await api(`/api/events/${event.slug}`); const items = ticketTypes.filter((type) => selected.items[type.id]).map((type) => ({ ...type, quantity: selected.items[type.id] }));
  if (!items.length) return location.assign('/kosarica');
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0); const form = el('form', { class: 'supporter-form' });
  [['Ime', 'firstName', 'text'], ['Priimek', 'lastName', 'text'], ['E-pošta', 'email', 'email']].forEach(([label, name, type]) => form.append(el('label', {}, el('span', { text: label }), el('input', { name, type, required: '', autocomplete: name === 'email' ? 'email' : 'name' }))));
  const pay = button(`PLAČAJ ${euro.format(total)}`, 'button primary full', async () => {
    if (!form.reportValidity()) return; pay.disabled = true; pay.textContent = 'OBDELUJEMO PLAČILO …';
    try { const values = Object.fromEntries(new FormData(form)); const result = await api('/api/checkout', { method: 'POST', body: JSON.stringify({ ...values, eventId: event.id, items: items.map((item) => ({ ticketTypeId: item.id, quantity: item.quantity })) }) }); sessionStorage.setItem(`beltinci-order-${result.order.id}`, result.order.accessToken); sessionStorage.setItem(`beltinci-payment-${result.order.id}`, result.order.paymentSecret); location.assign(`/placilo/${result.order.id}`); }
    catch (error) { pay.disabled = false; pay.textContent = `PLAČAJ ${euro.format(total)}`; alert(error.message); }
  });
  form.append(el('div', { class: 'checkout-action' }, el('span', { text: 'Demo plačilo — kartični podatki niso potrebni.' }), pay));
  const summary = el('aside', { class: 'cart-summary' }, el('span', { class: 'eyebrow', text: matchTitle(event) }), ...items.map((item) => el('p', { text: `${item.quantity} × ${item.section} — ${item.name}` })), el('div', { class: 'summary-total' }, el('span', { text: 'SKUPAJ' }), el('strong', { text: euro.format(total) })));
  shell(el('section', { class: 'page-heading compact' }, el('span', { class: 'eyebrow blue', text: 'ZAKLJUČEK NAKUPA' }), el('h1', { text: 'Vaši podatki' })), el('section', { class: 'checkout-layout' }, form, summary));
}
async function payment(id) { const { order } = await api(`/api/orders/${id}`, { headers: { 'x-order-access': orderAccess(id) } }); const complete = async () => { try { const result = await api('/api/payments/callback', { method: 'POST', headers: { 'x-demo-payment-secret': sessionStorage.getItem(`beltinci-payment-${id}`) || '' }, body: JSON.stringify({ orderId: id, outcome: 'success', transaction: `supporter_demo_${id}` }) }); rememberOrder(result.order.id); sessionStorage.removeItem(cartKey); location.assign(`/nakup/uspesen?order=${id}`); } catch (error) { errorPage(error); } }; shell(el('section', { class: 'payment-state' }, el('div', { class: 'payment-spinner' }), el('span', { class: 'eyebrow yellow', text: 'DEMO PLAČILO' }), el('h1', { text: 'Obdelujemo plačilo' }), el('p', { text: 'Prosimo, potrdite demo plačilo. Vstopnice se izdajo šele po potrditvi.' }), button(`POTRDI ${euro.format(order.amount)}`, 'button primary', complete))); }
async function success() { const id = new URLSearchParams(location.search).get('order'); if (!id) return location.assign('/'); const { order, tickets } = await api(`/api/orders/${id}`, { headers: { 'x-order-access': orderAccess(id) } }); shell(el('section', { class: 'purchase-success' }, el('div', { class: 'success-mark', text: '✓' }), el('span', { class: 'eyebrow', text: 'PLAČILO POTRJENO' }), el('h1', { text: 'Nakup uspešen' }), el('p', { text: 'Vaše vstopnice so pripravljene.' }), el('div', { class: 'success-total' }, el('strong', { text: `${tickets.length} VSTOPNICE` }), el('strong', { text: euro.format(order.amount) })), link('PRIKAŽI VSTOPNICE', `/moje-vstopnice?order=${id}`, 'button primary'), link('NAZAJ NA VSTOPNICE', '/', 'button ghost'))); }
async function myTickets() { const selectedId = new URLSearchParams(location.search).get('order'); const ids = selectedId ? [selectedId, ...ownedOrders().filter((id) => id !== selectedId)] : ownedOrders(); const orders = (await Promise.all(ids.map(async (id) => { try { return await api(`/api/orders/${id}`, { headers: { 'x-order-access': orderAccess(id) } }); } catch { return null; } }))).filter(Boolean); const tickets = orders.flatMap((item) => item.tickets); const label = (ticket) => ticket.status === 'CANCELLED' ? ['cancelled', 'PREKLICANA'] : ticket.admissions.length ? ['used', 'UPORABLJENA'] : ['valid', 'VELJAVNA']; shell(el('section', { class: 'page-heading compact' }, el('span', { class: 'eyebrow blue', text: 'VAŠ RAČUN' }), el('h1', { text: 'Moje vstopnice' })), tickets.length ? el('section', { class: 'wallet-grid' }, tickets.map((ticket) => { const [kind, text] = label(ticket); return el('article', { class: 'wallet-card' }, el('span', { class: `status ${kind}`, text }), el('h2', { text: matchTitle(ticket.event) }), el('p', { text: `${dateTime(ticket.event.kickoff)} · ${ticket.event.venue}` }), el('strong', { text: `${ticket.type.section} — ${ticket.type.name}` }), link('ODPRI VSTOPNICO', `/vstopnica/${ticket.id}?order=${ticket.orderId}`, 'button navy full')); })) : el('section', { class: 'shop-empty' }, el('h2', { text: 'Še nimate vstopnic.' }), el('p', { text: 'Ko opravite nakup na tej napravi, bodo vaše QR vstopnice prikazane tukaj.' }), link('POGLEJ TEKME', '/'))); }
async function ticketPage(id) {
  document.body.classList.add('ref-digital-ticket');
  const orderId = new URLSearchParams(location.search).get('order'); const headers = { 'x-order-access': orderAccess(orderId) };
  const [{ ticket }, { qr }, { tickets }] = await Promise.all([api(`/api/tickets/${id}`, { headers }), api(`/api/tickets/${id}/qr`, { headers }), api(`/api/orders/${orderId}`, { headers })]);
  const index = tickets.findIndex((item) => item.id === id); const go = (change) => { const next = tickets[index + change]; if (next) location.assign(`/vstopnica/${next.id}?order=${orderId}`); };
  const [kind, text] = ticket.status === 'CANCELLED' ? ['cancelled', 'PREKLICANA'] : ticket.admissions.length ? ['used', 'UPORABLJENA'] : ['valid', 'VELJAVNA'];
  const kickoff = new Intl.DateTimeFormat('sl-SI', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Ljubljana' }).format(new Date(ticket.event.kickoff));
  shell(el('section', { class: 'ref-ticket-page' },
    el('div', { class: 'ref-ticket-title' }, el('span', { class: `status ${kind}`, text: `${text} VSTOPNICA` }), el('h1', { text: 'DIGITALNA VSTOPNICA & QR' })),
    el('div', { class: 'ref-ticket-grid' },
      el('section', { class: 'ref-ticket-voucher' },
        el('div', { class: 'ref-ticket-nav' }, disable(button('‹', 'ref-ticket-arrow', () => go(-1)), index === 0), el('div', {}, el('strong', { text: `VSTOPNICA ${index + 1} OD ${tickets.length}` }), el('span', { text: `${ticket.type.section} — ${ticket.type.name}` })), disable(button('›', 'ref-ticket-arrow', () => go(1)), index === tickets.length - 1)),
        el('article', { class: 'ref-ticket-card' },
          el('header', { class: 'ref-ticket-band' }, crest(true), el('div', {}, el('strong', { text: 'ND BELTINCI' }), el('span', { text: ticket.event.competition })), el('span', { class: 'ref-ticket-official', text: 'URADNA VSTOPNICA' })),
          el('div', { class: 'ref-ticket-match' }, el('div', {}, el('span', { text: 'TEKMOVANJE IN NASPROTNIK' }), el('strong', { text: matchTitle(ticket.event) })), el('div', {}, el('span', { text: 'ČAS TEKME' }), el('strong', { text: kickoff }))),
          el('div', { class: 'ref-ticket-data' }, el('div', {}, el('span', { text: 'SEKTOR' }), el('strong', { text: ticket.type.section })), el('div', {}, el('span', { text: 'VRSTA' }), el('strong', { text: ticket.type.name })), el('div', {}, el('span', { text: 'STATUS' }), el('strong', { class: kind, text }))),
          el('div', { class: 'ref-ticket-qr' }, el('span', { class: `status ${kind}`, text }), el('div', { class: 'qr-zone' }, el('img', { src: qr, alt: `QR koda vstopnice ${ticket.reference}` })), el('code', { text: ticket.reference }), el('p', { text: 'Pokažite QR kodo ob vstopu. Za zanesljivo branje nastavite svetlost zaslona na 100 %.' })),
          el('footer', { class: 'ref-ticket-venue' }, el('div', {}, el('strong', { text: ticket.event.venue }), el('span', { text: 'Vstopnica velja za en vstop na navedeno tekmo.' })), el('span', { text: 'VSTOP' }))
        )
      ),
      el('aside', { class: 'ref-ticket-side' },
        el('section', {}, el('span', { class: 'eyebrow yellow', text: 'STANJE VSTOPNICE' }), el('div', { class: `ref-ticket-status ${kind}` }, el('strong', { text }), el('span', { text: ticket.admissions.length ? `Vstop evidentiran: ${dateTime(ticket.admissions[0].at)}` : 'Pripravljena za preverjanje na vhodu.' }))),
        el('section', {}, el('span', { class: 'eyebrow yellow', text: 'PODROBNOSTI' }), el('dl', {}, el('div', {}, el('dt', { text: 'REFERENCA' }), el('dd', { text: ticket.reference })), el('div', {}, el('dt', { text: 'VSTOP' }), el('dd', { text: ticket.type.section })), el('div', {}, el('dt', { text: 'PRIZORIŠČE' }), el('dd', { text: ticket.event.venue })))),
        el('section', { class: 'ref-ticket-rules' }, el('span', { class: 'eyebrow yellow', text: 'NAVODILA ZA VSTOP' }), el('p', { text: 'QR kodo pokažite osebju pri vhodu. Koda ostane veljavna do prve uspešne uporabe.' }))
      )
    )
  ));
}
async function stitchHome() {
  document.body.classList.add('stitch-home');
  const { events, ticketTypes } = await api('/api/events');
  const [featured, ...upcoming] = events;
  const typesFor = (event) => ticketTypes.filter((type) => type.eventId === event.id && type.active);
  const availability = (event) => typesFor(event).reduce((sum, type) => sum + Math.max(0, type.capacity - type.sold), 0);
  const capacity = (event) => typesFor(event).reduce((sum, type) => sum + type.capacity, 0);
  const occupied = capacity(featured) ? Math.min(100, Math.round(((capacity(featured) - availability(featured)) / capacity(featured)) * 100)) : 0;
  const shortDate = new Intl.DateTimeFormat('sl-SI', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' }).format(new Date(featured.kickoff)).toUpperCase();
  const matchCard = (event) => el('article', { class: 'stitch-home-match' },
    el('div', { class: 'stitch-home-match-top' }, el('span', { text: event.competition }), el('time', { text: new Intl.DateTimeFormat('sl-SI', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Ljubljana' }).format(new Date(event.kickoff)).toUpperCase() })),
    el('div', { class: 'stitch-home-fixture' }, el('div', {}, crest(true), el('strong', { text: 'ND BELTINCI' }), el('small', { text: 'DOMAČI' })), el('i', { text: 'VS' }), el('div', {}, clubCrest(event.opponent, 'stitch-home-card-crest'), el('strong', { text: event.opponent.toUpperCase() }), el('small', { text: 'GOSTI' }))),
    el('div', { class: 'stitch-home-match-bottom' }, el('span', { text: `⌖ ${event.venue}` }), link(availability(event) ? `VSTOPNICE OD ${euro.format(Math.min(...typesFor(event).filter((type) => type.capacity > type.sold).map((type) => type.price)))}` : 'RAZPRODANO', `/vstopnice/${event.slug}`, availability(event) ? 'button primary stitch-home-card-cta' : 'unavailable'))
  );
  shell(
    el('section', { class: 'stitch-home-hero' },
      el('div', { class: 'stitch-home-badges' }, el('span', { text: featured.competition }), el('span', { class: 'stitch-home-occupancy', text: `${occupied}% ZASEDENO` })),
      el('h1', { text: `PREKMURSKI DERBI: ND BELTINCI VS ${featured.opponent.toUpperCase()}` }),
      el('div', { class: 'stitch-home-teams' }, el('div', {}, crest(), el('strong', { text: 'ND BELTINCI' }), el('small', { text: 'DOMAČI' })), el('i', { text: 'VS' }), el('div', {}, clubCrest(featured.opponent, 'stitch-home-away-mark'), el('strong', { text: featured.opponent.toUpperCase() }), el('small', { text: 'GOSTI' }))),
      el('div', { class: 'stitch-home-meta' }, el('div', {}, el('span', { text: '▣ TERMIN' }), el('strong', { text: shortDate })), el('div', {}, el('span', { text: '⌖ PRIZORIŠČE' }), el('strong', { text: featured.venue.toUpperCase() }))),
      el('div', { class: 'stitch-home-progress' }, el('div', {}, el('span', { text: 'Zasedenost tribune' }), el('b', { text: `${capacity(featured) - availability(featured)} / ${capacity(featured)} MEST` })), el('i', { class: `share-${Math.round(occupied / 10) * 10}` })),
      link(`KUPI VSTOPNICE (ŽE OD ${euro.format(Math.min(...typesFor(featured).map((type) => type.price)))})`, `/vstopnice/${featured.slug}`, 'button primary stitch-home-primary')
    ),
    el('section', { class: 'stitch-home-section' }, el('div', { class: 'stitch-home-section-heading' }, el('i', { 'aria-hidden': 'true' }), el('h2', { text: 'PRIHAJAJOČE TEKME' }), el('span', { text: '2. SNL 2026/27' })), upcoming.slice(0, 2).map(matchCard)),
    el('section', { class: 'stitch-season-section' }, el('div', { class: 'stitch-home-section-heading' }, el('i', { 'aria-hidden': 'true' }), el('h2', { text: 'SEZONSKE VSTOPNICE' })), el('div', { class: 'stitch-season-card' }, el('div', { class: 'stitch-season-card-top' }, el('span', { text: 'ŽUTI PAKET ZVESTOBE 2026/27' }), el('div', {}, el('strong', { text: '95,00 €' }), el('small', { text: 'ENKRATNO PLAČILO' }))), el('h2', { text: 'CELOSEZONSKA KLUBSKA KARTICA' }), el('p', { text: 'Zagotovite si stalni sedež za vse domače tekme.' }), link('NAROČI SEZONSKI PAKET', '/sezonske', 'button primary stitch-home-primary'))),
  );
}
function seasons() { shell(el('section', { class: 'season-hero' }, el('span', { class: 'eyebrow yellow', text: 'SEZONSKA VSTOPNICA' }), el('h1', { text: 'V vseh domačih trenutkih skupaj.' }), el('p', { text: 'Sezonske vstopnice so del demonstracijskega sistema.' }), el('strong', { text: '120,00 €' }))); }
/* Reference purchase structure is supplied through the existing functional event page while its shared reference CSS is refined. */
async function route() { try { const path = location.pathname; if (path === '/') return await stitchHome(); if (path.startsWith('/vstopnice/')) return await eventPage(path.split('/').pop()); if (path === '/kosarica') return await cartPage(); if (path === '/checkout' || path === '/blagajna') return await checkout(); if (path.startsWith('/placilo/')) return await payment(path.split('/').pop()); if (path === '/nakup/uspesen') return await success(); if (path === '/moje-vstopnice') return await myTickets(); if (path.startsWith('/vstopnica/')) return await ticketPage(path.split('/').pop()); if (path === '/sezonske') return seasons(); return await stitchHome(); } catch (error) { errorPage(error); } }
route();
