import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gtbbsaszsiymyjukocxv.supabase.co'; // Lấy ở Project Settings > API
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd0YmJzYXN6c2l5bXlqdWtvY3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTcwMTMsImV4cCI6MjA4NzM3MzAxM30.h7gaxxf48SjN6WgMnsZnzG_FX9dsrXZz1gD3xO3YjrM'; // Lấy ở Project Settings > API

export const supabase = createClient(supabaseUrl, supabaseAnonKey);