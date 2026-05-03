import { create } from 'zustand'
import type { Property, Booking, ExpenseRecord, RentHistory } from '../types'
import {
  dbInsertProperty, dbUpdateProperty, dbDeleteProperty,
  dbInsertBooking, dbUpdateBooking, dbDeleteBooking,
  dbInsertExpense, dbDeleteExpense,
  dbInsertRentHistory,
} from '../lib/db'

interface AllData {
  properties: Property[]
  bookings: Booking[]
  expenses: ExpenseRecord[]
  rentHistory: RentHistory[]
}

interface StoreState extends AllData {
  initialized: boolean
  setAll: (data: AllData) => void
  addProperty: (p: Property) => void
  updateProperty: (p: Property) => void
  deleteProperty: (id: string) => void
  addBooking: (b: Booking) => void
  updateBooking: (b: Booking) => void
  deleteBooking: (id: string) => void
  addExpense: (e: ExpenseRecord) => void
  deleteExpense: (id: string) => void
  addRentHistory: (r: RentHistory) => void
}

const log = (op: string, err: unknown) => console.error(`[db] ${op}`, err)

export const useStore = create<StoreState>()((set) => ({
  properties:  [],
  bookings:    [],
  expenses:    [],
  rentHistory: [],
  initialized: false,

  setAll: (data) => set({ ...data, initialized: true }),

  addProperty: (p) => {
    set((s) => ({ properties: [...s.properties, p] }))
    dbInsertProperty(p).then(({ error }) => { if (error) log('insertProperty', error) })
  },
  updateProperty: (p) => {
    set((s) => ({ properties: s.properties.map((x) => (x.id === p.id ? p : x)) }))
    dbUpdateProperty(p).then(({ error }) => { if (error) log('updateProperty', error) })
  },
  deleteProperty: (id) => {
    set((s) => ({
      properties:  s.properties.filter((x) => x.id !== id),
      bookings:    s.bookings.filter((x) => x.propertyId !== id),
      expenses:    s.expenses.filter((x) => x.propertyId !== id),
      rentHistory: s.rentHistory.filter((x) => x.propertyId !== id),
    }))
    dbDeleteProperty(id).then(({ error }) => { if (error) log('deleteProperty', error) })
  },

  addBooking: (b) => {
    set((s) => ({ bookings: [...s.bookings, b] }))
    dbInsertBooking(b).then(({ error }) => { if (error) log('insertBooking', error) })
  },
  updateBooking: (b) => {
    set((s) => ({ bookings: s.bookings.map((x) => (x.id === b.id ? b : x)) }))
    dbUpdateBooking(b).then(({ error }) => { if (error) log('updateBooking', error) })
  },
  deleteBooking: (id) => {
    set((s) => ({ bookings: s.bookings.filter((x) => x.id !== id) }))
    dbDeleteBooking(id).then(({ error }) => { if (error) log('deleteBooking', error) })
  },

  addExpense: (e) => {
    set((s) => ({ expenses: [...s.expenses, e] }))
    dbInsertExpense(e).then(({ error }) => { if (error) log('insertExpense', error) })
  },
  deleteExpense: (id) => {
    set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) }))
    dbDeleteExpense(id).then(({ error }) => { if (error) log('deleteExpense', error) })
  },

  addRentHistory: (r) => {
    set((s) => ({ rentHistory: [...s.rentHistory, r] }))
    dbInsertRentHistory(r).then(({ error }) => { if (error) log('insertRentHistory', error) })
  },
}))
