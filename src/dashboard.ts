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
