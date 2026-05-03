import { useState } from 'react'
import { Button, Modal, Select, message } from 'antd'
import { PlusOutlined, LeftOutlined, DeleteOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { ExpenseRecord, ExpenseType, Property, PropertyType } from '../types'

const STATUS_MAP = {
  available: { label: '空闲', color: '#52c41a', bg: '#f6ffed' },
  occupied: { label: '入住中', color: '#1677ff', bg: '#e6f4ff' },
  maintenance: { label: '维护中', color: '#fa8c16', bg: '#fff7e6' },
}

const EXP_TYPE: Record<ExpenseType, { label: string; color: string; bg: string }> = {
  utility:     { label: '物业水电暖气', color: '#1677ff', bg: '#e6f4ff' },
  maintenance: { label: '维修采购',     color: '#722ed1', bg: '#f9f0ff' },
  cleaning:    { label: '保洁',         color: '#13c2c2', bg: '#e6fffb' },
}

const COVER_COLORS = ['#1677ff', '#52c41a', '#fa8c16', '#722ed1', '#eb2f96', '#13c2c2', '#ff4d4f', '#faad14']

let idCounter = Date.now()
const genId = () => `x${++idCounter}`

// ── 房源详情页 ────────────────────────────────────────────────
function PropertyDetail({ property, onBack }: { property: Property; onBack: () => void }) {
  const { expenses, addExpense, deleteExpense, updateProperty, addRentHistory } = useStore()
  const [showExpForm, setShowExpForm] = useState(false)
  const [expType, setExpType] = useState<ExpenseType>('utility')
  const [expDate, setExpDate] = useState(dayjs().format('YYYY-MM-DD'))
  const [expAmount, setExpAmount] = useState('')
  const [expDesc, setExpDesc] = useState('')

  // 月租金修改状态
  const [editingRent, setEditingRent] = useState(false)
  const [newRent, setNewRent] = useState(String(property.monthlyRent))

  const propExpenses = expenses
    .filter((e) => e.propertyId === property.id)
    .sort((a, b) => b.date.localeCompare(a.date))

  const totalExpense = propExpenses.reduce((s, e) => s + e.amount, 0)

  const handleAddExp = () => {
    if (!expAmount || Number(expAmount) <= 0) { message.warning('请输入正确的金额'); return }
    const rec: ExpenseRecord = {
      id: genId(), propertyId: property.id, type: expType,
      date: expDate, amount: Number(expAmount),
      description: expDesc.trim(), createdAt: dayjs().format('YYYY-MM-DD'),
    }
    addExpense(rec)
    setExpAmount(''); setExpDesc('')
    setShowExpForm(false)
    message.success('支出已记录')
  }

  const handleDeleteExp = (id: string) => {
    Modal.confirm({
      title: '确认删除', content: '确定删除这条支出记录？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { deleteExpense(id); message.success('已删除') },
    })
  }

  const handleSaveRent = () => {
    const amount = Number(newRent)
    if (!amount || amount <= 0) { message.warning('请输入正确的金额'); return }
    const effectiveMonth = dayjs().format('YYYY-MM')
    addRentHistory({
      id: genId(), propertyId: property.id, amount,
      effectiveMonth, createdAt: dayjs().format('YYYY-MM-DD'),
    })
    updateProperty({ ...property, monthlyRent: amount })
    setEditingRent(false)
    message.success(`月租金已更新，从 ${effectiveMonth} 起生效`)
  }

  const lbl: React.CSSProperties = {
    fontSize: 15, color: '#595959', fontWeight: 500, display: 'block', marginBottom: 8,
  }
  const fieldBox: React.CSSProperties = {
    border: '1.5px solid #d9d9d9', borderRadius: 10, padding: '11px 14px',
    fontSize: 17, width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '0 0 90px' }}>
      {/* 顶栏 */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
        background: '#fff', borderBottom: '1px solid #f0f0f0',
        position: 'sticky', top: 0, zIndex: 10,
      }}>
        <button onClick={onBack} style={{
          width: 40, height: 40, borderRadius: 10, border: '1.5px solid #e8e8e8',
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <LeftOutlined style={{ fontSize: 16 }} />
        </button>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{property.name}</div>
          <div style={{ fontSize: 13, color: '#8c8c8c' }}>支出记录</div>
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        {/* 概览卡片 */}
        <div style={{
          background: property.coverColor, borderRadius: 20, padding: '18px 20px',
          marginBottom: 16, color: '#fff',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>月租金（当前）</div>
              {editingRent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    type="number"
                    value={newRent}
                    onChange={(e) => setNewRent(e.target.value)}
                    style={{
                      width: 120, height: 38, borderRadius: 8, border: 'none',
                      padding: '0 10px', fontSize: 18, color: '#1a1a1a',
                    }}
                  />
                  <button onClick={handleSaveRent} style={{
                    height: 38, padding: '0 14px', borderRadius: 8, border: 'none',
                    background: '#fff', color: property.coverColor, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                  }}>
                    保存
                  </button>
                  <button onClick={() => { setEditingRent(false); setNewRent(String(property.monthlyRent)) }} style={{
                    height: 38, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.5)',
                    background: 'transparent', color: '#fff', fontSize: 14, cursor: 'pointer',
                  }}>
                    取消
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 28, fontWeight: 800 }}>¥{property.monthlyRent}</div>
                  <button onClick={() => { setEditingRent(true); setNewRent(String(property.monthlyRent)) }} style={{
                    height: 30, padding: '0 12px', borderRadius: 8,
                    border: '1px solid rgba(255,255,255,0.6)',
                    background: 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer',
                  }}>
                    修改
                  </button>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 4 }}>变动支出合计</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>¥{totalExpense}</div>
            </div>
          </div>
          {editingRent && (
            <div style={{ marginTop: 10, fontSize: 12, opacity: 0.8 }}>
              ⚠️ 修改后从本月（{dayjs().format('YYYY年M月')}）起生效，历史数据不变
            </div>
          )}
        </div>

        {/* 新增支出按钮 */}
        <Button
          type="primary" block size="large" icon={<PlusOutlined />}
          style={{ height: 52, fontSize: 18, borderRadius: 14, marginBottom: 20 }}
          onClick={() => setShowExpForm(true)}
        >
          记录支出
        </Button>

        {/* 支出列表 */}
        <div style={{ fontSize: 16, fontWeight: 600, color: '#595959', marginBottom: 12 }}>
          支出明细 · 共 {propExpenses.length} 条
        </div>

        {propExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 16, paddingTop: 40 }}>
            暂无支出记录
          </div>
        ) : (
          propExpenses.map((e) => {
            const tc = EXP_TYPE[e.type]
            return (
              <div key={e.id} style={{
                background: '#fff', borderRadius: 16, padding: '14px 16px',
                marginBottom: 10, boxShadow: '0 1px 8px rgba(0,0,0,0.04)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 13, background: tc.bg, color: tc.color,
                      padding: '2px 10px', borderRadius: 20, fontWeight: 600,
                    }}>{tc.label}</span>
                    <span style={{ fontSize: 14, color: '#8c8c8c' }}>{dayjs(e.date).format('M月D日')}</span>
                  </div>
                  <div style={{ fontSize: 16, color: '#1a1a1a' }}>{e.description}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: '#ff4d4f' }}>¥{e.amount}</div>
                  <button onClick={() => handleDeleteExp(e.id)} style={{
                    width: 36, height: 36, border: 'none', background: '#fff1f0',
                    color: '#ff4d4f', borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <DeleteOutlined style={{ fontSize: 16 }} />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* 新增支出 Modal */}
      <Modal
        title="记录支出" open={showExpForm}
        onOk={handleAddExp} onCancel={() => setShowExpForm(false)}
        okText="保存" cancelText="取消" centered
      >
        <div style={{ paddingTop: 8 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={lbl}>支出类型</label>
            <div style={{ display: 'flex', gap: 10 }}>
              {(['utility', 'maintenance', 'cleaning'] as ExpenseType[]).map((t) => (
                <button key={t} onClick={() => setExpType(t)} style={{
                  flex: 1, height: 46, borderRadius: 10, border: '1.5px solid',
                  borderColor: expType === t ? EXP_TYPE[t].color : '#e8e8e8',
                  background: expType === t ? EXP_TYPE[t].bg : '#fff',
                  color: expType === t ? EXP_TYPE[t].color : '#595959',
                  fontSize: 16, cursor: 'pointer', fontWeight: expType === t ? 700 : 400,
                }}>
                  {EXP_TYPE[t].label}
                </button>
              ))}
            </div>
          </div>
          <label style={lbl}>日期</label>
          <div style={{ ...fieldBox, padding: '11px 14px', marginBottom: 14 }}>
            <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
          </div>
          <label style={lbl}>金额（元）</label>
          <input type="number" placeholder="请输入金额" value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)} style={{ ...fieldBox, marginBottom: 14 }} />
          <label style={lbl}>说明（选填）</label>
          <input type="text" placeholder="如：本月水电费" value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)} style={fieldBox} />
        </div>
      </Modal>
    </div>
  )
}

// ── 主列表页 ──────────────────────────────────────────────────
export default function Properties() {
  const { properties, addProperty, deleteProperty, addRentHistory } = useStore()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  // 新增房源表单
  const [fName, setFName] = useState('')
  const [fRent, setFRent] = useState('')
  const [fPrice, setFPrice] = useState('')
  const [fCapacity, setFCapacity] = useState('2')
  const [fType, setFType] = useState<PropertyType>('room')
  const [fDesc, setFDesc] = useState('')

  if (selectedId) {
    const prop = properties.find((p) => p.id === selectedId)
    if (prop) return <PropertyDetail property={prop} onBack={() => setSelectedId(null)} />
  }

  const handleAddProperty = () => {
    if (!fName.trim()) { message.warning('请输入房源名称'); return }
    const rent = Number(fRent)
    if (!rent || rent <= 0) { message.warning('请输入月租金'); return }
    const id = genId()
    const colorIndex = properties.length % COVER_COLORS.length
    const newProp: Property = {
      id, name: fName.trim(), type: fType,
      capacity: Number(fCapacity) || 2,
      pricePerNight: Number(fPrice) || 0,
      status: 'available',
      description: fDesc.trim(),
      coverColor: COVER_COLORS[colorIndex],
      monthlyRent: rent,
    }
    addProperty(newProp)
    addRentHistory({
      id: genId(), propertyId: id, amount: rent,
      effectiveMonth: dayjs().format('YYYY-MM'),
      createdAt: dayjs().format('YYYY-MM-DD'),
    })
    setFName(''); setFRent(''); setFPrice(''); setFCapacity('2'); setFType('room'); setFDesc('')
    setShowAddModal(false)
    message.success('房源已添加')
  }

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: `删除「${name}」`,
      content: '删除后该房源的所有预订和支出记录也会同步删除，确定吗？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { deleteProperty(id); message.success('已删除') },
    })
  }

  const lbl: React.CSSProperties = {
    fontSize: 15, color: '#595959', fontWeight: 500, display: 'block',
    marginBottom: 6, marginTop: 14,
  }
  const fieldBox: React.CSSProperties = {
    border: '1.5px solid #d9d9d9', borderRadius: 10, padding: '11px 14px',
    fontSize: 17, width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ padding: '16px 16px 90px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 22, fontWeight: 700 }}>
          房源管理
          <span style={{ fontSize: 14, color: '#8c8c8c', fontWeight: 400, marginLeft: 8 }}>
            共 {properties.length} 个
          </span>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />}
          style={{ height: 44, borderRadius: 12, fontWeight: 600 }}
          onClick={() => setShowAddModal(true)}>
          添加
        </Button>
      </div>

      {properties.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#bfbfbf', fontSize: 17, paddingTop: 60 }}>
          暂无房源，点击右上角添加
        </div>
      ) : (
        properties.map((p) => {
          const st = STATUS_MAP[p.status]
          return (
            <div key={p.id} style={{
              background: '#fff', borderRadius: 20, marginBottom: 14,
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)', overflow: 'hidden',
            }}>
              <div style={{ height: 6, background: p.coverColor }} />
              <div style={{ padding: '16px 18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>{p.name}</div>
                    <div style={{ fontSize: 15, color: '#8c8c8c', marginBottom: 8 }}>{p.description}</div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{
                        fontSize: 13, background: st.bg, color: st.color,
                        padding: '3px 12px', borderRadius: 20, fontWeight: 600,
                      }}>{st.label}</span>
                      {p.pricePerNight > 0 && (
                        <span style={{ fontSize: 14, color: '#8c8c8c' }}>¥{p.pricePerNight}/晚</span>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                    <div style={{ fontSize: 12, color: '#8c8c8c' }}>月租金</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#ff4d4f' }}>¥{p.monthlyRent}</div>
                  </div>
                </div>

                {/* 操作栏 */}
                <div style={{ marginTop: 12, display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => setSelectedId(p.id)}
                    style={{
                      flex: 1, height: 42, border: '1.5px solid #1677ff',
                      background: '#fff', color: '#1677ff', borderRadius: 10,
                      fontSize: 15, fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    支出记录 ›
                  </button>
                  <button
                    onClick={() => handleDelete(p.id, p.name)}
                    style={{
                      width: 42, height: 42, border: '1.5px solid #ff4d4f',
                      background: '#fff', color: '#ff4d4f', borderRadius: 10,
                      fontSize: 18, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <DeleteOutlined />
                  </button>
                </div>
              </div>
            </div>
          )
        })
      )}

      {/* 新增房源 Modal */}
      <Modal
        title="添加新房源" open={showAddModal}
        onOk={handleAddProperty} onCancel={() => setShowAddModal(false)}
        okText="添加" cancelText="取消" centered
      >
        <div>
          <label style={lbl}>房源名称 *</label>
          <input placeholder="如：海景大床房" value={fName}
            onChange={(e) => setFName(e.target.value)} style={fieldBox} />

          <label style={lbl}>月租金（元）*</label>
          <input type="number" placeholder="如：3000" value={fRent}
            onChange={(e) => setFRent(e.target.value)} style={fieldBox} />

          <label style={lbl}>每晚参考价格（元）</label>
          <input type="number" placeholder="如：388" value={fPrice}
            onChange={(e) => setFPrice(e.target.value)} style={fieldBox} />

          <label style={{ ...lbl, marginTop: 14 }}>容纳人数</label>
          <input type="number" placeholder="2" value={fCapacity}
            onChange={(e) => setFCapacity(e.target.value)} style={fieldBox} />

          <label style={{ ...lbl, marginTop: 14 }}>房源类型</label>
          <Select
            size="large" value={fType} onChange={setFType} style={{ width: '100%' }}
            options={[
              { label: '单间', value: 'room' },
              { label: '整套', value: 'entire' },
              { label: '床位', value: 'bed' },
            ]}
          />

          <label style={{ ...lbl, marginTop: 14 }}>简介</label>
          <textarea placeholder="房源特色描述..." value={fDesc}
            onChange={(e) => setFDesc(e.target.value)}
            style={{ ...fieldBox, height: 72, resize: 'none' }} />
        </div>
      </Modal>
    </div>
  )
}
