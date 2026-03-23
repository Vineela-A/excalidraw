import React, { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "../data/templates";
import type { TemplateDef } from "../data/templates";
import { useApp } from "./App";

const CloseIcon = (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SearchIcon = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const TemplatePreview: React.FC<{ tpl: TemplateDef }> = ({ tpl }) => {
  const { previewType } = tpl;

  if (previewType === "swot") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3, width: "100%", height: "100%" }}>
        <div style={{ background: "#DCFCE7", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#15803D", fontWeight: 600 }}>S</div>
        <div style={{ background: "#FEE2E2", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#B91C1C", fontWeight: 600 }}>W</div>
        <div style={{ background: "#DBEAFE", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#1D4ED8", fontWeight: 600 }}>O</div>
        <div style={{ background: "#FEF3C7", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, color: "#92400E", fontWeight: 600 }}>T</div>
      </div>
    );
  }

  if (previewType === "kanban") {
    return (
      <div style={{ display: "flex", gap: 4, width: "100%", height: "100%" }}>
        <div style={{ flex: 1, background: "#F3F4F6", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#E5E7EB", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#fff", borderRadius: 3, height: 18, marginBottom: 3, border: "1px solid #E5E7EB" }} />
          <div style={{ background: "#fff", borderRadius: 3, height: 18, border: "1px solid #E5E7EB" }} />
        </div>
        <div style={{ flex: 1, background: "#EFF6FF", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#BFDBFE", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#fff", borderRadius: 3, height: 18, border: "1px solid #BFDBFE" }} />
        </div>
        <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#BBF7D0", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#fff", borderRadius: 3, height: 18, border: "1px solid #BBF7D0" }} />
        </div>
      </div>
    );
  }

  if (previewType === "retro") {
    return (
      <div style={{ display: "flex", gap: 4, width: "100%", height: "100%" }}>
        <div style={{ flex: 1, background: "#F0FDF4", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#BBF7D0", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#DCFCE7", borderRadius: 3, height: 16, marginBottom: 3 }} />
          <div style={{ background: "#DCFCE7", borderRadius: 3, height: 16 }} />
        </div>
        <div style={{ flex: 1, background: "#FFF7ED", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#FED7AA", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#FFEDD5", borderRadius: 3, height: 16 }} />
        </div>
        <div style={{ flex: 1, background: "#EFF6FF", borderRadius: 4, padding: "6px 4px" }}>
          <div style={{ background: "#BFDBFE", borderRadius: 3, height: 8, marginBottom: 4 }} />
          <div style={{ background: "#DBEAFE", borderRadius: 3, height: 16, marginBottom: 3 }} />
          <div style={{ background: "#DBEAFE", borderRadius: 3, height: 16 }} />
        </div>
      </div>
    );
  }

  if (previewType === "mindmap") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 160 100">
        <ellipse cx="80" cy="50" rx="28" ry="16" fill="#6366F1" />
        <text x="80" y="54" textAnchor="middle" fontSize="8" fill="#fff" fontFamily="system-ui">Main Idea</text>
        {[[-45, -22], [-45, 0], [-45, 22], [45, -22], [45, 0], [45, 22]].map(([dx, dy], i) => (
          <g key={i}>
            <line x1={dx! < 0 ? 52 : 108} y1={50} x2={80 + dx! + (dx! < 0 ? 26 : -26)} y2={50 + dy!} stroke={["#6366F1","#8B5CF6","#EC4899","#14B8A6","#F59E0B","#EF4444"][i]} strokeWidth="1.5" />
            <rect x={80 + dx! + (dx! < 0 ? -26 : 0)} y={50 + dy! - 9} width={26} height={18} rx={4} fill={["#EEF2FF","#F5F3FF","#FDF2F8","#F0FDFA","#FFFBEB","#FEF2F2"][i]} stroke={["#6366F1","#8B5CF6","#EC4899","#14B8A6","#F59E0B","#EF4444"][i]} strokeWidth="1" />
          </g>
        ))}
      </svg>
    );
  }

  if (previewType === "brainstorm") {
    const colors = ["#FFDD57", "#FF9F47", "#57BEFF", "#56D17E", "#B884F7", "#FF7B6B"];
    const pos = [[4, 4], [56, 8], [108, 4], [4, 56], [56, 52], [108, 56]];
    return (
      <div style={{ position: "relative", width: "100%", height: "100%" }}>
        {pos.map(([x, y], i) => (
          <div key={i} style={{
            position: "absolute",
            left: `${(x / 160) * 100}%`,
            top: `${(y / 100) * 100}%`,
            width: "28%",
            height: "38%",
            background: colors[i % colors.length],
            borderRadius: 4,
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }} />
        ))}
      </div>
    );
  }

  if (previewType === "journey") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 2, width: "100%", height: "100%" }}>
        <div style={{ display: "flex", gap: 2, height: "22%" }}>
          <div style={{ width: "18%", background: "#F3F4F6", borderRadius: 3 }} />
          {["#DBEAFE","#DBEAFE","#DBEAFE","#DBEAFE","#DBEAFE"].map((c, i) => (
            <div key={i} style={{ flex: 1, background: c, borderRadius: 3 }} />
          ))}
        </div>
        {["#F9FAFB","#F0FDF4","#FFF7ED","#FEF2F2"].map((rowBg, ri) => (
          <div key={ri} style={{ display: "flex", gap: 2, flex: 1 }}>
            <div style={{ width: "18%", background: "#F3F4F6", borderRadius: 3 }} />
            {Array(5).fill(null).map((_, ci) => (
              <div key={ci} style={{ flex: 1, background: rowBg, borderRadius: 3 }} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (previewType === "timeline") {
    return (
      <svg width="100%" height="100%" viewBox="0 0 160 80">
        <line x1="10" y1="40" x2="150" y2="40" stroke="#6366F1" strokeWidth="2.5" />
        {[10, 47, 80, 113, 150].map((x, i) => (
          <g key={i}>
            <circle cx={x} cy={40} r={6} fill="#6366F1" />
            {i % 2 === 0
              ? <rect x={x - 16} y={12} width={32} height={16} rx={3} fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
              : <rect x={x - 16} y={52} width={32} height={16} rx={3} fill="#EEF2FF" stroke="#6366F1" strokeWidth="1" />
            }
          </g>
        ))}
      </svg>
    );
  }

  if (previewType === "matrix") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 3, width: "100%", height: "100%" }}>
        <div style={{ background: "#FEE2E2", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#B91C1C", fontWeight: 600, padding: "2px 4px", textAlign: "center" }}>Do First</div>
        <div style={{ background: "#DCFCE7", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#15803D", fontWeight: 600, padding: "2px 4px", textAlign: "center" }}>Schedule</div>
        <div style={{ background: "#FEF3C7", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#92400E", fontWeight: 600, padding: "2px 4px", textAlign: "center" }}>Delegate</div>
        <div style={{ background: "#F3F4F6", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "#374151", fontWeight: 600, padding: "2px 4px", textAlign: "center" }}>Eliminate</div>
      </div>
    );
  }

  return <div style={{ background: "#F3F4F6", borderRadius: 6, width: "100%", height: "100%" }} />;
};

const TemplateCard: React.FC<{
  tpl: TemplateDef;
  onUse: (tpl: TemplateDef) => void;
}> = ({ tpl, onUse }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 12,
        border: `2px solid ${hovered ? "#6366F1" : "#E5E7EB"}`,
        background: "#fff",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 0.15s, box-shadow 0.15s",
        boxShadow: hovered ? "0 4px 16px rgba(99,102,241,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
        display: "flex",
        flexDirection: "column",
      }}
      onClick={() => onUse(tpl)}
    >
      <div
        style={{
          height: 140,
          background: tpl.previewBg,
          padding: 12,
          position: "relative",
        }}
      >
        <TemplatePreview tpl={tpl} />
        {hovered && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(99,102,241,0.06)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onUse(tpl); }}
              style={{
                background: "#6366F1",
                color: "#fff",
                border: "none",
                borderRadius: 8,
                padding: "8px 20px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: "system-ui, sans-serif",
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(99,102,241,0.3)",
              }}
            >
              Use Template
            </button>
          </div>
        )}
      </div>
      <div style={{ padding: "10px 12px 12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 16 }}>{tpl.emoji}</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: "#111827", fontFamily: "system-ui, sans-serif" }}>{tpl.name}</span>
        </div>
        <div style={{ fontSize: 12, color: "#6B7280", fontFamily: "system-ui, sans-serif", lineHeight: 1.4 }}>{tpl.description}</div>
      </div>
    </div>
  );
};

const TemplateLibraryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const app = useApp();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const handleUse = useCallback((tpl: TemplateDef) => {
    const elements = tpl.create();
    app.onInsertElements(elements);
    onClose();
  }, [app, onClose]);

  const filtered = TEMPLATES.filter((t) => {
    const matchCat = category === "All" || t.category === category;
    const q = query.toLowerCase();
    const matchQ = !q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 20000,
        background: "rgba(17,24,39,0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
      }}
      onPointerDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: "min(900px, 96vw)",
          height: "min(640px, 92vh)",
          background: "#fff",
          borderRadius: 18,
          boxShadow: "0 24px 80px rgba(0,0,0,0.22)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px 14px",
            borderBottom: "1px solid #F3F4F6",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#111827", fontFamily: "system-ui, sans-serif" }}>
              Template Library
            </div>
            <div style={{ fontSize: 13, color: "#6B7280", fontFamily: "system-ui, sans-serif", marginTop: 2 }}>
              Start faster with a ready-made board layout
            </div>
          </div>
          <div
            style={{
              position: "relative",
              display: "flex",
              alignItems: "center",
            }}
          >
            <span style={{ position: "absolute", left: 10, pointerEvents: "none" }}>{SearchIcon}</span>
            <input
              type="text"
              placeholder="Search templates…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              style={{
                paddingLeft: 34,
                paddingRight: 12,
                height: 36,
                width: 220,
                border: "1px solid #E5E7EB",
                borderRadius: 8,
                fontSize: 13,
                fontFamily: "system-ui, sans-serif",
                outline: "none",
                color: "#374151",
              }}
            />
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#6B7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 6,
              borderRadius: 6,
            }}
          >
            {CloseIcon}
          </button>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          <div
            style={{
              width: 180,
              flexShrink: 0,
              borderRight: "1px solid #F3F4F6",
              padding: "12px 8px",
              overflowY: "auto",
            }}
          >
            {TEMPLATE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: 8,
                  background: category === cat ? "#EEF2FF" : "transparent",
                  color: category === cat ? "#4338CA" : "#374151",
                  fontWeight: category === cat ? 600 : 400,
                  fontSize: 13,
                  fontFamily: "system-ui, sans-serif",
                  cursor: "pointer",
                  marginBottom: 2,
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "16px 20px",
            }}
          >
            {filtered.length === 0 ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "#9CA3AF", fontFamily: "system-ui, sans-serif", fontSize: 14 }}>
                No templates found
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
                  gap: 16,
                }}
              >
                {filtered.map((tpl) => (
                  <TemplateCard key={tpl.id} tpl={tpl} onUse={handleUse} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const TemplateLibrary: React.FC = () => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("excalidraw:openTemplateLibrary", handler);
    return () => window.removeEventListener("excalidraw:openTemplateLibrary", handler);
  }, []);

  if (!open) return null;

  return createPortal(
    <TemplateLibraryModal onClose={() => setOpen(false)} />,
    document.body,
  );
};

export default TemplateLibrary;
