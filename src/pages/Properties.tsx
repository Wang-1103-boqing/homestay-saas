import { useState } from 'react'
import { Button, Modal, Select, message } from 'antd'
import { ChevronLeft, Plus, Trash2 } from 'lucide-react'
import dayjs from 'dayjs'
import { useStore } from '../store/useStore'
import type { ExpenseRecord, ExpenseType, Property, PropertyType } from '../types'

const STATUS_MAP = {
  available:   { label: '上架中',  color: 'var(--green)', bg: 'var(--green-l)' },
  occupied:    { label: '入住中',  color: 'var(--green)', bg: 'var(--green-l)' },
  maintenance: { label: '维护中',  color: 'var(--warm)',  bg: '#fdf2e4' },
}

const EXP_TYPE: Record<ExpenseType, { label: string; color: string; bg: string }> = {
  utility:     { label: '物业水电暖气', color: 'var(--green2)', bg: 'var(--green-l)' },
  maintenance: { label: '维修采购',     color: 'var(--warm)',   bg: '#fdf2e4' },
  cleaning:    { label: '保洁',         color: 'var(--text-2)', bg: 'var(--bg)' },
}

const COVER_COLORS = [
  '#3c6652', '#c9a87c', '#7aab94', '#2a4a3a',
  '#a3c4b0', '#b5804d', '#8a6a4a', '#4a7a62',
]

let idCounter = Date.now()
const genId = () => `x${++idCounter}`

// ── 房源详情页 ────────────────────────────────────────────────
function PropertyDetail({ property, onBack }: { property: Property; onBack: () => void }) {
  const { expenses, addExpense, deleteExpense, updateProperty, addRentHistory } = useStore()
  const [showExpForm, setShowExpForm]   = useState(false)
  const [expType, setExpType]           = useState<ExpenseType>('utility')
  const [expDate, setExpDate]           = useState(dayjs().format('YYYY-MM-DD'))
  const [expAmount, setExpAmount]       = useState('')
  const [expDesc, setExpDesc]           = useState('')
  const [editingRent, setEditingRent]   = useState(false)
  const [newRent, setNewRent]           = useState(String(property.monthlyRent))

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
    setExpAmount(''); setExpDesc(''); setShowExpForm(false)
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
    addRentHistory({ id: genId(), propertyId: property.id, amount, effectiveMonth, createdAt: dayjs().format('YYYY-MM-DD') })
    updateProperty({ ...property, monthlyRent: amount })
    setEditingRent(false)
    message.success(`月租金已更新，从 ${effectiveMonth} 起生效`)
  }

  const lbl: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-3)', fontWeight: 600,
    display: 'block', marginBottom: 5, marginTop: 12, letterSpacing: 0.5,
  }
  const fieldBox: React.CSSProperties = {
    border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px',
    fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', outline: 'none', color: 'var(--text-1)',
  }

  return (
    <div style={{ padding: '0 0 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 10 }}>
        <button onClick={onBack} style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid var(--border)', background: 'var(--card-bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronLeft size={16} color="var(--text-2)" />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>{property.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)' }}>支出记录</div>
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* 概览卡片 */}
        <div style={{ background: property.coverColor, borderRadius: 16, padding: '16px 18px', marginBottom: 14, color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>月租金（当前）</div>
              {editingRent ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type="number" value={newRent} onChange={(e) => setNewRent(e.target.value)}
                    style={{ width: 110, height: 36, borderRadius: 8, border: 'none', padding: '0 10px', fontSize: 16, color: 'var(--text-1)' }} />
                  <button onClick={handleSaveRent} style={{ height: 36, padding: '0 12px', borderRadius: 8, border: 'none', background: '#fff', color: property.coverColor, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>保存</button>
                  <button onClick={() => { setEditingRent(false); setNewRent(String(property.monthlyRent)) }} style={{ height: 36, padding: '0 10px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.4)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>取消</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ fontSize: 26, fontWeight: 800 }}>¥{property.monthlyRent}</div>
                  <button onClick={() => { setEditingRent(true); setNewRent(String(property.monthlyRent)) }} style={{ height: 28, padding: '0 10px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.5)', background: 'transparent', color: '#fff', fontSize: 12, cursor: 'pointer' }}>修改</button>
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>变动支出合计</div>
              <div style={{ fontSize: 26, fontWeight: 800 }}>¥{totalExpense}</div>
            </div>
          </div>
        </div>

        <Button type="primary" block size="large" icon={<Plus size={16} />}
          style={{ height: 48, fontSize: 15, borderRadius: 12, marginBottom: 18, background: 'var(--green)', borderColor: 'var(--green)' }}
          onClick={() => setShowExpForm(true)}>
          记录支出
        </Button>

        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 10 }}>
          支出明细 · 共 {propExpenses.length} 条
        </div>

        {propExpenses.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 14, paddingTop: 40 }}>暂无支出记录</div>
        ) : propExpenses.map((e) => {
          const tc = EXP_TYPE[e.type]
          return (
            <div key={e.id} style={{ background: 'var(--card-bg)', borderRadius: 12, padding: '12px 14px', marginBottom: 8, boxShadow: '0 1px 8px rgba(42,74,58,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ fontSize: 10, background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: 999, fontWeight: 600 }}>{tc.label}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{dayjs(e.date).format('M月D日')}</span>
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-1)' }}>{e.description}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--warm)' }}>¥{e.amount}</div>
                <button onClick={() => handleDeleteExp(e.id)} style={{ width: 32, height: 32, border: 'none', background: 'var(--bg)', color: 'var(--text-3)', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal title="记录支出" open={showExpForm} onOk={handleAddExp} onCancel={() => setShowExpForm(false)} okText="保存" cancelText="取消" centered>
        <div style={{ paddingTop: 8 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl}>支出类型</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['utility', 'maintenance', 'cleaning'] as ExpenseType[]).map((t) => (
                <button key={t} onClick={() => setExpType(t)} style={{ flex: 1, height: 42, borderRadius: 10, border: '1.5px solid', borderColor: expType === t ? 'var(--green)' : 'var(--border)', background: expType === t ? 'var(--green-l)' : 'var(--card-bg)', color: expType === t ? 'var(--green)' : 'var(--text-2)', fontSize: 12, cursor: 'pointer', fontWeight: expType === t ? 700 : 400 }}>
                  {EXP_TYPE[t].label}
                </button>
              ))}
            </div>
          </div>
          <label style={lbl}>日期</label>
          <div style={{ ...fieldBox, padding: '11px 14px', marginBottom: 12 }}>
            <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} />
          </div>
          <label style={lbl}>金额（元）</label>
          <input type="number" placeholder="请输入金额" value={expAmount} onChange={(e) => setExpAmount(e.target.value)} style={{ ...fieldBox, marginBottom: 12 }} />
          <label style={lbl}>说明（选填）</label>
          <input type="text" placeholder="如：本月水电费" value={expDesc} onChange={(e) => setExpDesc(e.target.value)} style={fieldBox} />
        </div>
      </Modal>
    </div>
  )
}

// ── 主列表页 ──────────────────────────────────────────────────
export default function Properties() {
  const { properties, addProperty, deleteProperty, addRentHistory } = useStore()
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [fName, setFName]         = useState('')
  const [fRent, setFRent]         = useState('')
  const [fPrice, setFPrice]       = useState('')
  const [fCapacity, setFCapacity] = useState('2')
  const [fType, setFType]         = useState<PropertyType>('room')
  const [fDesc, setFDesc]         = useState('')

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
      status: 'available', description: fDesc.trim(),
      coverColor: COVER_COLORS[colorIndex], monthlyRent: rent,
    }
    addProperty(newProp)
    addRentHistory({ id: genId(), propertyId: id, amount: rent, effectiveMonth: dayjs().format('YYYY-MM'), createdAt: dayjs().format('YYYY-MM-DD') })
    setFName(''); setFRent(''); setFPrice(''); setFCapacity('2'); setFType('room'); setFDesc('')
    setShowAddModal(false)
    message.success('房源已添加')
  }

  const handleDelete = (id: string, name: string) => {
    Modal.confirm({
      title: `删除「${name}」`, content: '删除后该房源的所有预订和支出记录也会同步删除，确定吗？',
      okText: '删除', okType: 'danger', cancelText: '取消',
      onOk: () => { deleteProperty(id); message.success('已删除') },
    })
  }

  const lbl: React.CSSProperties = {
    fontSize: 12, color: 'var(--text-3)', fontWeight: 600,
    display: 'block', marginBottom: 5, marginTop: 12, letterSpacing: 0.5,
  }
  const fieldBox: React.CSSProperties = {
    border: '1.5px solid var(--border)', borderRadius: 10, padding: '11px 14px',
    fontSize: 15, width: '100%', boxSizing: 'border-box' as const,
    fontFamily: 'inherit', outline: 'none', color: 'var(--text-1)',
  }

  return (
    <div style={{ padding: '14px 14px 100px', background: 'var(--bg)', minHeight: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
          房源管理
          <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 400, marginLeft: 8 }}>共 {properties.length} 间</span>
        </div>
        <button onClick={() => setShowAddModal(true)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'var(--green)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(60,102,82,0.3)' }}>
          <Plus size={16} />
        </button>
      </div>

      {properties.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-3)', fontSize: 15, paddingTop: 60 }}>暂无房源，点击右上角添加</div>
      ) : properties.map((p) => {
        const st = STATUS_MAP[p.status]
        return (
          <div key={p.id} style={{ background: 'var(--card-bg)', borderRadius: 14, marginBottom: 10, overflow: 'hidden', boxShadow: '0 2px 16px rgba(42,74,58,0.08)' }}>
            {/* 封面色块 */}
            <div style={{ height: 60, background: `linear-gradient(135deg, ${p.coverColor}88, ${p.coverColor})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: 26 }}>🏡</div>
            </div>
            <div style={{ padding: '10px 14px 12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-1)' }}>{p.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 2 }}>
                    日租 ¥{p.pricePerNight} · 月租 ¥{p.monthlyRent}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: 9, padding: '2px 8px', borderRadius: 999, fontWeight: 600, background: st.bg, color: st.color }}>{st.label}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setSelectedId(p.id)} style={{ flex: 1, height: 34, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-2)', borderRadius: 9, fontSize: 12, cursor: 'pointer' }}>
                  支出记录 ›
                </button>
                <button onClick={() => handleDelete(p.id, p.name)} style={{ width: 34, height: 34, border: '1px solid var(--border)', background: 'var(--card-bg)', color: 'var(--text-3)', borderRadius: 9, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        )
      })}

      {/* 添加房源虚线按钮 */}
      <button onClick={() => setShowAddModal(true)} style={{ width: '100%', border: '1.5px dashed var(--border)', borderRadius: 14, padding: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--text-3)', fontSize: 13, background: 'transparent', cursor: 'pointer' }}>
        <Plus size={14} color="var(--text-3)" />
        添加房源
      </button>

      {/* 新增房源 Modal */}
      <Modal title="添加新房源" open={showAddModal} onOk={handleAddProperty} onCancel={() => setShowAddModal(false)} okText="添加" cancelText="取消" centered>
        <div>
          <label style={lbl}>房源名称 *</label>
          <input placeholder="如：竹间客房" value={fName} onChange={(e) => setFName(e.target.value)} style={fieldBox} />
          <label style={lbl}>月租金（元）*</label>
          <input type="number" placeholder="如：3000" value={fRent} onChange={(e) => setFRent(e.target.value)} style={fieldBox} />
          <label style={lbl}>每晚参考价格（元）</label>
          <input type="number" placeholder="如：388" value={fPrice} onChange={(e) => setFPrice(e.target.value)} style={fieldBox} />
          <label style={lbl}>容纳人数</label>
          <input type="number" placeholder="2" value={fCapacity} onChange={(e) => setFCapacity(e.target.value)} style={fieldBox} />
          <label style={lbl}>房源类型</label>
          <Select size="large" value={fType} onChange={setFType} style={{ width: '100%' }} options={[{ label: '单间', value: 'room' }, { label: '整套', value: 'entire' }, { label: '床位', value: 'bed' }]} />
          <label style={lbl}>简介</label>
          <textarea placeholder="房源特色描述..." value={fDesc} onChange={(e) => setFDesc(e.target.value)} style={{ ...fieldBox, height: 72, resize: 'none' }} />
        </div>
      </Modal>
    </div>
  )
}
