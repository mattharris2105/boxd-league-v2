import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yxluqkfanhzktinayvex.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4bHVxa2Zhbmh6a3RpbmF5dmV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQxNzcwMjYsImV4cCI6MjA4OTc1MzAyNn0.P7I1JeM8OuBFe4d08uirm1ZiUTSGjz-U_TzTUqdoqpQ'

export const supabase = createClient(supabaseUrl, supabaseKey)
