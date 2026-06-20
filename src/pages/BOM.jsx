import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BOM({ project, onBack }) {
  const [orders, setOrders] = useState([])
  const [sections, setSections] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('list')
  const [expandedOrder, setExpandedOrder] = useState(null)
  const [supplier, setSupplier] = useState('')
  const [orderNum, setOrderNum] = useState('')
  const [orderDate, setOrderDate] = useState('')
  const [receiptFile, setReceiptFile] = useState(null)
  const [orderItems, setOrderItems] = useState([{ section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])
  const [saving, setSaving] = useState(false)
  const [secNum, setSecNum] = useState('')
  const [secName, setSecName] = useState('')
  const [secUnit, setSecUnit] = useState('')
  const [editingOrder, setEditingOrder] = useState(null)
  const [editSupplier, setEditSupplier] = useState('')
  const [editOrderNum, setEditOrderNum] = useState('')
  const [editOrderDate, setEditOrderDate] = useState('')
  const [editItems, setEditItems] = useState([])

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const [{ data: o }, { data: s }] = await Promise.all([
      supabase.from('orders').select('*, order_items(*)').eq('project_id', project.id).order('created_at', { ascending: false }),
      supabase.from('bom_items').select('*').eq('project_id', project.id).eq('is_active', true).order('part_number')
    ])
    setOrders(o || [])
    setSections(s || [])
    setLoading(false)
  }

  const addSection = async () => {
    if (!secName.trim()) return
    setSaving(true)
    await supabase.from('bom_items').insert([{ project_id:project.id, name:secName, part_number:secNum||'-', unit:secUnit, status:'pending', is_critical:false, is_active:true }])
    setSecNum(''); setSecName(''); setSecUnit('')
    setView('list')
    await fetchAll()
    setSaving(false)
  }

  const deleteSection = async (id) => {
    if (!window.confirm('למחוק את הסעיף?')) return
    await supabase.from('bom_items').update({ is_active: false }).eq('id', id)
    await fetchAll()
  }

  const addOrderItem = () => setOrderItems([...orderItems, { section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])

  const updateOrderItem = (i, field, val) => {
    const u = [...orderItems]
    u[i] = { ...u[i], [field]: val }
    if (field === 'section_id' && val) {
      const sec = sections.find(s => s.id === val)
      if (sec) { u[i].description = sec.name; u[i].unit = sec.unit || '' }
    }
    setOrderItems(u)
  }

  const calcTotal = () => orderItems.reduce((sum, i) => sum + (parseFloat(i.quantity)||0)*(parseFloat(i.unit_price)||0), 0)

  const saveOrder = async () => {
    if (!supplier.trim()) { alert('הזן שם ספק'); return }
    setSaving(true)
    let receiptUrl = null
    if (receiptFile) {
      const fn = `${project.id}/${Date.now()}_${receiptFile.name}`
      await supabase.storage.from('receipts').upload(fn, receiptFile)
      const { data: ud } = supabase.storage.from('receipts').getPublicUrl(fn)
      receiptUrl = ud?.publicUrl
    }
    const { data: order } = await supabase.from('orders').insert([{
      project_id:project.id, supplier, order_number:orderNum, order_date:orderDate||null, total_amount:calcTotal(), receipt_url:receiptUrl
    }]).select().single()
    if (order) {
      const rows = orderItems.filter(i=>i.description||i.quantity).map(item => {
        const sec = sections.find(s=>s.id===item.section_id)
        return { order_id:order.id, bom_item_id:item.section_id||null, section_number:sec?.part_number||'', description:item.description, unit:item.unit, quantity:parseFloat(item.quantity)||0, unit_price:parseFloat(item.unit_price)||0, total_price:(parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0) }
      })
      if (rows.length>0) await supabase.from('order_items').insert(rows)
    }
    setSupplier(''); setOrderNum(''); setOrderDate(''); setReceiptFile(null)
    setOrderItems([{ section_id:'', description:'', unit:'', quantity:'', unit_price:'' }])
    setView('list')
    await fetchAll()
    setSaving(false)
  }

  const startEdit = (order) => {
    setEditingOrder(order.id)
    setEditSupplier(order.supplier || '')
    setEditOrderNum(order.order_number || '')
    setEditOrderDate(order.order_date || '')
    setEditItems((order.order_items || []).map(i => ({ ...i })))
  }

  const updateEditItem = (i, field, val) => {
    const u = [...editItems]
    u[i] = { ...u[i], [field]: val }
    setEditItems(u)
  }

  const addEditItem = () => {
    setEditItems([...editItems, { id:null, section_number:'', description:'', unit:'', quantity:'', unit_price:'', total_price:0 }])
  }

  const removeEditItem = async (item, i) => {
    if (item.id) {
      await supabase.from('order_items').delete().eq('id', item.id)
    }
    setEditItems(editItems.filter((_, j) => j !== i))
  }

  const calcEditTotal = () => editItems.reduce((sum, i) => sum + (parseFloat(i.quantity)||0)*(parseFloat(i.unit_price)||0), 0)

  const saveEdit = async (order) => {
    setSaving(true)
    const newTotal = calcEditTotal()

    await supabase.from('orders').update({
      supplier: editSupplier,
      order_number: editOrderNum,
      order_date: editOrderDate || null,
      total_amount: newTotal
    }).eq('id', order.id)

    for (const item of editItems) {
      const total = (parseFloat(item.quantity)||0) * (parseFloat(item.unit_price)||0)
      if (item.id) {
        await supabase.from('order_items').update({
          description: item.description,
          unit: item.unit,
          quantity: parseFloat(item.quantity)||0,
          unit_price: parseFloat(item.unit_price)||0,
          total_price: total
        }).eq('id', item.id)
      } else if (item.description || item.quantity) {
        await supabase.from('order_items').insert([{
          order_id: order.id,
          description: item.description,
          unit: item.unit,
          section_number: item.section_number || '',
          quantity: parseFloat(item.quantity)||0,
          unit_price: parseFloat(item.unit_price)||0,
          total_price: total
        }])
      }
    }

    setEditingOrder(null)
    await fetchAll()
    setSaving(false)
  }

  const deleteOrder = async (order) => {
    if (!window.confirm(`למחוק את ההזמנה מ-${order.supplier}?`)) return
    await supabase.from('order_items').delete().eq('order_id', order.id)
    await supabase.from('orders').delete().eq('id', order.id)
    setExpandedOrder(null)
    await fetchAll()
  }

  const grandTotal = orders.reduce((sum, o) => sum + (o.total_amount||0), 0)

  const c = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'100%', margin:'0 auto', paddingBottom:'40px' },
    top: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer' },
    ti: { flex:1 },
    tt: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    ts: { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' },
    body: { padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' },
    totCard: { background:'#2D4A3E', borderRadius:'18px', padding:'16px', display:'flex', alignItems:'center', justifyContent:'space-between' },
    btn1: { width:'100%', padding:'13px', background:'#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    btn2: { width:'100%', padding:'12px', background:'#F5F2EC', border:'1.5px solid #E8E4DC', borderRadius:'14px', color:'#6B6457', fontSize:'13px', fontWeight:'500', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    oCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden', marginBottom:'10px' },
    oHdr: { padding:'14px', display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' },
    oi: (l) => ({ padding:'10px 14px', borderBottom:l?'none':'1px solid #F5F2EC', display:'flex', alignItems:'center', gap:'8px' }),
    oiSec: { fontSize:'10px', fontWeight:'600', color:'#2D4A3E', background:'#E8F5EF', padding:'2px 7px', borderRadius:'6px', whiteSpace:'nowrap', flexShrink:0 },
    oiDesc: { flex:1, fontSize:'12px', color:'#1C2B20' },
    oiPrice: { fontSize:'12px', fontWeight:'600', color:'#1C2B20', whiteSpace:'nowrap' },
    oSum: { padding:'10px 14px', background:'#F9F7F4', display:'flex', justifyContent:'space-between' },
    rLink: { padding:'8px 14px', display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#2D4A3E', background:'#E8F5EF', textDecoration:'none' },
    oActions: { padding:'10px 14px', display:'flex', gap:'8px', borderTop:'1px solid #F5F2EC' },
    oEditBtn: { flex:1, padding:'8px', background:'#EEF2FF', border:'1px solid #C7D2FE', borderRadius:'10px', fontSize:'12px', fontWeight:'500', color:'#4338CA', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    oDelBtn: { flex:1, padding:'8px', background:'#FDF0ED', border:'1px solid #FECACA', borderRadius:'10px', fontSize:'12px', fontWeight:'500', color:'#C0392B', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    editBox: { padding:'12px 14px', background:'#F9F7F4', borderTop:'1px solid #E8E4DC' },
    iBox: { background:'#fff', borderRadius:'12px', padding:'10px', border:'1px solid #E8E4DC', marginBottom:'8px', position:'relative' },
    rmBtn: { position:'absolute', top:'6px', left:'6px', background:'#FDF0ED', border:'none', borderRadius:'6px', padding:'2px 7px', fontSize:'11px', color:'#C0392B', cursor:'pointer' },
    empty: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    fCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px' },
    fTitle: { fontSize:'15px', fontWeight:'600', color:'#1C2B20', marginBottom:'14px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    inpSm: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'10px', padding:'7px 10px', fontSize:'12px', color:'#1C2B20', background:'#fff', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'6px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'13px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'8px' },
    r2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' },
    upArea: { border:'2px dashed #D4CFCA', borderRadius:'12px', padding:'14px', textAlign:'center', cursor:'pointer', background:'#F9F7F4', marginBottom:'10px' },
    newIBox: { background:'#F9F7F4', borderRadius:'12px', padding:'12px', border:'1px solid #E8E4DC', marginBottom:'10px', position:'relative' },
    addRow: { width:'100%', padding:'10px', background:'#F5F2EC', border:'1.5px dashed #D4CFCA', borderRadius:'12px', fontSize:'13px', color:'#9B9280', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'10px' },
    totRow: { background:'#E8F5EF', borderRadius:'12px', padding:'12px 14px', display:'flex', justifyContent:'space-between', marginBottom:'12px' },
    save: { width:'100%', padding:'12px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginBottom:'8px' },
    cancel: { width:'100%', padding:'11px', background:'#F5F2EC', border:'none', borderRadius:'12px', color:'#6B6457', fontSize:'13px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    secRow: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px' },
    secDel: { background:'#FDF0ED', border:'none', borderRadius:'8px', padding:'4px 10px', fontSize:'11px', color:'#C0392B', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    saveSmBtn: { padding:'8px 16px', background:'#2D4A3E', border:'none', borderRadius:'10px', color:'#fff', fontSize:'12px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    cancelSmBtn: { padding:'8px 16px', background:'#F5F2EC', border:'none', borderRadius:'10px', color:'#6B6457', fontSize:'12px', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
  }

  if (view==='newSection') return (
    <div style={c.app}>
      <div style={c.top}><button style={c.back} onClick={()=>setView('list')}>→</button><div style={c.ti}><div style={c.tt}>סעיף חדש</div></div></div>
      <div style={c.body}>
        <div style={c.fCard}>
          <div style={c.lbl}>מספר סעיף</div>
          <input style={c.inp} placeholder="15.01.0001" value={secNum} onChange={e=>setSecNum(e.target.value)} />
          <div style={c.lbl}>תיאור הסעיף *</div>
          <input style={c.inp} placeholder="תיאור העבודה..." value={secName} onChange={e=>setSecName(e.target.value)} />
          <div style={c.lbl}>יחידת מידה</div>
          <input style={c.inp} placeholder="קומפ׳ / מ״ר / יחידה..." value={secUnit} onChange={e=>setSecUnit(e.target.value)} />
          <button style={c.save} onClick={addSection} disabled={saving}>{saving?'שומר...':'✓ הוסף סעיף'}</button>
          <button style={c.cancel} onClick={()=>setView('list')}>ביטול</button>
        </div>
      </div>
    </div>
  )

  if (view==='manageSections') return (
    <div style={c.app}>
      <div style={c.top}><button style={c.back} onClick={()=>setView('list')}>→</button><div style={c.ti}><div style={c.tt}>ניהול סעיפים</div></div></div>
      <div style={c.body}>
        {sections.length === 0 ? (
          <div style={c.empty}>אין סעיפים עדיין</div>
        ) : (
          <div style={c.fCard}>
            {sections.map((sec, i) => (
              <div key={sec.id} style={{...c.secRow, borderBottom: i===sections.length-1?'none':'1px solid #F5F2EC'}}>
                <div>
                  <div style={{fontSize:'13px', fontWeight:'600', color:'#1C2B20'}}>{sec.name}</div>
                  <div style={{fontSize:'11px', color:'#9B9280'}}>{sec.part_number} {sec.unit && `· ${sec.unit}`}</div>
                </div>
                <button style={c.secDel} onClick={()=>deleteSection(sec.id)}>🗑 מחק</button>
              </div>
            ))}
          </div>
        )}
        <button style={c.btn1} onClick={()=>setView('newSection')}>+ הוסף סעיף חדש</button>
      </div>
    </div>
  )

  if (view==='newOrder') return (
    <div style={c.app}>
      <div style={c.top}><button style={c.back} onClick={()=>setView('list')}>→</button><div style={c.ti}><div style={c.tt}>הזמנה / קבלה חדשה</div></div></div>
      <div style={c.body}>
        <div style={c.fCard}>
          <div style={c.fTitle}>פרטי הספק</div>
          <div style={c.lbl}>שם הספק *</div>
          <input style={c.inp} placeholder="קלימקס בע״מ" value={supplier} onChange={e=>setSupplier(e.target.value)} />
          <div style={c.r2}>
            <div><div style={c.lbl}>מספר קבלה</div><input style={{...c.inp,marginBottom:0}} placeholder="001" value={orderNum} onChange={e=>setOrderNum(e.target.value)} /></div>
            <div><div style={c.lbl}>תאריך</div><input style={{...c.inp,marginBottom:0}} type="date" value={orderDate} onChange={e=>setOrderDate(e.target.value)} /></div>
          </div>
          <div style={{height:'10px'}}></div>
          <div style={c.lbl}>📎 העלה קבלה (אופציונלי)</div>
          <label style={c.upArea}>
            <input type="file" accept="image/*,.pdf" style={{display:'none'}} onChange={e=>setReceiptFile(e.target.files[0])} />
            <div style={{fontSize:'24px',marginBottom:'4px'}}>📄</div>
            <div style={{fontSize:'13px',color:receiptFile?'#2D4A3E':'#9B9280',fontWeight:receiptFile?'600':'400'}}>
              {receiptFile?`✅ ${receiptFile.name}`:'לחץ לבחירת קובץ'}
            </div>
          </label>
        </div>
        <div style={c.fCard}>
          <div style={c.fTitle}>פריטי ההזמנה</div>
          {orderItems.map((item,i)=>(
            <div key={i} style={c.newIBox}>
              {orderItems.length>1 && <button style={c.rmBtn} onClick={()=>setOrderItems(orderItems.filter((_,j)=>j!==i))}>✕</button>}
              <div style={{height:orderItems.length>1?'20px':'0'}}></div>
              <div style={c.lbl}>סעיף</div>
              <select style={c.sel} value={item.section_id} onChange={e=>updateOrderItem(i,'section_id',e.target.value)}>
                <option value="">ללא סעיף</option>
                {sections.map(sec=><option key={sec.id} value={sec.id}>{sec.part_number} — {sec.name?.slice(0,30)}</option>)}
              </select>
              <div style={c.lbl}>תיאור המוצר</div>
              <input style={c.sel} placeholder="מה הוזמן?" value={item.description} onChange={e=>updateOrderItem(i,'description',e.target.value)} />
              <div style={c.r2}>
                <div><div style={c.lbl}>כמות</div><input style={{...c.sel,marginBottom:0}} type="number" placeholder="0" value={item.quantity} onChange={e=>updateOrderItem(i,'quantity',e.target.value)} /></div>
                <div><div style={c.lbl}>מחיר יחידה (₪)</div><input style={{...c.sel,marginBottom:0}} type="number" placeholder="0" value={item.unit_price} onChange={e=>updateOrderItem(i,'unit_price',e.target.value)} /></div>
              </div>
              {item.quantity&&item.unit_price&&<div style={{fontSize:'12px',color:'#2D4A3E',fontWeight:'600',marginTop:'6px',textAlign:'left'}}>סה״כ: ₪{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toLocaleString()}</div>}
            </div>
          ))}
          <button style={c.addRow} onClick={addOrderItem}>+ הוסף מוצר נוסף</button>
          <div style={c.totRow}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#2D4A3E'}}>סה״כ הזמנה</div>
            <div style={{fontSize:'18px',fontWeight:'600',color:'#2D4A3E'}}>₪{calcTotal().toLocaleString()}</div>
          </div>
          <button style={c.save} onClick={saveOrder} disabled={saving}>{saving?'שומר...':'💾 שמור הזמנה'}</button>
          <button style={c.cancel} onClick={()=>setView('list')}>ביטול</button>
        </div>
      </div>
    </div>
  )

  return (
    <div style={c.app}>
      <div style={c.top}>
        <button style={c.back} onClick={onBack}>→</button>
        <div style={c.ti}><div style={c.tt}>רכש והזמנות</div><div style={c.ts}>{project.name}</div></div>
      </div>
      <div style={c.body}>
        {grandTotal>0 && (
          <div style={c.totCard}>
            <div><div style={{fontSize:'13px',color:'rgba(255,255,255,0.75)'}}>סה״כ כל ההזמנות</div><div style={{fontSize:'22px',fontWeight:'600',color:'#fff'}}>₪{grandTotal.toLocaleString()}</div></div>
            <div style={{fontSize:'32px'}}>📊</div>
          </div>
        )}
        <button style={c.btn1} onClick={()=>setView('newOrder')}>+ הזמנה / קבלה חדשה</button>
        <button style={c.btn2} onClick={()=>setView('manageSections')}>⚙️ ניהול סעיפים ({sections.length})</button>

        {loading ? <div style={c.empty}>טוען...</div>
        : orders.length===0 ? (
          <div style={c.empty}><div style={{fontSize:'36px',marginBottom:'10px'}}>📋</div><div style={{fontSize:'14px',fontWeight:'600',color:'#1C2B20',marginBottom:'4px'}}>אין הזמנות עדיין</div><div>לחץ "+ הזמנה חדשה"</div></div>
        ) : orders.map(order=>(
          <div key={order.id} style={c.oCard}>
            <div style={c.oHdr} onClick={()=>{ setExpandedOrder(expandedOrder===order.id?null:order.id); setEditingOrder(null) }}>
              <div>
                <div style={{fontSize:'15px',fontWeight:'600',color:'#1C2B20'}}>{order.supplier}</div>
                <div style={{fontSize:'12px',color:'#9B9280',marginTop:'2px'}}>{order.order_number&&`קבלה מס׳ ${order.order_number} · `}{order.order_date||''}</div>
              </div>
              <div style={{textAlign:'left'}}>
                <div style={{fontSize:'16px',fontWeight:'600',color:'#2D4A3E'}}>₪{(order.total_amount||0).toLocaleString()}</div>
                <div style={{fontSize:'11px',color:'#9B9280'}}>{expandedOrder===order.id?'▲':'▼'}</div>
              </div>
            </div>

            {expandedOrder===order.id && <>
              {editingOrder===order.id ? (
                <div style={c.editBox}>
                  <div style={{fontSize:'13px',fontWeight:'600',color:'#2D4A3E',marginBottom:'10px'}}>✏️ עריכת הזמנה</div>

                  <div style={c.lbl}>שם ספק</div>
                  <input style={c.inpSm} value={editSupplier} onChange={e=>setEditSupplier(e.target.value)} />

                  <div style={c.r2}>
                    <div>
                      <div style={c.lbl}>מספר קבלה</div>
                      <input style={{...c.inpSm,marginBottom:0}} value={editOrderNum} onChange={e=>setEditOrderNum(e.target.value)} />
                    </div>
                    <div>
                      <div style={c.lbl}>תאריך</div>
                      <input style={{...c.inpSm,marginBottom:0}} type="date" value={editOrderDate} onChange={e=>setEditOrderDate(e.target.value)} />
                    </div>
                  </div>

                  <div style={{fontSize:'12px',fontWeight:'600',color:'#2D4A3E',margin:'12px 0 8px'}}>פריטים</div>
                  {editItems.map((item, i) => (
                    <div key={i} style={{...c.iBox, marginBottom:'8px'}}>
                      <button style={c.rmBtn} onClick={()=>removeEditItem(item, i)}>✕</button>
                      <div style={{height:'20px'}}></div>
                      <div style={c.lbl}>תיאור</div>
                      <input style={c.inpSm} value={item.description} onChange={e=>updateEditItem(i,'description',e.target.value)} />
                      <div style={c.r2}>
                        <div>
                          <div style={c.lbl}>כמות</div>
                          <input style={{...c.inpSm,marginBottom:0}} type="number" value={item.quantity} onChange={e=>updateEditItem(i,'quantity',e.target.value)} />
                        </div>
                        <div>
                          <div style={c.lbl}>מחיר יחידה (₪)</div>
                          <input style={{...c.inpSm,marginBottom:0}} type="number" value={item.unit_price} onChange={e=>updateEditItem(i,'unit_price',e.target.value)} />
                        </div>
                      </div>
                      {item.quantity&&item.unit_price&&<div style={{fontSize:'11px',color:'#2D4A3E',fontWeight:'600',marginTop:'4px',textAlign:'left'}}>סה״כ: ₪{((parseFloat(item.quantity)||0)*(parseFloat(item.unit_price)||0)).toLocaleString()}</div>}
                    </div>
                  ))}

                  <button style={{...c.addRow, marginBottom:'8px'}} onClick={addEditItem}>+ הוסף פריט</button>

                  <div style={{background:'#E8F5EF', borderRadius:'10px', padding:'8px 12px', display:'flex', justifyContent:'space-between', marginBottom:'10px'}}>
                    <div style={{fontSize:'12px',fontWeight:'600',color:'#2D4A3E'}}>סה״כ</div>
                    <div style={{fontSize:'14px',fontWeight:'600',color:'#2D4A3E'}}>₪{calcEditTotal().toLocaleString()}</div>
                  </div>

                  <div style={{display:'flex', gap:'8px'}}>
                    <button style={c.saveSmBtn} onClick={()=>saveEdit(order)} disabled={saving}>{saving?'שומר...':'✓ שמור'}</button>
                    <button style={c.cancelSmBtn} onClick={()=>setEditingOrder(null)}>ביטול</button>
                  </div>
                </div>
              ) : (
                <>
                  {(order.order_items||[]).map((oi,i)=>(
                    <div key={i} style={c.oi(i===order.order_items.length-1)}>
                      {oi.section_number&&<span style={c.oiSec}>{oi.section_number}</span>}
                      <div style={c.oiDesc}>
                        <div>{oi.description}</div>
                        <div style={{fontSize:'10px',color:'#9B9280'}}>{oi.quantity} {oi.unit} × ₪{(oi.unit_price||0).toLocaleString()}</div>
                      </div>
                      <div style={c.oiPrice}>₪{(oi.total_price||0).toLocaleString()}</div>
                    </div>
                  ))}
                  <div style={c.oSum}>
                    <div style={{fontSize:'13px',fontWeight:'600',color:'#2D4A3E'}}>סה״כ</div>
                    <div style={{fontSize:'15px',fontWeight:'600',color:'#2D4A3E'}}>₪{(order.total_amount||0).toLocaleString()}</div>
                  </div>
                  {order.receipt_url&&<a href={order.receipt_url} target="_blank" rel="noreferrer" style={c.rLink}>📄 צפה בקבלה המקורית</a>}
                  <div style={c.oActions}>
                    <button style={c.oEditBtn} onClick={()=>startEdit(order)}>✏️ ערוך הזמנה</button>
                    <button style={c.oDelBtn} onClick={()=>deleteOrder(order)}>🗑 מחק הזמנה</button>
                  </div>
                </>
              )}
            </>}
          </div>
        ))}
      </div>
    </div>
  )
}
