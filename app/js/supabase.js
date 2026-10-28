// js/supabase.js

const SUPABASE_URL = "YOUR_URL";
const SUPABASE_KEY = "YOUR_ANON_KEY";

const supabase = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

