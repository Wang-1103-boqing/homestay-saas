export type PropertyType = 'entire' | 'room' | 'bed'
export type PropertyStatus = 'available' | 'occupied' | 'maintenance'
export type PaymentMethod = 'cash' | 'wechat' | 'alipay' | 'other'
export type PaymentStatus = 'paid' | 'pending' | 'partial'
export type ExpenseType = 'utility' | 'maintenance' | 'cleaning'
export type BookingMode = 'nightly' | 'monthly'

export interface Property {
  id: string
  name: string
  type: PropertyType
  capacity: number
  pricePerNight: number
  status: PropertyStatus
  description: string
  coverColor: string
  monthlyRent: number
}

export interface Booking {
  id: string
  propertyId: string
  guestName: string
  guestPhone: string
  checkIn: string
  checkOut: string
  totalAmount: number
  paidAmount: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  notes: string
  createdAt: string
  bookingMode?: BookingMode
}

export interface ExpenseRecord {
  id: string
  propertyId: string
  type: ExpenseType
  date: string
  amount: number
  description: string
  createdAt: string
}

export interface RentHistory {
  id: string
  propertyId: string
  amount: number
  effectiveMonth: string  // 'YYYY-MM'
  createdAt: string
}
