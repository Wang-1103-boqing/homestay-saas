import { useState, useMemo } from 'react'
import {
  Button, Col, DatePicker, Form, Input, InputNumber, Modal,
  Popconfirm, Row, Select, Space, Table, Tag, Typography,
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs, { Dayjs } from 'dayjs'
import { useStore } from '../store/useStore'
import type { Booking, PaymentMethod, PaymentStatus } from '../types'

const { RangePicker } = DatePicker

const PAY_STATUS_MAP: Record<PaymentStatus, { label: string; color: string }> = {
  paid: { label: '已付', color: 'green' },
  pending: { label: '待付', color: 'red' },
  partial: { label: '部分付', color: 'orange' },
}
const PAY_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '现金', wechat: '微信支付', alipay: '支付宝', other: '其他',
}

let idCounter = Date.now()
const genId = () => `b${++idCounter}`

export default function Bookings() {
  const { properties, bookings, addBooking, updateBooking, deleteBooking } = useStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Booking | null>(null)
  const [form] = Form.useForm()

  const [filterProperty, setFilterProperty] = useState<string | undefined>()
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | undefined>()
  const [filterRange, setFilterRange] = useState<[Dayjs, Dayjs] | null>(null)

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (filterProperty && b.propertyId !== filterProperty) return false
      if (filterStatus && b.paymentStatus !== filterStatus) return false
      if (filterRange) {
        const ci = dayjs(b.checkIn)
        if (ci.isBefore(filterRange[0], 'day') || ci.isAfter(filterRange[1], 'day')) return false
      }
      return true
    })
  }, [bookings, filterProperty, filterStatus, filterRange])

  const propMap = useMemo(() => Object.fromEntries(properties.map((p) => [p.id, p.name])), [properties])

  const openAdd = () => {
    setEditing(null)
    form.resetFields()
    setOpen(true)
  }

  const openEdit = (b: Booking) => {
    setEditing(b)
    form.setFieldsValue({
      ...b,
      dateRange: [dayjs(b.checkIn), dayjs(b.checkOut)],
    })
    setOpen(true)
  }

  const handleOk = async () => {
    const values = await form.validateFields()
    const { dateRange, ...rest } = values
    const booking: Booking = {
      ...rest,
      checkIn: dateRange[0].format('YYYY-MM-DD'),
      checkOut: dateRange[1].format('YYYY-MM-DD'),
      paymentStatus:
        rest.paidAmount >= rest.totalAmount ? 'paid' :
        rest.paidAmount > 0 ? 'partial' : 'pending',
      id: editing?.id ?? genId(),
      createdAt: editing?.createdAt ?? dayjs().format('YYYY-MM-DD'),
    }
    editing ? updateBooking(booking) : addBooking(booking)
    setOpen(false)
  }

  const nights = (checkIn: string, checkOut: string) =>
    dayjs(checkOut).diff(dayjs(checkIn), 'day')

  const columns = [
    { title: '房源', dataIndex: 'propertyId', render: (id: string) => propMap[id] || id },
    { title: '客人', dataIndex: 'guestName' },
    { title: '联系方式', dataIndex: 'guestPhone' },
    {
      title: '入住 → 退房', key: 'dates',
      render: (_: unknown, b: Booking) =>
        `${b.checkIn} → ${b.checkOut}（${nights(b.checkIn, b.checkOut)}晚）`,
    },
    {
      title: '金额', key: 'amount',
      render: (_: unknown, b: Booking) => (
        <span>¥{b.paidAmount} / <span style={{ color: '#999' }}>¥{b.totalAmount}</span></span>
      ),
    },
    { title: '支付方式', dataIndex: 'paymentMethod', render: (v: PaymentMethod) => PAY_METHOD_LABELS[v] },
    {
      title: '支付状态', dataIndex: 'paymentStatus',
      render: (v: PaymentStatus) => <Tag color={PAY_STATUS_MAP[v].color}>{PAY_STATUS_MAP[v].label}</Tag>,
    },
    {
      title: '操作', key: 'actions',
      render: (_: unknown, b: Booking) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(b)}>编辑</Button>
          <Popconfirm title="确认删除？" onConfirm={() => deleteBooking(b.id)} okText="删除" cancelText="取消">
            <Button size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>预订记录</Typography.Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={openAdd}>新增预订</Button>
      </div>

      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={8} md={6}>
          <Select
            allowClear placeholder="筛选房源" style={{ width: '100%' }}
            value={filterProperty} onChange={setFilterProperty}
            options={properties.map((p) => ({ label: p.name, value: p.id }))}
          />
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Select
            allowClear placeholder="支付状态" style={{ width: '100%' }}
            value={filterStatus} onChange={setFilterStatus}
            options={[
              { label: '已付', value: 'paid' },
              { label: '待付', value: 'pending' },
              { label: '部分付', value: 'partial' },
            ]}
          />
        </Col>
        <Col xs={24} sm={8} md={8}>
          <RangePicker
            style={{ width: '100%' }} placeholder={['入住开始', '入住结束']}
            value={filterRange}
            onChange={(v) => setFilterRange(v as [Dayjs, Dayjs] | null)}
          />
        </Col>
      </Row>

      <Table
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        scroll={{ x: true }}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editing ? '编辑预订' : '新增预订'}
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText="保存"
        cancelText="取消"
        width={600}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="propertyId" label="房源" rules={[{ required: true, message: '请选择房源' }]}>
            <Select options={properties.map((p) => ({ label: p.name, value: p.id }))} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="guestName" label="客人姓名" rules={[{ required: true }]}>
                <Input placeholder="客人姓名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="guestPhone" label="联系方式">
                <Input placeholder="手机号" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dateRange" label="入住 / 退房日期" rules={[{ required: true, message: '请选择日期' }]}>
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="totalAmount" label="总金额" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="paidAmount" label="已付金额" rules={[{ required: true }]}>
                <InputNumber min={0} style={{ width: '100%' }} addonBefore="¥" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="支付方式" rules={[{ required: true }]}>
                <Select options={[
                  { label: '微信支付', value: 'wechat' },
                  { label: '支付宝', value: 'alipay' },
                  { label: '现金', value: 'cash' },
                  { label: '其他', value: 'other' },
                ]} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="notes" label="备注">
            <Input.TextArea rows={2} placeholder="特殊要求等..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
