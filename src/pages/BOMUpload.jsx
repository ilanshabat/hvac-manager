import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function BOMUpload({ project, onBack, onDone }) {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [items, setItems] = useState([])
  const [error, setError] = useState('')

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f && f.type === 'application/pdf') {
      setFile(f)
      setError('')
    } else {
      setError('נא להעלות קובץ PDF בלבד')
    }
  }

  const extractItems = async () => {
    if (!file) return
    setLoading(true)
    setProgress('קורא את כתב הכמויות...')
    setError('')

    try {
      // המר PDF ל-base64
      const base64 = await new Promise((res, rej) => {
        const r = new FileReader()
        r.onload = () => res(r.result.split(',')[1])
        r.onerror = rej
        r.readAsDataURL(file)
      })

      setProgress('מנתח סעיפים עם AI...')

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'document',
                source: { type: 'base64', media_type: 'application/pdf', data: base64 }
              },
              {
                type: 'text',
                text: `זהו כתב כמויות לפרויקט בנייה/מיזוג אוויר.
חלץ את כל הסעיפים ותחזיר JSON בלבד, ללא טקסט נוסף, בפורמט הבא:
{
  "items": [
    {
      "section": "מספר הסעיף (למשל 15.01.0001)",
      "description": "תיאור קצר של הסעיף (עד 100 תווים)",
      "unit": "יחידת מידה (קומפ/מ\"ר/מ\"א/יחידה וכו')",
      "quantity": מספר או null,
      "unit_price": מספר או null
    }
  ]
}
חלץ רק שורות עם מספר סעיף ברור. אל תכלול כותרות ראשיות.`
              }
            ]
          }]
        })
      })

      const data = await response.json()
      const text = data.content?.[0]?.text || ''
      const clean = text.replace(/```json|```/g, '').trim()
      const parsed = JSON.parse(clean)

      setItems(parsed.items || [])
      setProgress(`נמצאו ${parsed.items?.length || 0} סעיפים`)
    } catch (err) {
      setError('שגיאה בקריאת הקובץ — נסה שוב')
      setProgress('')
    }
    setLoading(false)
  }

  const saveItems = async () => {
    if (items.length === 0) return
    setLoading(true)
    setProgress('שומר סעיפים...')

    const rows = items.map(item => ({
      project_id: project.id,
      name: item.description,
      part_number: item.section,
      unit: item.unit,
      quantity: item.quantity,
      status: 'pending',
      is_critical: false,
      notes: item.section
    }))

    const { error } = await supabase.from('bom_items').insert(rows)

    if (error) {
      setError('שגיאה בשמירה: ' + error.message)
    } else {
      onDone()
    }
    setLoading(false)
  }

  const s = {
    app: { minHeight:'100vh', background:'#F2EFE9', fontFamily:'Heebo, sans-serif', direction:'rtl', maxWidth:'100%', margin:'0 auto', paddingBottom:'40px' },
    top: { background:'#2D4A3E', padding:'14px 16px', display:'flex', alignItems:'center', gap:'10px' },
    back: { width:'34px', height:'34px', borderRadius:'10px', background:'rgba(255,255,255,0.15)', border:'none', fontSize:'18px', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' },
    title: { fontSize:'15px', fontWeight:'600', color:'#fff' },
    body: { padding:'16px', display:'flex', flexDirection:'column', gap:'12px' },
    card: { background:'#fff', borderRadius:'18px', border:'1px solid #E8E4DC', padding:'16px' },
    lbl: { fontSize:'13px', fontWeight:'600', color:'#1C2B20', marginBottom:'8px' },
    hint: { fontSize:'12px', color:'#9B9280', marginBottom:'12px' },
    uploadArea: { border:'2px dashed #D4CFCA', borderRadius:'14px', padding:'28px', textAlign:'center', cursor:'pointer', background:'#F9F7F4' },
    uploadIcon: { fontSize:'36px', marginBottom:'8px' },
    uploadText: { fontSize:'13px', color:'#9B9280' },
    fileName: { fontSize:'13px', fontWeight:'600', color:'#2D4A3E', marginTop:'8px' },
    btn: (disabled) => ({ width:'100%', padding:'13px', background: disabled ? '#9B9280' : '#2D4A3E', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor: disabled ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif', marginTop:'8px' }),
    progress: { fontSize:'13px', color:'#2D4A3E', textAlign:'center', padding:'8px', background:'#E8F5EF', borderRadius:'10px' },
    err: { fontSize:'13px', color:'#C0392B', textAlign:'center', padding:'8px', background:'#FDF0ED', borderRadius:'10px' },
    itemRow: { padding:'10px 0', borderBottom:'1px solid #F5F2EC', display:'flex', alignItems:'flex-start', gap:'8px' },
    sectionNum: { fontSize:'11px', fontWeight:'600', color:'#2D4A3E', background:'#E8F5EF', padding:'3px 8px', borderRadius:'8px', whiteSpace:'nowrap', flexShrink:0 },
    itemDesc: { fontSize:'13px', color:'#1C2B20', flex:1, lineHeight:'1.4' },
    itemMeta: { fontSize:'11px', color:'#9B9280', marginTop:'2px' },
    saveBtn: (disabled) => ({ width:'100%', padding:'13px', background: disabled ? '#9B9280' : '#F4A261', border:'none', borderRadius:'14px', color:'#fff', fontSize:'14px', fontWeight:'600', cursor: disabled ? 'default' : 'pointer', fontFamily:'Heebo, sans-serif', marginTop:'4px' }),
  }

  return (
    <div style={s.app}>
      <div style={s.top}>
        <button style={s.back} onClick={onBack}>→</button>
        <div style={s.title}>העלאת כתב כמויות</div>
      </div>

      <div style={s.body}>
        <div style={s.card}>
          <div style={s.lbl}>📄 כתב כמויות — {project.name}</div>
          <div style={s.hint}>העלה PDF של כתב הכמויות — AI יחלץ את כל הסעיפים אוטומטית</div>

          <label style={s.uploadArea}>
            <input type="file" accept=".pdf" onChange={handleFile} style={{display:'none'}} />
            <div style={s.uploadIcon}>📎</div>
            <div style={s.uploadText}>לחץ לבחירת קובץ PDF</div>
            {file && <div style={s.fileName}>✅ {file.name}</div>}
          </label>

          {file && !items.length && (
            <button style={s.btn(loading)} onClick={extractItems} disabled={loading}>
              {loading ? '⏳ ' + progress : '🤖 חלץ סעיפים עם AI'}
            </button>
          )}

          {progress && !error && <div style={s.progress}>{progress}</div>}
          {error && <div style={s.err}>{error}</div>}
        </div>

        {items.length > 0 && (
          <div style={s.card}>
            <div style={s.lbl}>✅ נמצאו {items.length} סעיפים</div>
            <div style={{maxHeight:'300px', overflowY:'auto'}}>
              {items.map((item, i) => (
                <div key={i} style={s.itemRow}>
                  <span style={s.sectionNum}>{item.section}</span>
                  <div style={{flex:1}}>
                    <div style={s.itemDesc}>{item.description}</div>
                    <div style={s.itemMeta}>
                      {item.unit && `יחידה: ${item.unit}`}
                      {item.quantity && ` · כמות: ${item.quantity}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button style={s.saveBtn(loading)} onClick={saveItems} disabled={loading}>
              {loading ? 'שומר...' : `💾 שמור ${items.length} סעיפים לפרויקט`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
