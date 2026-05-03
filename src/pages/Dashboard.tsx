import { useMemo } from 'react'
import { Card, Col, Row, Statistic, Table } from 'antd'
import {
  ArrowUpOutlined,
  HomeOutlined,
  CalendarOutlined,
  DollarOutlined,
} from '@ant-design/icons'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'

const COLORS = ['#4096ff', '#52c41a', '#fa8c16', '#722ed1']
const PAY_LABELS: Record<string, string> = {
  cash: '现金', wechat: '微信', alipay: '支付宝', other: '其他',
}

export default function Dashboard() {
  const { properties, bookings } = useStore()

  const now = dayjs()
  const monthStart = now.startOf('month')
  const yearStart = now.startOf('year')

  const stats = useMemo(() => {
    const monthBookings = bookings.filter((b) => dayjs(b.checkIn).isAfter(monthStart.subtract(1, 'day')))
    const monthIncome = monthBookings.reduce((s, b) => s + b.paidAmount, 0)
    const yearIncome = bookings
      .filter((b) => dayjs(b.checkIn).isAfter(yearStart.subtract(1, 'day')))
      .reduce((s, b) => s + b.paidAmount, 0)
    const occupied = properties.filter((p) => p.status === 'occupied').length
    const occupancyRate = properties.length ? Math.round((occupied / properties.length) * 100) : 0

    return { monthIncome, yearIncome, occupancyRate, monthCount: monthBookings.length }
  }, [bookings, properties, monthStart, yearStart])

  const trendData = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = now.subtract(5 - i, 'month')
      const label = m.format('M月')
      const income = bookings
        .filter((b) => dayjs(b.checkIn).format('YYYY-MM') === m.format('YYYY-MM'))
        .reduce((s, b) => s + b.paidAmount, 0)
      return { label, income }
    })
  }, [bookings, now])

  const payData = useMemo(() => {
    const map: Record<string, number> = {}
    bookings.forEach((b) => { map[b.paymentMethod] = (map[b.paymentMethod] || 0) + b.paidAmount })
    return Object.entries(map).map(([k, v]) => ({ name: PAY_LABELS[k] || k, value: v }))
  }, [bookings])

  const propertyRank = useMemo(() => {
    return properties
      .map((p) => ({
        key: p.id,
        name: p.name,
        income: bookings.filter((b) => b.propertyId === p.id).reduce((s, b) => s + b.paidAmount, 0),
        count: bookings.filter((b) => b.propertyId === p.id).length,
      }))
      .sort((a, b) => b.income - a.income)
  }, [bookings, properties])

  return (
    <div style={{ padding: 24 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月收入"
              value={stats.monthIncome}
              prefix={<DollarOutlined />}
              suffix="元"
              valueStyle={{ color: '#4096ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本年累计收入"
              value={stats.yearIncome}
              prefix={<ArrowUpOutlined />}
              suffix="元"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="当前入住率"
              value={stats.occupancyRate}
              prefix={<HomeOutlined />}
              suffix="%"
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="本月预订数"
              value={stats.monthCount}
              prefix={<CalendarOutlined />}
              suffix="单"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="近6个月收入趋势">
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(v) => [`¥${v}`, '收入']} />
                <Line type="monotone" dataKey="income" stroke="#4096ff" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="支付方式分布">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={payData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {payData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend />
                <Tooltip formatter={(v) => [`¥${v}`, '金额']} />
              </PieChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <Card title="房源收入排行">
            <Table
              dataSource={propertyRank}
              pagination={false}
              columns={[
                { title: '房源', dataIndex: 'name' },
                { title: '累计收入', dataIndex: 'income', render: (v) => `¥${v}`, sorter: (a, b) => a.income - b.income },
                { title: '预订次数', dataIndex: 'count', render: (v) => `${v} 次` },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </div>
  )
}
