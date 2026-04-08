import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://djlyzojeaasdqijlfsfs.supabase.co'
const SUPABASE_KEY = 'sb_publishable_SeL5pdktXGQHXcs2pp3F-w_ZmjqBBQ4'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
