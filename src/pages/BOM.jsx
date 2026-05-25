import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export default function BOM({ project, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showReceipt, setShowReceipt] = useState(false)
  const [showAddSection, setShowAddSection] = useState(false)

  // טופס קבלה
  const [supplier, setSupplier] = useState('')
  const [amount, setAmount] = useState('')
  const [desc, setDesc] = useState('')
  const [selItem, setSelItem] = useState('')
  const [saving, setSaving] = useState(false)

  // טופס סעיף חדש
  const [secNum, setSecNum] = useState('')
  const [secName, setSecName] = useState('')
  const [secUnit, setSecUnit] = useState('')

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    const { data } = await supabase
      .from('bom_items')
      .select('*')
      .eq('project_id', project.id)
      .order('part_number', { ascending: true })
    setItems(data || [])
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
    setShowAddSection(false)
    await fetchAll()
    setSaving(false)
  }

  const saveReceipt = async () => {
    if (!selItem || !amount) { alert('בחר סעיף והזן סכום'); return }
    setSaving(true)
    const item = items.find(i => i.id === selItem)
    const note = `${supplier} — ${desc} — ₪${amount}`
    await supabase.from('bom_items').update({
      supplier: supplier || item?.supplier,
      notes: ((item?.notes || '') + '\n' + note).trim()
    }).eq('id', selItem)
    setSupplier(''); setAmount(''); setDesc(''); setSelItem('')
    setShowReceipt(false)
    await fetchAll()
    setSaving(false)
  }

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'390px', margin:'0 auto', paddingBottom:'40px' },
    top: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer' },
    topInfo: { flex:1 },
    topTitle: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    topSub: { fontSize:'11px', color:'rgba(255,255,255,0.6)', marginTop:'1px' },
    body: { padding:'14px 16px', display:'flex', flexDirection:'column', gap:'10px' },
    btn1: { width:'100%', padding:'13px', background:'#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    btn2: { width:'100%', padding:'13px', background:'#F4A261', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', overflow:'hidden' },
    row: (last) => ({ padding:'12px 14px', borderBottom: last?'none':'1px solid #F5F2EC' }),
    secNum: { fontSize:'11px', fontWeight:'600', color:'#2D4A3E', background:'#E8F5EF', padding:'3px 8px', borderRadius:'8px', display:'inline-block', marginBottom:'4px' },
    name: { fontSize:'13px', color:'#1C2B20', lineHeight:'1.4' },
    note: { fontSize:'11px', color:'#6B6457', marginTop:'4px', whiteSpace:'pre-line', background:'#F9F7F4', borderRadius:'8px', padding:'6px 8px' },
    empty: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    formCard: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px', marginBottom:'10px' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'13px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    row2: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' },
    save: { width:'100%', padding:'12px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
    cancel: { width:'100%', padding:'11px', background:'#F5F2EC', border:'none', borderRadius:'12px', color:'#6B6457', fontSize:'13px', fontWeight:'500', cursor:'pointer', fontFamily:'Heebo, sans-serif', marginTop:'8px' },
    modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' },
    sheet: { background:'#FAFAF8', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'390px', padding:'16px 16px 32px', maxHeight:'85vh', overflowY:'auto' },
    handle: { width:'40px', height:'4px', background:'#D4CFCA', borderRadius:'2px', margin:'0 auto 14px' },
    stitle: { fontSize:'16px', fontWeight:'600', color:'#1C2B20', marginBottom:'4px' },
    ssub: { fontSize:'12px', color:'#9B9280', marginBottom:'16px' },
  }

  return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={onBack}>→</button>
        <div style={s.topInfo}>
          <div style={s.topTitle}>רכש וחשבוניות</div>
          <div style={s.topSub}>{project.name}</div>
        </div>
      </div>

      <div style={s.body}>

        {/* טופס סעיף חדש */}
        {showAddSection && (
          <div style={s.formCard}>
            <div style={{fontSize:'14px', fontWeight:'600', color:'#1C2B20', marginBottom:'12px'}}>+ סעיף חדש</div>
            <div style={s.row2}>
              <div>
                <div style={s.lbl}>מספר סעיף</div>
                <input style={{...s.inp, marginBottom:0}} placeholder="15.01.0001" value={secNum} onChange={e=>setSecNum(e.target.value)} />
              </div>
              <div>
                <div style={s.lbl}>יחידה</div>
                <input style={{...s.inp, marginBottom:0}} placeholder="קומפ׳/מ״ר" value={secUnit} onChange={e=>setSecUnit(e.target.value)} />
              </div>
            </div>
            <div style={{height:'10px'}}></div>
            <div style={s.lbl}>תיאור הסעיף</div>
            <input style={s.inp} placeholder="תיאור העבודה..." value={secName} onChange={e=>setSecName(e.target.value)} />
            <button style={s.save} onClick={addSection} disabled={saving}>{saving?'שומר...':'✓ הוסף סעיף'}</button>
            <button style={s.cancel} onClick={()=>setShowAddSection(false)}>ביטול</button>
          </div>
        )}

        <button style={s.btn1} onClick={()=>setShowAddSection(!showAddSection)}>
          {showAddSection ? '✕ ביטול' : '+ הוסף סעיף'}
        </button>

        {items.length>0 && (
          <button style={s.btn2} onClick={()=>setShowReceipt(true)}>
            📄 הוסף קבלה / חשבונית
          </button>
        )}

        {loading ? <div style={s.empty}>טוען...</div>
        : items.length===0 ? (
          <div style={s.empty}>
            <div style={{fontSize:'36px',marginBottom:'10px'}}>📋</div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#1C2B20',marginBottom:'4px'}}>אין סעיפים עדיין</div>
            <div>לחץ "+ הוסף סעיף" כדי להתחיל</div>
          </div>
        ) : (
          <div style={s.card}>
            {items.map((item,i)=>(
              <div key={item.id} style={s.row(i===items.length-1)}>
                <span style={s.secNum}>{item.part_number}</span>
                <div style={s.name}>{item.name}</div>
                {item.unit && <div style={{fontSize:'11px',color:'#9B9280',marginTop:'2px'}}>יחידה: {item.unit}</div>}
                {item.notes && (
                  <div style={s.note}>{item.notes}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* מודל הוספת קבלה */}
      {showReceipt && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget){setShowReceipt(false)}}}>
          <div style={s.sheet}>
            <div style={s.handle}></div>
            <div style={s.stitle}>הוספת קבלה / חשבונית</div>
            <div style={s.ssub}>מלא את הפרטים ושייך לסעיף</div>

            <div style={s.lbl}>שייך לסעיף *</div>
            <select style={s.sel} value={selItem} onChange={e=>setSelItem(e.target.value)}>
              <option value="">בחר סעיף...</option>
              {items.map(item=>(
                <option key={item.id} value={item.id}>{item.part_number} — {item.name?.slice(0,40)}</option>
              ))}
            </select>

            <div style={s.lbl}>ספק</div>
            <input style={s.inp} placeholder="שם הספק" value={supplier} onChange={e=>setSupplier(e.target.value)} />

            <div style={s.lbl}>סכום (₪) *</div>
            <input style={s.inp} type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} />

            <div style={s.lbl}>תיאור / הערות</div>
            <input style={s.inp} placeholder="מה נרכש? מה הוזמן?" value={desc} onChange={e=>setDesc(e.target.value)} />

            <button style={s.save} onClick={saveReceipt} disabled={saving}>
              {saving?'שומר...':'💾 שמור קבלה'}
            </button>
            <button style={s.cancel} onClick={()=>setShowReceipt(false)}>ביטול</button>
          </div>
        </div>
      )}
    </div>
  )
}