import { supabase } from './supabase'
import type { Property, Booking, ExpenseRecord, RentHistory } from '../types'

// ── 当前用户 ID（由 AuthGate 注入）────────────────────────────

let currentUserId: string | null = null

export function setDbUserId(userId: string | null) {
  currentUserId = userId
}

function getUserId(): string {
  if (!currentUserId) throw new Error('User not authenticated')
  return currentUserId
}

// ── 数据迁移：把无主之数据绑定到当前用户 ──────────────────────

export async function migrateData(userId: string) {
  await Promise.all([
    supabase.from('properties').update({ user_id: userId }).is('user_id', null),
    supabase.from('bookings').update({ user_id: userId }).is('user_id', null),
    supabase.from('expenses').update({ user_id: userId }).is('user_id', null),
    supabase.from('rent_history').update({ user_id: userId }).is('user_id', null),
  ])
}

// ── snake_case ↔ camelCase 映射 ──────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>

const propToDb = (p: Property): Row => ({
  id: p.id, name: p.name, type: p.type, capacity: p.capacity,
  price_per_night: p.pricePerNight, status: p.status,
  description: p.description, cover_color: p.coverColor,
  monthly_rent: p.monthlyRent,
  user_id: getUserId(),
})
const propFromDb = (r: Row): Property => ({
  id: r.id, name: r.name, type: r.type, capacity: r.capacity,
  pricePerNight: r.price_per_night, status: r.status,
  description: r.description ?? '', coverColor: r.cover_color ?? '#1677ff',
  monthlyRent: r.monthly_rent ?? 0,
})

const bookingToDb = (b: Booking): Row => ({
  id: b.id, property_id: b.propertyId, guest_name: b.guestName,
  guest_phone: b.guestPhone, check_in: b.checkIn, check_out: b.checkOut,
  total_amount: b.totalAmount, paid_amount: b.paidAmount,
  payment_method: b.paymentMethod, payment_status: b.paymentStatus,
  notes: b.notes, created_at: b.createdAt,
  booking_mode: b.bookingMode ?? 'nightly',
  user_id: getUserId(),
})
const bookingFromDb = (r: Row): Booking => ({
  id: r.id, propertyId: r.property_id, guestName: r.guest_name,
  guestPhone: r.guest_phone ?? '', checkIn: r.check_in, checkOut: r.check_out,
  totalAmount: r.total_amount, paidAmount: r.paid_amount,
  paymentMethod: r.payment_method ?? 'wechat',
  paymentStatus: r.payment_status ?? 'paid',
  notes: r.notes ?? '', createdAt: r.created_at ?? '',
  bookingMode: r.booking_mode ?? 'nightly',
})

const expenseToDb = (e: ExpenseRecord): Row => ({
  id: e.id, property_id: e.propertyId, type: e.type,
  date: e.date, amount: e.amount, description: e.description,
  created_at: e.createdAt,
  user_id: getUserId(),
})
const expenseFromDb = (r: Row): ExpenseRecord => ({
  id: r.id, propertyId: r.property_id, type: r.type,
  date: r.date, amount: r.amount,
  description: r.description ?? '', createdAt: r.created_at ?? '',
})

const rentToDb = (r: RentHistory): Row => ({
  id: r.id, property_id: r.propertyId, amount: r.amount,
  effective_month: r.effectiveMonth, created_at: r.createdAt,
  user_id: getUserId(),
})
const rentFromDb = (r: Row): RentHistory => ({
  id: r.id, propertyId: r.property_id, amount: r.amount,
  effectiveMonth: r.effective_month, createdAt: r.created_at ?? '',
})

// ── 批量拉取全部数据 ─────────────────────────────────────────

export async function fetchAll() {
  const userId = getUserId()
  const [p, b, e, rh] = await Promise.all([
    supabase.from('properties').select('*').eq('user_id', userId).order('created_at'),
    supabase.from('bookings').select('*').eq('user_id', userId).order('check_in', { ascending: false }),
    supabase.from('expenses').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('rent_history').select('*').eq('user_id', userId).order('effective_month'),
  ])
  return {
    properties:  (p.data  ?? []).map(propFromDb),
    bookings:    (b.data  ?? []).map(bookingFromDb),
    expenses:    (e.data  ?? []).map(expenseFromDb),
    rentHistory: (rh.data ?? []).map(rentFromDb),
  }
}

// ── Properties ───────────────────────────────────────────────

export const dbInsertProperty = (p: Property) =>
  supabase.from('properties').insert(propToDb(p))

export const dbUpdateProperty = (p: Property) =>
  supabase.from('properties').update(propToDb(p)).eq('id', p.id)

export const dbDeleteProperty = (id: string) =>
  supabase.from('properties').delete().eq('id', id)

// ── Bookings ─────────────────────────────────────────────────

export const dbInsertBooking = (b: Booking) =>
  supabase.from('bookings').insert(bookingToDb(b))

export const dbUpdateBooking = (b: Booking) =>
  supabase.from('bookings').update(bookingToDb(b)).eq('id', b.id)

export const dbDeleteBooking = (id: string) =>
  supabase.from('bookings').delete().eq('id', id)

// ── Expenses ─────────────────────────────────────────────────

export const dbInsertExpense = (e: ExpenseRecord) =>
  supabase.from('expenses').insert(expenseToDb(e))

export const dbDeleteExpense = (id: string) =>
  supabase.from('expenses').delete().eq('id', id)

// ── Rent History ─────────────────────────────────────────────

export const dbInsertRentHistory = (r: RentHistory) =>
  supabase.from('rent_history').insert(rentToDb(r))
