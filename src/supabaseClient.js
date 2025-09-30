import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lmgbtjieffptlrvjkimp.supabase.co";  // đổi URL của bạn
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxtZ2J0amllZmZwdGxydmpraW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4ODEyNzEsImV4cCI6MjA3NDQ1NzI3MX0.-9fEQrwQvzHZfcWIOiukGKmcVyECoMUf8fRffWSPlEs";             // đổi key của bạn

export const supabase = createClient(supabaseUrl, supabaseKey);
