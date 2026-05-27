import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  'https://tgxooihbkwzupycodrft.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRneG9vaWhia3d6dXB5Y29kcmZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1NjI0NTUsImV4cCI6MjA5NTEzODQ1NX0.CIBotr7UN7gTTNtTMm_bpNHrg4nx1IqEGYSaFkpgGXY'
)