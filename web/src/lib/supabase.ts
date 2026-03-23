import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://cinbaxumdougfpxpdgtu.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNpbmJheHVtZG91Z2ZweHBkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyNTY4NTYsImV4cCI6MjA4OTgzMjg1Nn0.o8M92bZsaOUTplxym-fW8sCgnGx3foeUJcN55zArMe0';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
