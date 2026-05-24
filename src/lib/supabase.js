import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://tgxooihbkwzupycodrft.supabase.co'
const SUPABASE_KEY = 'sb_publishable_X422AmEHjv1iz_D-uhcJHQ_J8B81WH0'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)