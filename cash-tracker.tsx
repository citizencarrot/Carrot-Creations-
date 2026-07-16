import { useState, useEffect, useMemo } from "react";
import { Plus, Trash2, TrendingUp, TrendingDown, Receipt } from "lucide-react";

const CATEGORIES = ["Paycheck", "Tips", "Transfer In", "Bills", "Supplies", "Food", "Music/Gear", "Other"];

export default function CashTracker() {
  const [entries, setEntries] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [form, setForm] = useState({ type: "income", amount: "", category: "Paycheck", note: "", date: new Date().toISOString().slice(0, 10) });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("cashapp-entries", false);
        if (res?.value) setEntries(JSON.parse(res.value));
      } catch (e) {
        // no entries yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    window.storage.set("cashapp-entries", JSON.stringify(entries), false).catch(() => {});
  }, [entries, loaded]);

  const balance = useMemo(() => entries.reduce((sum, e) => sum + (e.type === "income" ? e.amount : -e.amount), 0), [entries]);
  const totalIn = useMemo(() => entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), [entries]);
  const totalOut = useMemo(() => entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0), [entries]);

  const sorted = useMemo(() => [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id), [entries]);

  function addEntry() {
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    setEntries([...entries, { id: Date.now(), type: form.type, amount: amt, category: form.category, note: form.note, date: form.date }]);
    setForm({ ...form, amount: "", note: "" });
    setShowForm(false);
  }

  function removeEntry(id) {
    setEntries(entries.filter(e => e.id !== id));
  }

  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });

  return (
    <div style={{ minHeight: "100vh", background: "#1F3A2E", fontFamily: "'Inter', sans-serif", padding: "0", display: "flex", justifyContent: "center" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zilla+Slab:wght@400;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@500;600&display=swap');
        * { box-sizing: border-box; }
        .amount-input:focus, .select-input:focus, .text-input:focus { outline: 2px solid #C9A227; outline-offset: 1px; }
        button:focus-visible { outline: 2px solid #C9A227; outline-offset: 2px; }
      `}</style>
      <div style={{ width: "100%", maxWidth: 480, minHeight: "100vh", background: "#FAF7EF", position: "relative" }}>

        {/* Torn receipt header */}
        <div style={{ background: "#1F3A2E", padding: "28px 24px 40px", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#C9A227", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, letterSpacing: 2, textTransform: "uppercase" }}>
            <Receipt size={14} /> Cash Ledger
          </div>
          <div style={{ color: "#FAF7EF", fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 42, marginTop: 6, lineHeight: 1 }}>
            {money(balance)}
          </div>
          <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
            <div style={{ color: "#9FB8A8", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
              <TrendingUp size={14} color="#C9A227" /> {money(totalIn)} in
            </div>
            <div style={{ color: "#9FB8A8", fontSize: 13, display: "flex", alignItems: "center", gap: 5 }}>
              <TrendingDown size={14} color="#B0554A" /> {money(totalOut)} out
            </div>
          </div>
          {/* jagged receipt edge */}
          <svg viewBox="0 0 480 20" style={{ position: "absolute", bottom: -1, left: 0, width: "100%", height: 20, display: "block" }} preserveAspectRatio="none">
            <polygon points="0,0 480,0 480,20 460,4 440,20 420,4 400,20 380,4 360,20 340,4 320,20 300,4 280,20 260,4 240,20 220,4 200,20 180,4 160,20 140,4 120,20 100,4 80,20 60,4 40,20 20,4 0,20" fill="#FAF7EF" />
          </svg>
        </div>

        {/* Entries list */}
        <div style={{ padding: "20px 20px 100px" }}>
          {sorted.length === 0 && (
            <div style={{ textAlign: "center", color: "#8A8474", fontSize: 14, marginTop: 40, fontFamily: "'Inter', sans-serif" }}>
              No entries yet. Log your first Cash App payment or expense below.
            </div>
          )}
          {sorted.map(e => (
            <div key={e.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 4px", borderBottom: "1px dashed #DDD5C0" }}>
              <div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 14, color: "#2A2A22" }}>{e.category}</div>
                <div style={{ fontSize: 12, color: "#9A927C", marginTop: 2 }}>{e.date}{e.note ? ` · ${e.note}` : ""}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600, fontSize: 15, color: e.type === "income" ? "#3D6B4F" : "#B0554A" }}>
                  {e.type === "income" ? "+" : "−"}{money(e.amount)}
                </div>
                <button onClick={() => removeEntry(e.id)} aria-label="Delete entry" style={{ background: "none", border: "none", cursor: "pointer", color: "#C4BBA3", padding: 4 }}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Add button */}
        <button
          onClick={() => setShowForm(true)}
          style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", width: "calc(100% - 40px)", maxWidth: 440, background: "#1F3A2E", color: "#FAF7EF", border: "none", borderRadius: 14, padding: "16px", fontSize: 15, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", boxShadow: "0 6px 20px rgba(0,0,0,0.25)" }}
        >
          <Plus size={18} /> Add entry
        </button>

        {/* Form overlay */}
        {showForm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(20,30,22,0.55)", display: "flex", alignItems: "flex-end", zIndex: 10 }} onClick={() => setShowForm(false)}>
            <div style={{ background: "#FAF7EF", width: "100%", maxWidth: 480, margin: "0 auto", borderRadius: "20px 20px 0 0", padding: 24 }} onClick={ev => ev.stopPropagation()}>
              <div style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: 20, color: "#1F3A2E", marginBottom: 16 }}>New entry</div>

              <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
                {["income", "expense"].map(t => (
                  <button key={t} onClick={() => setForm({ ...form, type: t, category: t === "income" ? "Paycheck" : "Bills" })}
                    style={{ flex: 1, padding: "10px", borderRadius: 10, border: form.type === t ? "2px solid #1F3A2E" : "1px solid #DDD5C0", background: form.type === t ? "#1F3A2E" : "#FFF", color: form.type === t ? "#FAF7EF" : "#2A2A22", fontWeight: 600, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>
                    {t}
                  </button>
                ))}
              </div>

              <label style={{ fontSize: 12, color: "#8A8474", fontWeight: 600 }}>AMOUNT</label>
              <input className="amount-input" type="number" inputMode="decimal" placeholder="0.00" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                style={{ width: "100%", padding: "12px", fontSize: 20, fontFamily: "'IBM Plex Mono', monospace", border: "1px solid #DDD5C0", borderRadius: 10, marginTop: 6, marginBottom: 14 }} />

              <label style={{ fontSize: 12, color: "#8A8474", fontWeight: 600 }}>CATEGORY</label>
              <select className="select-input" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                style={{ width: "100%", padding: "12px", fontSize: 14, border: "1px solid #DDD5C0", borderRadius: 10, marginTop: 6, marginBottom: 14, background: "#FFF" }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <label style={{ fontSize: 12, color: "#8A8474", fontWeight: 600 }}>DATE</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                style={{ width: "100%", padding: "12px", fontSize: 14, border: "1px solid #DDD5C0", borderRadius: 10, marginTop: 6, marginBottom: 14 }} />

              <label style={{ fontSize: 12, color: "#8A8474", fontWeight: 600 }}>NOTE (optional)</label>
              <input className="text-input" type="text" placeholder="e.g. flower supplies" value={form.note}
                onChange={e => setForm({ ...form, note: e.target.value })}
                style={{ width: "100%", padding: "12px", fontSize: 14, border: "1px solid #DDD5C0", borderRadius: 10, marginTop: 6, marginBottom: 20 }} />

              <button onClick={addEntry} style={{ width: "100%", background: "#C9A227", color: "#1F3A2E", border: "none", borderRadius: 12, padding: "14px", fontWeight: 700, fontSize: 15, cursor: "pointer" }}>
                Save entry
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
