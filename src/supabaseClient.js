import { createClient } from "@supabase/supabase-js";

/*const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;*/

const supabaseUrl = "https://lpubxbxoghpbcemuynuh.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxwdWJ4YnhvZ2hwYmNlbXV5bnVoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTc3NjQ2NSwiZXhwIjoyMDkxMzUyNDY1fQ.fdY5gFTUZd8nEdilaWJh8ioP9fIpvolE60cQCaJyyRc";




export const supabase = createClient(supabaseUrl, supabaseAnonKey);