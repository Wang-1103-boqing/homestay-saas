import type { Property, Booking, ExpenseRecord, RentHistory } from '../types'

export const mockProperties: Property[] = [
  {
    id: 'p1', name: '海景大床房', type: 'room', capacity: 2,
    pricePerNight: 388, status: 'occupied',
    description: '落地窗直面大海，早晨可观日出', coverColor: '#1677ff',
    monthlyRent: 3000,
  },
  {
    id: 'p2', name: '山景套房', type: 'entire', capacity: 4,
    pricePerNight: 688, status: 'available',
    description: '独栋山景别墅，含独立厨房和露台', coverColor: '#52c41a',
    monthlyRent: 5000,
  },
  {
    id: 'p3', name: '复古庭院双人间', type: 'room', capacity: 2,
    pricePerNight: 268, status: 'available',
    description: '老宅改造，保留原汁原味的江南庭院风格', coverColor: '#fa8c16',
    monthlyRent: 2000,
  },
  {
    id: 'p4', name: '城景豪华套间', type: 'entire', capacity: 6,
    pricePerNight: 980, status: 'maintenance',
    description: '顶楼整套，180度城市全景，含按摩浴缸', coverColor: '#722ed1',
    monthlyRent: 8000,
  },
]

const today = new Date()
const fmt = (d: Date) => d.toISOString().split('T')[0]
const addDays = (d: Date, n: number) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }

export const mockBookings: Booking[] = [
  {
    id: 'b1', propertyId: 'p1', guestName: '张伟', guestPhone: '13800138001',
    checkIn: fmt(addDays(today, -3)), checkOut: fmt(addDays(today, 2)),
    totalAmount: 1940, paidAmount: 1940, paymentMethod: 'wechat',
    paymentStatus: 'paid', notes: '需要无烟房', createdAt: fmt(addDays(today, -5)),
  },
  {
    id: 'b2', propertyId: 'p2', guestName: '李芳', guestPhone: '13900139002',
    checkIn: fmt(addDays(today, 5)), checkOut: fmt(addDays(today, 8)),
    totalAmount: 2064, paidAmount: 2064, paymentMethod: 'alipay',
    paymentStatus: 'paid', notes: '携带宠物', createdAt: fmt(addDays(today, -1)),
  },
  {
    id: 'b3', propertyId: 'p3', guestName: '王强', guestPhone: '13700137003',
    checkIn: fmt(addDays(today, -10)), checkOut: fmt(addDays(today, -7)),
    totalAmount: 804, paidAmount: 804, paymentMethod: 'cash',
    paymentStatus: 'paid', notes: '', createdAt: fmt(addDays(today, -12)),
  },
  {
    id: 'b4', propertyId: 'p1', guestName: '陈敏', guestPhone: '13600136004',
    checkIn: fmt(addDays(today, 10)), checkOut: fmt(addDays(today, 13)),
    totalAmount: 1164, paidAmount: 1164, paymentMethod: 'wechat',
    paymentStatus: 'paid', notes: '生日当天到，请准备小蛋糕', createdAt: fmt(today),
  },
  {
    id: 'b5', propertyId: 'p2', guestName: '刘洋', guestPhone: '13500135005',
    checkIn: fmt(addDays(today, -20)), checkOut: fmt(addDays(today, -16)),
    totalAmount: 2752, paidAmount: 2752, paymentMethod: 'alipay',
    paymentStatus: 'paid', notes: '', createdAt: fmt(addDays(today, -22)),
  },
  {
    id: 'b6', propertyId: 'p3', guestName: '赵静', guestPhone: '13400134006',
    checkIn: fmt(addDays(today, 3)), checkOut: fmt(addDays(today, 6)),
    totalAmount: 804, paidAmount: 804, paymentMethod: 'wechat',
    paymentStatus: 'paid', notes: '', createdAt: fmt(addDays(today, -2)),
  },
]

export const mockExpenses: ExpenseRecord[] = [
  {
    id: 'e1', propertyId: 'p1', type: 'utility',
    date: fmt(addDays(today, -8)), amount: 280, description: '本月水电费',
    createdAt: fmt(addDays(today, -8)),
  },
  {
    id: 'e2', propertyId: 'p1', type: 'maintenance',
    date: fmt(addDays(today, -5)), amount: 150, description: '更换浴室花洒',
    createdAt: fmt(addDays(today, -5)),
  },
  {
    id: 'e3', propertyId: 'p2', type: 'utility',
    date: fmt(addDays(today, -6)), amount: 420, description: '本月水电暖气费',
    createdAt: fmt(addDays(today, -6)),
  },
  {
    id: 'e4', propertyId: 'p2', type: 'maintenance',
    date: fmt(addDays(today, -3)), amount: 320, description: '购买新床上用品',
    createdAt: fmt(addDays(today, -3)),
  },
  {
    id: 'e5', propertyId: 'p3', type: 'utility',
    date: fmt(addDays(today, -9)), amount: 180, description: '本月水电费',
    createdAt: fmt(addDays(today, -9)),
  },
  {
    id: 'e6', propertyId: 'p4', type: 'maintenance',
    date: fmt(addDays(today, -4)), amount: 1200, description: '按摩浴缸维修',
    createdAt: fmt(addDays(today, -4)),
  },
]

const thisMonth = fmt(today).slice(0, 7)
export const mockRentHistory: RentHistory[] = [
  { id: 'rh1', propertyId: 'p1', amount: 3000, effectiveMonth: '2025-01', createdAt: '2025-01-01' },
  { id: 'rh2', propertyId: 'p2', amount: 5000, effectiveMonth: '2025-01', createdAt: '2025-01-01' },
  { id: 'rh3', propertyId: 'p3', amount: 2000, effectiveMonth: '2025-01', createdAt: '2025-01-01' },
  { id: 'rh4', propertyId: 'p4', amount: 8000, effectiveMonth: '2025-01', createdAt: '2025-01-01' },
  // simulate p1 rent increase in the current month
  { id: 'rh5', propertyId: 'p1', amount: 3000, effectiveMonth: thisMonth, createdAt: fmt(today) },
]
