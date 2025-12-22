import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bshucfdcedfxsvavuhdc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzaHVjZmRjZWRmeHN2YXZ1aGRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzODUxOTIsImV4cCI6MjA4MTk2MTE5Mn0.zbSlFr0gWOZ-lfIZMYdvEsnqIm-h7emh7ezXLjWZBtM';

export const supabase = createClient(supabaseUrl, supabaseKey);
