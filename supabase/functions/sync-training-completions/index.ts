
/**
 * training_completions_2 — v2.3.1
 * • writes to employee_training_completions_2
 * • deduplicates each batch to avoid ON-CONFLICT double-hit errors
 */ 
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.1";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL") || "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || ""
);
const B_API = Deno.env.get("BAMBOOHR_API_KEY");
const B_SUB = Deno.env.get("BAMBOOHR_SUBDOMAIN") || "avfrd";
const AUTH = `Basic ${btoa(`${B_API}:x`)}`;
const TABLE_NAME = "employee_training_completions_2";
const VERSION = "2.3.1";
const MAX_PARALLEL = 8;
const BATCH_SIZE = 100;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type"
};

// ── HTTP helper ────────────────────────────────────────────────
async function j(url: string, retry = 1) {
  for (let i = 0;; i++) {
    const r = await fetch(url, {
      headers: {
        Accept: "application/json",
        Authorization: AUTH
      }
    });
    if (r.status === 404) return [];
    if (r.ok) return r.json();
    if (r.status === 503 && i < retry) {
      await new Promise((res) => setTimeout(res, 500));
      continue;
    }
    throw new Error(`${r.status} ${await r.text()}`);
  }
}

// ── dedupe helper ──────────────────────────────────────────────
function dedupe(rows: any[]) {
  const seen = new Set();
  return rows.filter((r) => {
    const key = `${r.employee_id}|${r.training_id}|${r.completed}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── DB flush ──────────────────────────────────────────────────
async function flush(rows: any[]) {
  const uniqueRows = dedupe(rows);
  if (!uniqueRows.length) return;
  const { error } = await supabase.from(TABLE_NAME).upsert(uniqueRows, {
    onConflict: "employee_id,training_id,completed"
  });
  if (error) {
    console.error("UPSERT error:", JSON.stringify(error, null, 2));
    throw new Error(error.message);
  }
}

// ── main sync ─────────────────────────────────────────────────
async function sync() {
  const dirURL = `https://api.bamboohr.com/api/gateway.php/${B_SUB}/v1/employees/directory`;
  const employees = (await j(dirURL)).employees ?? [];
  const q = [...employees];
  let flushed = 0;
  let buffer: any[] = [];
  
  const worker = async () => {
    for (;;) {
      const emp = q.pop();
      if (!emp) break;
      
      const url = `https://api.bamboohr.com/api/gateway.php/${B_SUB}/v1/training/record/employee/${emp.id}`;
      const trainings = await j(url);
      
      for (const t of Object.values(trainings)) {
        if (!t.completed) continue;
        buffer.push({
          employee_id: parseInt(emp.id),
          display_name: emp.displayName ?? "",
          training_id: parseInt(t.type ?? "0"),
          completed: t.completed,
          instructor: t.instructor ?? null,
          notes: t.notes ?? null
        });
        
        if (buffer.length >= BATCH_SIZE) {
          await flush(buffer);
          flushed += buffer.length;
          buffer = [];
        }
      }
    }
  };
  
  await Promise.all(Array.from({
    length: MAX_PARALLEL
  }, worker));
  
  if (buffer.length) {
    await flush(buffer);
    flushed += buffer.length;
  }
  
  return {
    employees: employees.length,
    completions: flushed
  };
}

// ── HTTP entry ────────────────────────────────────────────────
serve(async (req) => {
  const { pathname } = new URL(req.url);
  
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: CORS
    });
  }
  
  if (pathname.endsWith("/version")) {
    return new Response(JSON.stringify({
      version: VERSION
    }), {
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
  
  try {
    const result = await sync();
    
    return new Response(JSON.stringify({
      status: "ok",
      ...result
    }), {
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  } catch (err) {
    return new Response(JSON.stringify({
      status: "error",
      message: String(err)
    }), {
      status: 500,
      headers: {
        ...CORS,
        "Content-Type": "application/json"
      }
    });
  }
});
