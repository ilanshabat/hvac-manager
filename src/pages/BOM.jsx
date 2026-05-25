import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BOM({ project, onBack }) {
  const [orders, setOrders] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list') // list | newOrder | newSection
  const [expandedOrder, setExpandedOrder] = useState(null)

  // טופס הזמנה חדשה
  const [supplier, setSupplier] = useState('')
  const [orderNum, setOrderNum] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [orderItems, setOrderItems] = useState([{ section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])
  const [saving, setSaving] = useState(false)

  // טופס סעיף חדש
  const [secNum, setSecNum] = useState('')
  const [secName, setSecName] = useState('')
  const [secUnit, setSecUnit] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: o }, { data: s }] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('bom_items').select('*').eq('project_id', project.id).order('part_number')
    ])
    setOrders(o || [])
    setSections(s || [])
    setLoading(false)
  }

  const addSection = async () => {
    if (!secName.trim()) return
    setSaving(true)
    await supabase.from('bom_items').insert([{
      project_id: project.id,
      name: secName,
      part_number: secNum || '-',
      unit: secUnit,
      status: 'pending',
      is_critical: false
    }])
    setSecNum(''); setSecName(''); setSecUnit('')
    setView('list')
    await fetchAll()
    setSaving(false)
  }

  const addOrderItem = () => {
    setOrderItems([...orderItems, { section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])
  }

  const updateOrderItem = (i, field, val) => {
    const updated = [...orderItems]
    updated[i] = { ...updated[i], [field]: val }
    // אם בחר סעיף — מלא אוטומטית יחידה ותיאור
    if (field === 'section_id' && val) {
      const sec = sections.find(s => s.id === val)
      if (sec) {
        updated[i].description = sec.name
        updated[i].unit = sec.unit || ''
      }
    }
    setOrderItems(updated)
  }

  const removeOrderItem = (i) => {
    setOrderItems(orderItems.filter((_, idx) => idx !== i))
  }

  const calcTotal = () => {
    return orderItems.reduce((sum, item) => {
      const t = (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
      return sum + t
    }, 0)
  }

  const saveOrder = async () => {
    if (!supplier.trim()) { alert('הזן שם ספק'); return }
    if (orderItems.some(i => !i.quantity || !i.unit_price)) { alert('מלא כמות ומחיר לכל שורה'); return }
    setSaving(true)

    const total = calcTotal()
    const { data: order } = await supabase.from('orders').insert([{
      project_id: project.id,
      supplier,
      order_number: orderNum,
      order_date: orderDate || null,
      total_amount: total
    }]).select().single()

    if (order) {
      const rows = orderItems.map(item => {
        const sec = sections.find(s => s.id === item.section_id)
        return {
          order_id: order.id,
          bom_item_id: item.section_id || null,
          section_number: sec?.part_number || '',
          description: item.description,
          unit: item.unit,
          quantity: parseFloat(item.quantity) || 0,
          unit_price: parseFloat(item.unit_price) || 0,
          total_price: (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0)
        }
      })
      await supabase.from('order_items').insert(rows)
    }

    setSupplier(''); setOrderNum(''); setOrderDate('')
    setOrderItems([{ section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])
    setView('list')
    await fetchAll()
    setSaving(false)
  }

  const grandTotal = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    top: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer' },
    topInfo: { flex:1 },
    topTitle: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    topSub: { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' },
    body: { padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' },
    totalCard: { background:'#2D4A3E', borderRadius:'18px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    totalLbl: { fontSize:'13px', color:'rgba(255,255,255,0.75)' },
    totalVal: { fontSize:'22px', fontWeight:'600', color:'#fff' },
    btn1: { width:'100%', padding:'13px', background:'#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    btn2: { width:'100%', padding:'12px', background:'#F5F2EC', border:'1.5px solid #E8E4DC', borderRadius:'14px', color:'#6B6457', fontSize:'13px', fontWeight:'500', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    orderCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'10px' },
    orderHdr: { padding:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' },
    orderSupplier: { fontSize:'15px', fontWeight:'600', color:'#1C2B20' },
    orderMeta: { fontSize:'12px', color:'#9B9280', marginTop:'2px' },
    orderTotal: { fontSize:'16px', fontWeight:'600', color:'#2D4A3E' },
    orderItems: { borderTop:'1px solid #F0EDE6', padding:'0' },
    oi: { padding:'10px 14px', borderBottom:'1px solid #F5F2EC', display:'flex', alignItems:'center', gap:'8px' },
    oiSec: { fontSize:'10px', fontWeight:'600', color:'#2D4A3E', background:'#E8F5EF', padding:'2px 7px', borderRadius:'6px', whiteSpace:'nowrap', flexShrink:0 },
    oiDesc: { flex:1, fontSize:'12px', color:'#1C2B20' },
    oiPrice: { fontSize:'12px', fontWeight:'600', color:'#1C2B20', whiteSpace:'nowrap' },
    orderSum: { padding:'10px 14px', background:'#F9F7F4', display:'flex', justifyContent:'space-between', alignItems:'center' },
    empty: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    formCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px' },
    formTitle: { fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'14px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'13px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'8px' },
    row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' },
    itemBox: { background:'#F9F7F4', borderRadius:'12px', padding:'12px', border:'1px solid #E8E4DC', marginBottom:'10px', position:'relative' },
    removeBtn: { position:'absolute', top:'8px', left:'8px', background:'#FDF0ED', border:'none', borderRadius:'8px', padding:'3px 8px', fontSize:'11px', color:'#C0392B', cursor:'pointer' },
    addRowBtn: { width:'100%', padding:'10px', background:'#F5F2EC', border:'1.5px dashed #D4CFCA', borderRadius:'12px', fontSize:'13px', color:'#9B9280', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'10px' },
    totalRow: { background:'#E8F5EF', borderRadius:'12px', padding:'12px 14px', display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'12px' },
    totalLblF: { fontSize:'13px', fontWeight:'600', color:'#2D4A3E' },
    totalValF: { fontSize:'18px', fontWeight:'600', color:'#2D4A3E' },
    save: { width:'100%', padding:'12px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'8px' },
    cancel: { width:'100%', padding:'11px', background:'#F5F2EC', border:'none', borderRadius:'12px', color:'#6B6457', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
  }

  // מסך הוספת סעיף
  if (view === 'newSection') return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={()=>setView('list')}>→</button>
        <div style={s.topInfo}><div style={s.topTitle}>סעיף חדש</div></div>
      </div>
      <div style={s.body}>
        <div style={s.formCard}>
          <div style={s.lbl}>מספר סעיף</div>
          <input style={s.inp} placeholder="15.01.0001" value={secNum} onChange={e=>setSecNum(e.target.value)} />
          <div style={s.lbl}>תיאור הסעיף *</div>
          <input style={s.inp} placeholder="תיאור העבודה..." value={secName} onChange={e=>setSecName(e.target.value)} />
          <div style={s.lbl}>יחידת מידה</div>
          <input style={s.inp} placeholder="קומפ׳ / מ״ר / יחידה..." value={secUnit} onChange={e=>setSecUnit(e.target.value)} />
          <button style={s.save} onClick={addSection} disabled={saving}>{saving?'שומר...':'✓ הוסף סעיף'}</button>
          <button style={s.cancel} onClick={()=>setView('list')}>ביטול</button>
        </div>
      </div>
    </div>
  )

  // מסך הזמנה חדשה
  if (view === 'newOrder') return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={()=>setView('list')}>→</button>
        <div style={s.topInfo}><div style={s.topTitle}>הזמנה חדשה</div></div>
      </div>
      <div style={s.body}>
        <div style={s.formCard}>
          <div style={s.formTitle}>פרטי הספק</div>
          <div style={s.lbl}>שם הספק *</div>
          <input style={s.inp} placeholder="קלימקס בע״מ" value={supplier} onChange={e=>setSupplier(e.target.value)} />
          <div style={s.row2}>
            <div>
              <div style={s.lbl}>מספר הזמנה</div>
              <input style={{...s.inp,marginBottom:0}} placeholder="001" value={orderNum} onChange={e=>setOrderNum(e.target.value)} />
            </div>
            <div>
              <div style={s.lbl}>תאריך</div>
              <input style={{...s.inp,marginBottom:0}} type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} />
            </div>
          </div>
        </div>

        <div style={s.formCard}>
          <div style={s.formTitle}>פריטי ההזמנה</div>
          {orderItems.map((item, i) => (
            <div key={i} style={s.itemBox}>
              {orderItems.length > 1 && (
                <button style={s.removeBtn} onClick={()=>removeOrderItem(i)}>✕</button>
              )}
              <div style={s.lbl}>סעיף</div>
              <select style={s.sel} value={item.section_id} onChange={e=>updateOrderItem(i,'section_id',e.target.value)}>
                <option value="">בחר סעיף...</option>
                {sections.map(sec=>(
                  <option key={sec.id} value={sec.id}>{sec.part_number} — {sec.name?.slice(0,30)}</option>
                ))}
                <option value="__other__">אחר (ללא סעיף)</option>
              </select>
              <div style={s.lbl}>תיאור</div>
              <input style={s.sel} placeholder="תיאור הפריט" value={item.description} onChange={e=>updateOrderItem(i,'description',e.target.value)} />
              <div style={s.row2}>
                <div>
                  <div style={s.lbl}>כמות</div>
                  <input style={{...s.sel,marginBottom:0}} type="number" placeholder="0" value={item.quantity} onChange={e=>updateOrderItem(i,'quantity',e.target.value)} />
                </div>
                <div>
                  <div style={s.lbl}>מחיר יחידה (₪)</div>
                  <input style={{...s.sel,marginBottom:0}} type="number" placeholder="0" value={item.unit_price} onChange={e=>updateOrderItem(i,'unit_price',e.target.value)} />
                </div>
              </div>
              {item.quantity && item.unit_price && (
                <div style={{fontSize:'12px',color:'#2D4A3E',fontWeight:'600',marginTop:'6px',textAlign:'left'}}>
                  סה״כ: ₪{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toLocaleString()}
                </div>
              )}
            </div>
          ))}

          <button style={s.addRowBtn} onClick={addOrderItem}>+ הוסף שורה</button>

          <div style={s.totalRow}>
            <div style={s.totalLblF}>סה״כ הזמנה</div>
            <div style={s.totalValF}>₪{calcTotal().toLocaleString()}</div>
          </div>

          <button style={s.save} onClick={saveOrder} disabled={saving}>{saving?'שומר...':'💾 שמור הזמנה'}</button>
          <button style={s.cancel} onClick={()=>setView('list')}>ביטול</button>
        </div>
      </div>
    </div>
  )

  // מסך ראשי — רשימת הזמנות
  return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={onBack}>→</button>
        <div style={s.topInfo}>
          <div style={s.topTitle}>רכש והזמנות</div>
          <div style={s.topSub}>{project.name}</div>
        </div>
      </div>

      <div style={s.body}>
        {grandTotal > 0 && (
          <div style={s.totalCard}>
            <div>
              <div style={s.totalLbl}>סה״כ כל ההזמנות</div>
              <div style={s.totalVal}>₪{grandTotal.toLocaleString()}</div>
            </div>
            <div style={{fontSize:'32px'}}>📊</div>
          </div>
        )}

        <button style={s.btn1} onClick={()=>setView('newOrder')}>+ הזמנה חדשה</button>
        <button style={s.btn2} onClick={()=>setView('newSection')}>+ הוסף סעיף לרשימה</button>

        {loading ? <div style={s.empty}>טוען...</div>
        : orders.length===0 ? (
          <div style={s.empty}>
            <div style={{fontSize:'36px',marginBottom:'10px'}}>📋</div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#1C2B20',marginBottom:'4px'}}>אין הזמנות עדיין</div>
            <div>לחץ "+ הזמנה חדשה" כדי להתחיל</div>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} style={s.orderCard}>
              <div style={s.orderHdr} onClick={()=>setExpandedOrder(expandedOrder===order.id?null:order.id)}>
                <div>
                  <div style={s.orderSupplier}>{order.supplier}</div>
                  <div style={s.orderMeta}>
                    {order.order_number && `הזמנה מס׳ ${order.order_number} · `}
                    {order.order_date || ''}
                  </div>
                </div>
                <div style={{textAlign:'left'}}>
                  <div style={s.orderTotal}>₪{(order.total_amount||0).toLocaleString()}</div>
                  <div style={{fontSize:'11px',color:'#9B9280'}}>{expandedOrder===order.id?'▲':'▼'}</div>
                </div>
              </div>

              {expandedOrder===order.id && (
                <div style={s.orderItems}>
                  {(order.order_items||[]).map((oi,i)=>(
                    <div key={i} style={{...s.oi, borderBottom: i===order.order_items.length-1?'none':'1px solid #F5F2EC'}}>
                      {oi.section_number && <span style={s.oiSec}>{oi.section_number}</span>}
                      <div style={s.oiDesc}>
                        <div>{oi.description}</div>
                        <div style={{fontSize:'10px',color:'#9B9280'}}>{oi.quantity} {oi.unit} × ₪{(oi.unit_price||0).toLocaleString()}</div>
                      </div>
                      <div style={s.oiPrice}>₪{(oi.total_price||0).toLocaleString()}</div>
                    </div>
                  ))}
                  <div style={s.orderSum}>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'#2D4A3E'}}>סה״כ הזמנה</div>
                    <div style={{fontSize:'15px',fontWeight:'600',color:'#2D4A3E'}}>₪{(order.total_amount||0).toLocaleString()}</div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}