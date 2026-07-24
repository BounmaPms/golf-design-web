const SUPABASE_URL =
  "https://joygzdofxctopnjqthnp.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_vQj2CDmkTsvZuLsMaaN3wA_Vh6kmtGO";

if (!window.supabase) {
  throw new Error("Supabase SDK โหลดไม่สำเร็จ");
}

window.supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

console.log("Supabase connected:", window.supabaseClient);