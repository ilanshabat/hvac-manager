import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import BOMUpload from './BOMUpload'

export default function BOM({ project, onBack }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [showReceipt, setShowReceipt] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [suggestion, setSuggestion] = useState(null)
  const [selItem, setSelItem] = useState('')
  const [amount, setAmount] = useState('')
  const [supplier, setSupplier] = useState('')
  const [desc, setDesc] = useState('')

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

  const analyzeReceipt = async (file) => {
    setAnalyzing(true)
    setSuggestion(null)
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result.split(',')[1])
      r.onerror = rej
      r.readAsDataURL(file)
    })
    const isImg = file.type.startsWith('image/')
    const itemsList = items.map(i => `${i.part_number}: ${i.name}`).join('\n')
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [{ role: 'user', content: [
            { type: isImg ? 'image' : 'document', source: { type: 'base64', media_type: file.type, data: base64 } },
            { type: 'text', text: `קבלה/חשבונית. סעיפי כתב כמויות:\n${itemsList}\n\nJSON בלבד:\n{"supplier":"ספק","amount":0,"description":"תיאור","suggested_section":"סעיף או null","confidence":"high/medium/low"}` }
          ]}]
        })
      })
      const d = await res.json()
      const parsed = JSON.parse(d.content?.[0]?.text?.replace(/```json|```/g,'').trim() || '{}')
      setSuggestion(parsed)
      if (parsed.suggested_section) {
        const found = items.find(i => i.part_number === parsed.suggested_section)
        if (found) setSelItem(found.id)
      }
      setAmount(parsed.amount?.toString() || '')
      setSupplier(parsed.supplier || '')
      setDesc(parsed.description || '')
    } catch { setSuggestion(null) }
    setAnalyzing(false)
  }

  const saveReceipt = async () => {
    if (!selItem) { alert('בחר סעיף'); return }
    const item = items.find(i => i.id === selItem)
    const note = `\n${supplier} — ${desc} — ₪${amount}`
    await supabase.from('bom_items').update({
      supplier,
      notes: ((item?.notes || '') + note).trim()
    }).eq('id', selItem)
    await fetchAll()
    setShowReceipt(false)
    setReceiptFile(null)
    setSuggestion(null)
    setSelItem(''); setAmount(''); setSupplier(''); setDesc('')
  }

  if (showUpload) return (
    <BOMUpload project={project} onBack={()=>setShowUpload(false)} onDone={()=>{ setShowUpload(false); fetchAll() }} />
  )

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
    note: { fontSize:'11px', color:'#6B6457', marginTop:'2px', whiteSpace:'pre-line' },
    empty: { textAlign:'center', padding:'32px 24px', color:'#9B9280' },
    modal: { position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', zIndex:100, display:'flex', alignItems:'flex-end', justifyContent:'center' },
    sheet: { background:'#FAFAF8', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:'390px', padding:'16px 16px 32px', maxHeight:'85vh', overflowY:'auto' },
    handle: { width:'40px', height:'4px', background:'#D4CFCA', borderRadius:'2px', margin:'0 auto 14px' },
    stitle: { fontSize:'16px', fontWeight:'600', color:'#1C2B20', marginBottom:'4px' },
    ssub: { fontSize:'12px', color:'#9B9280', marginBottom:'14px' },
    upArea: { border:'2px dashed #D4CFCA', borderRadius:'14px', padding:'20px', textAlign:'center', cursor:'pointer', background:'#F9F7F4', marginBottom:'12px' },
    sugg: { background:'#E8F5EF', borderRadius:'14px', padding:'12px', marginBottom:'12px', border:'1px solid #B7DCCA' },
    lbl: { fontSize:'12px', fontWeight:'600', color:'#6B6457', marginBottom:'4px' },
    sel: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'13px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    inp: { width:'100%', border:'1.5px solid #E8E4DC', borderRadius:'12px', padding:'10px 14px', fontSize:'14px', color:'#1C2B20', background:'#F9F7F4', fontFamily:'Heebo, sans-serif', boxSizing:'border-box', marginBottom:'10px' },
    save: { width:'100%', padding:'12px', background:'#2D4A3E', border:'none', borderRadius:'12px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor:'pointer', fontFamily:'Heebo, sans-serif' },
  }

  return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={onBack}>→</button>
        <div style={s.topInfo}>
          <div style={s.topTitle}>רכש וכתב כמויות</div>
          <div style={s.topSub}>{project.name}</div>
        </div>
      </div>

      <div style={s.body}>
        <button style={s.btn1} onClick={()=>setShowUpload(true)}>
          📄 {items.length>0?'עדכן כתב כמויות':'העלה כתב כמויות'}
        </button>
        {items.length>0 && (
          <button style={s.btn2} onClick={()=>setShowReceipt(true)}>
            📸 הוסף קבלה / חשבונית
          </button>
        )}

        {loading ? <div style={s.empty}>טוען...</div>
        : items.length===0 ? (
          <div style={s.empty}>
            <div style={{fontSize:'36px',marginBottom:'10px'}}>📋</div>
            <div style={{fontSize:'14px',fontWeight:'600',color:'#1C2B20',marginBottom:'4px'}}>אין כתב כמויות עדיין</div>
            <div>לחץ למעלה להעלאת כתב כמויות</div>
          </div>
        ) : (
          <div style={s.card}>
            {items.map((item,i)=>(
              <div key={item.id} style={s.row(i===items.length-1)}>
                <span style={s.secNum}>{item.part_number}</span>
                <div style={s.name}>{item.name}</div>
                {item.notes && item.notes!==item.part_number && (
                  <div style={s.note}>{item.notes.replace(item.part_number,'').trim()}</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showReceipt && (
        <div style={s.modal} onClick={e=>{if(e.target===e.currentTarget){setShowReceipt(false);setReceiptFile(null);setSuggestion(null)}}}>
          <div style={s.sheet}>
            <div style={s.handle}></div>
            <div style={s.stitle}>הוספת קבלה / חשבונית</div>
            <div style={s.ssub}>העלה תמונה או PDF — AI ישייך לסעיף הנכון</div>

            <label style={s.upArea}>
              <input type="file" accept=".pdf,image/*" style={{display:'none'}} onChange={e=>{
                const f=e.target.files[0]
                if(f){setReceiptFile(f);analyzeReceipt(f)}
              }}/>
              <div style={{fontSize:'28px',marginBottom:'6px'}}>📸</div>
              <div style={{fontSize:'13px',color:'#9B9280'}}>
                {receiptFile?`✅ ${receiptFile.name}`:'לחץ לבחירת תמונה או PDF'}
              </div>
            </label>

            {analyzing && <div style={{textAlign:'center',color:'#2D4A3E',fontSize:'13px',marginBottom:'12px'}}>⏳ מנתח קבלה...</div>}

            {suggestion && (
              <div style={s.sugg}>
                <div style={{fontSize:'13px',fontWeight:'600',color:'#2D4A3E',marginBottom:'6px'}}>💡 הצעת AI</div>
                {suggestion.supplier && <div style={{fontSize:'12px',color:'#1C2B20',marginBottom:'3px'}}>🏪 ספק: <strong>{suggestion.supplier}</strong></div>}
                {suggestion.amount && <div style={{fontSize:'12px',color:'#1C2B20',marginBottom:'3px'}}>💰 סכום: <strong>₪{Number(suggestion.amount).toLocaleString()}</strong></div>}
                {suggestion.description && <div style={{fontSize:'12px',color:'#1C2B20'}}>📝 {suggestion.description}</div>}
              </div>
            )}

            <div style={s.lbl}>שייך לסעיף</div>
            <select style={s.sel} value={selItem} onChange={e=>setSelItem(e.target.value)}>
              <option value="">בחר סעיף...</option>
              {items.map(item=>(
                <option key={item.id} value={item.id}>{item.part_number} — {item.name?.slice(0,40)}</option>
              ))}
            </select>

            <div style={s.lbl}>ספק</div>
            <input style={s.inp} placeholder="שם הספק" value={supplier} onChange={e=>setSupplier(e.target.value)} />

            <div style={s.lbl}>סכום (₪)</div>
            <input style={s.inp} type="number" placeholder="0" value={amount} onChange={e=>setAmount(e.target.value)} />

            <div style={s.lbl}>תיאור</div>
            <input style={s.inp} placeholder="מה נרכש?" value={desc} onChange={e=>setDesc(e.target.value)} />

            <button style={s.save} onClick={saveReceipt}>💾 שמור קבלה</button>
          </div>
        </div>
      )}
    </div>
  )
}