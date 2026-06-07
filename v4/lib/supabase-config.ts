// Credenciais Supabase do projeto arena-de-ias.
// NEXT_PUBLIC_* já são públicas (vão pro bundle JS do client). Hardcoded
// aqui apenas como FALLBACK pra contornar limitação de env vars sensitive
// no Edge Runtime do Vercel. Env var (se setada) tem precedência.
//
// Anon key é segura pra exposição: protegida por Row Level Security
// no Supabase. Service role key NUNCA pode ficar aqui.

export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://dkrsxsvdihrxmehilohq.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRrcnN4c3ZkaWhyeG1laGlsb2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3ODI3NzksImV4cCI6MjA5NjM1ODc3OX0.1ulz5dbmKv5GXXIEatVAiZpksYOEfh2bnN91wJXwOtA";
