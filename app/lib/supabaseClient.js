import { createClient } from '@supabase/supabase-js'
const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://refwvdyksbovxwmmwuwk.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlZnd2ZHlrc2Jvdnh3bW13dXdrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0OTAxMTksImV4cCI6MjA5NDA2NjExOX0._69wW79nZhTucfCnyHvkvijs5-MHwDfHEQoXmmZrsPI'
export const supabase = createClient(url,key)
