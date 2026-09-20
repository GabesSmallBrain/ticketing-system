import { readDb } from './db.js';
import type { Channel } from './domain.js';

const channels: Channel[] = ['ONLINE', 'BOX_OFFICE', 'COMPLIMENTARY'];

/** Read-only dashboard projection. `COMPLIMENTARY` is explicit order semantics, never inferred from price. */
export async function dashboardFor(clubId: string) {
  const db = await readDb();
  const event = db.events.find((candidate) => candidate.clubId === clubId && candidate.id === 'evt-mura') ?? db.events.find((candidate) => candidate.clubId === clubId);
  if (!event) return;
  const types = db.ticketTypes.filter((type) => type.clubId === clubId && type.eventId === event.id);
  const orders = db.orders.filter((order) => order.clubId === clubId && order.eventId === event.id);
  const orderById = new Map(orders.map((order) => [order.id, order]));
  const tickets = db.tickets.filter((ticket) => ticket.clubId === clubId && ticket.eventId === event.id);
  const ticketChannel = (ticket: typeof tickets[number]) => orderById.get(ticket.orderId)?.channel;
  const complimentaryIssued = tickets.filter((ticket) => ticketChannel(ticket) === 'COMPLIMENTARY').length;
  const paidIssued = event.baseSold + tickets.length - complimentaryIssued;
  const totalIssued = event.baseSold + tickets.length;
  const capacity = types.reduce((sum, type) => sum + type.capacity, 0);
  const admitted = event.baseScanned + tickets.filter((ticket) => ticket.admissions.length > 0).length;
  const revenue = event.baseRevenue + orders.filter((order) => order.status === 'PAID' && order.channel !== 'COMPLIMENTARY').reduce((sum, order) => sum + order.amount, 0);
  return {
    event,
    types,
    paidIssued,
    complimentaryIssued,
    totalIssued,
    sold: totalIssued,
    admitted,
    scanned: admitted,
    remaining: Math.max(0, capacity - totalIssued),
    revenue,
    capacity,
    channels: channels.map((channel) => ({
      channel,
      tickets: tickets.filter((ticket) => ticketChannel(ticket) === channel).length,
      revenue: channel === 'COMPLIMENTARY' ? 0 : orders.filter((order) => order.status === 'PAID' && order.channel === channel).reduce((sum, order) => sum + order.amount, 0)
    }))
  };
}

/** Club reporting projection. Match-ticket metrics intentionally exclude season products. */
export async function reportFor(clubId: string) {
  const db = await readDb();
  const matches = db.events.filter((event) => event.clubId === clubId).map((event) => {
    const types = db.ticketTypes.filter((type) => type.clubId === clubId && type.eventId === event.id);
    const orders = db.orders.filter((order) => order.clubId === clubId && order.eventId === event.id);
    const orderById = new Map(orders.map((order) => [order.id, order]));
    const tickets = db.tickets.filter((ticket) => ticket.clubId === clubId && ticket.eventId === event.id);
    const channelOf = (ticket: typeof tickets[number]) => orderById.get(ticket.orderId)?.channel;
    const complimentary = tickets.filter((ticket) => channelOf(ticket) === 'COMPLIMENTARY').length;
    const totalIssued = event.baseSold + tickets.length;
    const capacity = types.reduce((sum, type) => sum + type.capacity, 0);
    return { event, paidTickets: totalIssued - complimentary, complimentary, totalIssued, admissions: event.baseScanned + tickets.filter((ticket) => ticket.admissions.length > 0).length, revenue: event.baseRevenue + orders.filter((order) => order.status === 'PAID' && order.channel !== 'COMPLIMENTARY').reduce((sum, order) => sum + order.amount, 0), capacity, remainingCapacity: Math.max(0, capacity - totalIssued), channels: channels.map((channel) => ({ channel, tickets: tickets.filter((ticket) => channelOf(ticket) === channel).length, revenue: channel === 'COMPLIMENTARY' ? 0 : orders.filter((order) => order.status === 'PAID' && order.channel === channel).reduce((sum, order) => sum + order.amount, 0) })) };
  }).sort((a,b) => Date.parse(b.event.kickoff) - Date.parse(a.event.kickoff));
  const totals = matches.reduce((sum, match) => ({ paidTickets: sum.paidTickets + match.paidTickets, complimentary: sum.complimentary + match.complimentary, totalIssued: sum.totalIssued + match.totalIssued, admissions: sum.admissions + match.admissions, revenue: sum.revenue + match.revenue, capacity: sum.capacity + match.capacity, remainingCapacity: sum.remainingCapacity + match.remainingCapacity }), { paidTickets: 0, complimentary: 0, totalIssued: 0, admissions: 0, revenue: 0, capacity: 0, remainingCapacity: 0 });
  const channelTotals = channels.map((channel) => ({ channel, tickets: matches.reduce((sum, match) => sum + (match.channels.find((item) => item.channel === channel)?.tickets ?? 0), 0), revenue: matches.reduce((sum, match) => sum + (match.channels.find((item) => item.channel === channel)?.revenue ?? 0), 0) }));
  const seasonOrders = db.orders.filter((order) => order.clubId === clubId && order.kind === 'SEASON' && order.status === 'PAID');
  return { totals, channels: channelTotals, matches, season: { orders: seasonOrders.length, entitlements: db.seasonPasses.filter((pass) => pass.clubId === clubId).length, revenue: seasonOrders.reduce((sum, order) => sum + order.amount, 0), admissionsImplemented: false } };
}
