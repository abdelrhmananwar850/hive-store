import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nfeljxlqtuvihbymnwth.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5mZWxqeGxxdHV2aWhieW1ud3RoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3ODA5NzMsImV4cCI6MjA4MTM1Njk3M30.Mi0sEVbz_0ZdlXpqLXmhn7KO0mSrVuYrTEX_FgV2BCU';

export const supabase = createClient(supabaseUrl, supabaseKey);
