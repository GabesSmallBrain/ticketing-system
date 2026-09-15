import { randomBytes, randomUUID } from 'node:crypto';

export type Role = 'club_admin' | 'box_office' | 'gate_staff';
export type Channel = 'ONLINE' | 'BOX_OFFICE' | 'COMPLIMENTARY';
export type PaymentStatus = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
export type TicketStatus = 'VALID' | 'CANCELLED';
export type AdmissionResult = 'accepted' | 'already_used' | 'invalid' | 'wrong_event' | 'cancelled';

export interface TicketType { id: string; eventId: string; clubId: string; section: string; name: string; price: number; capacity: number; sold: number; active: boolean }
export interface Event { id: string; clubId: string; slug: string; opponent: string; competition: string; kickoff: string; venue: string; salesStart: string; salesEnd: string; salesOpen: boolean; demo: boolean; baseSold: number; baseScanned: number; baseRevenue: number }
export interface Order { id: string; reference: string; accessToken: string; paymentSecret: string; clubId: string; eventId: string; customer: { firstName: string; lastName: string; email: string; phone?: string }; channel: Channel; status: 'PENDING_PAYMENT' | 'PAID' | 'REFUNDED'; amount: number; createdAt: string; providerTransaction?: string; paymentStatus: PaymentStatus; items: Array<{ ticketTypeId: string; quantity: number; price: number }> }
export interface Ticket { id: string; reference: string; credential: string; clubId: string; eventId: string; orderId: string; ticketTypeId: string; status: TicketStatus; issuedAt: string; admissions: Admission[] }
export interface Admission { id: string; eventId: string; gate: string; scannedAt: string }
export interface Audit { id: string; clubId: string; type: string; at: string; detail: string }
export interface Database { clubs: Array<{ id: string; name: string }>; events: Event[]; ticketTypes: TicketType[]; orders: Order[]; tickets: Ticket[]; audits: Audit[] }

export const CLUB = 'club_beltinci';
export const now = () => new Date().toISOString();
export const id = () => randomUUID();
export const credential = () => `ndb_${randomBytes(24).toString('base64url')}`;
export const reference = (prefix: string) => `${prefix}-${randomBytes(5).toString('hex').toUpperCase()}`;
export const audit = (db: Database, clubId: string, type: string, detail: string) => db.audits.unshift({ id: id(), clubId, type, at: now(), detail });
export function issueTickets(db: Database, order: Order): Ticket[] {
  const issued = db.tickets.filter((ticket) => ticket.orderId === order.id);
  if (issued.length) return issued;
  const result: Ticket[] = [];
  for (const item of order.items) for (let n = 0; n < item.quantity; n += 1) {
    const ticket: Ticket = { id: id(), reference: reference('VST'), credential: credential(), clubId: order.clubId, eventId: order.eventId, orderId: order.id, ticketTypeId: item.ticketTypeId, status: 'VALID', issuedAt: now(), admissions: [] };
    db.tickets.push(ticket); result.push(ticket); audit(db, order.clubId, 'ticket.issued', ticket.reference);
  }
  return result;
}
export function redeem(db: Database, clubId: string, eventId: string, gate: string, raw: string): { result: AdmissionResult; ticket?: Ticket } {
  const ticket = db.tickets.find((candidate) => candidate.credential === raw && candidate.clubId === clubId);
  if (!ticket) return { result: 'invalid' };
  if (ticket.status === 'CANCELLED') return { result: 'cancelled', ticket };
  if (ticket.eventId !== eventId) return { result: 'wrong_event', ticket };
  if (ticket.admissions.some((admission) => admission.eventId === eventId)) return { result: 'already_used', ticket };
  ticket.admissions.push({ id: id(), eventId, gate, scannedAt: now() }); audit(db, clubId, 'ticket.redeemed', ticket.reference);
  return { result: 'accepted', ticket };
}
