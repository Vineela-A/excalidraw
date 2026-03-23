import {
  newElement,
  newTextElement,
  newLinearElement,
  newStickynoteElement,
} from "@excalidraw/element";
import { randomId } from "@excalidraw/common";
import { pointFrom } from "@excalidraw/math";

import type { ExcalidrawElement } from "@excalidraw/element/types";

export interface TemplateDef {
  id: string;
  name: string;
  category: string;
  description: string;
  emoji: string;
  previewBg: string;
  previewType:
    | "swot"
    | "kanban"
    | "retro"
    | "mindmap"
    | "brainstorm"
    | "journey"
    | "timeline"
    | "matrix"
    | "blank";
  create: () => ExcalidrawElement[];
}

export const TEMPLATE_CATEGORIES = [
  "All",
  "Strategy",
  "Planning",
  "Retrospectives",
  "Ideation",
  "Mapping",
];

const rect = (
  x: number,
  y: number,
  width: number,
  height: number,
  opts: Partial<Parameters<typeof newElement>[0]> = {},
) =>
  newElement({
    type: "rectangle",
    x,
    y,
    width,
    height,
    roughness: 0,
    strokeWidth: 1,
    fillStyle: "solid",
    strokeColor: "#E5E7EB",
    backgroundColor: "transparent",
    ...opts,
  });

const txt = (
  x: number,
  y: number,
  text: string,
  opts: Partial<Parameters<typeof newTextElement>[0]> = {},
) =>
  newTextElement({
    x,
    y,
    text,
    fontSize: 16,
    roughness: 0,
    strokeColor: "#374151",
    textAlign: "center",
    verticalAlign: "middle",
    ...opts,
  });

const line = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  opts: Partial<Parameters<typeof newLinearElement>[0]> = {},
) =>
  newLinearElement({
    type: "line",
    x: x1,
    y: y1,
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    points: [pointFrom(0, 0), pointFrom(x2 - x1, y2 - y1)],
    roughness: 0,
    strokeWidth: 2,
    strokeColor: "#D1D5DB",
    fillStyle: "solid",
    ...opts,
  });

const sticky = (
  x: number,
  y: number,
  text: string,
  bg: string,
  gIds?: string[],
) =>
  newStickynoteElement({
    x,
    y,
    width: 200,
    height: 150,
    text,
    fontSize: 14,
    backgroundColor: bg,
    groupIds: gIds,
  });

export const TEMPLATES: TemplateDef[] = [
  {
    id: "swot",
    name: "SWOT Analysis",
    category: "Strategy",
    description:
      "Identify Strengths, Weaknesses, Opportunities, and Threats for any strategic decision.",
    emoji: "📊",
    previewBg: "#F0FDF4",
    previewType: "swot",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const GAP = 12;
      const W = 480;
      const H = 380;
      const elements: ExcalidrawElement[] = [
        txt(0, -60, "SWOT Analysis", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "left",
          verticalAlign: "top",
        }),

        rect(0, 0, W, H, {
          backgroundColor: "#DCFCE7",
          strokeColor: "#86EFAC",
          groupIds: gIds,
        }),
        txt(W / 2, 28, "S — Strengths", {
          fontSize: 18,
          strokeColor: "#15803D",
          groupIds: gIds,
        }),

        rect(W + GAP, 0, W, H, {
          backgroundColor: "#FEE2E2",
          strokeColor: "#FCA5A5",
          groupIds: gIds,
        }),
        txt(W + GAP + W / 2, 28, "W — Weaknesses", {
          fontSize: 18,
          strokeColor: "#B91C1C",
          groupIds: gIds,
        }),

        rect(0, H + GAP, W, H, {
          backgroundColor: "#DBEAFE",
          strokeColor: "#93C5FD",
          groupIds: gIds,
        }),
        txt(W / 2, H + GAP + 28, "O — Opportunities", {
          fontSize: 18,
          strokeColor: "#1D4ED8",
          groupIds: gIds,
        }),

        rect(W + GAP, H + GAP, W, H, {
          backgroundColor: "#FEF3C7",
          strokeColor: "#FCD34D",
          groupIds: gIds,
        }),
        txt(W + GAP + W / 2, H + GAP + 28, "T — Threats", {
          fontSize: 18,
          strokeColor: "#92400E",
          groupIds: gIds,
        }),
      ];
      return elements;
    },
  },

  {
    id: "kanban",
    name: "Kanban Board",
    category: "Planning",
    description:
      "Visualize work in progress with To Do, In Progress, and Done columns.",
    emoji: "📋",
    previewBg: "#EFF6FF",
    previewType: "kanban",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const CW = 360;
      const CH = 700;
      const GAP = 16;
      const HEADER_H = 52;
      const columns = [
        { label: "To Do", bg: "#F9FAFB", hbg: "#F3F4F6", col: "#374151" },
        { label: "In Progress", bg: "#EFF6FF", hbg: "#DBEAFE", col: "#1D4ED8" },
        { label: "Done", bg: "#F0FDF4", hbg: "#DCFCE7", col: "#15803D" },
      ];
      const elements: ExcalidrawElement[] = [
        txt(0, -50, "Kanban Board", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "left",
          verticalAlign: "top",
        }),
      ];
      columns.forEach((col, i) => {
        const x = i * (CW + GAP);
        elements.push(
          rect(x, 0, CW, HEADER_H, {
            backgroundColor: col.hbg,
            strokeColor: col.hbg,
            groupIds: gIds,
          }),
          txt(x + CW / 2, HEADER_H / 2, col.label, {
            fontSize: 16,
            strokeColor: col.col,
            groupIds: gIds,
          }),
          rect(x, HEADER_H, CW, CH - HEADER_H, {
            backgroundColor: col.bg,
            strokeColor: "#E5E7EB",
            groupIds: gIds,
          }),
        );
      });
      return elements;
    },
  },

  {
    id: "retro",
    name: "Sprint Retrospective",
    category: "Retrospectives",
    description:
      "Reflect on your sprint with What Went Well, What to Improve, and Action Items.",
    emoji: "🔄",
    previewBg: "#F5F3FF",
    previewType: "retro",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const CW = 380;
      const CH = 680;
      const GAP = 16;
      const HEADER_H = 60;
      const columns = [
        {
          label: "😊 What Went Well",
          bg: "#F0FDF4",
          hbg: "#DCFCE7",
          col: "#15803D",
        },
        {
          label: "🤔 What to Improve",
          bg: "#FFF7ED",
          hbg: "#FED7AA",
          col: "#C2410C",
        },
        {
          label: "✅ Action Items",
          bg: "#EFF6FF",
          hbg: "#DBEAFE",
          col: "#1D4ED8",
        },
      ];
      const elements: ExcalidrawElement[] = [
        txt(0, -50, "Sprint Retrospective", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "left",
          verticalAlign: "top",
        }),
      ];
      columns.forEach((col, i) => {
        const x = i * (CW + GAP);
        elements.push(
          rect(x, 0, CW, HEADER_H, {
            backgroundColor: col.hbg,
            strokeColor: col.hbg,
            groupIds: gIds,
          }),
          txt(x + CW / 2, HEADER_H / 2, col.label, {
            fontSize: 15,
            strokeColor: col.col,
            groupIds: gIds,
          }),
          rect(x, HEADER_H, CW, CH - HEADER_H, {
            backgroundColor: col.bg,
            strokeColor: "#E5E7EB",
            groupIds: gIds,
          }),
        );
      });
      return elements;
    },
  },

  {
    id: "mindmap",
    name: "Mind Map",
    category: "Ideation",
    description:
      "Visually organise ideas radiating from a central concept.",
    emoji: "🧠",
    previewBg: "#FFF7ED",
    previewType: "mindmap",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const cx = 460;
      const cy = 280;
      const branches: { label: string; dx: number; dy: number; color: string }[] = [
        { label: "Idea 1", dx: -380, dy: -160, color: "#6366F1" },
        { label: "Idea 2", dx: -380, dy: 0, color: "#8B5CF6" },
        { label: "Idea 3", dx: -380, dy: 160, color: "#EC4899" },
        { label: "Idea 4", dx: 380, dy: -160, color: "#14B8A6" },
        { label: "Idea 5", dx: 380, dy: 0, color: "#F59E0B" },
        { label: "Idea 6", dx: 380, dy: 160, color: "#EF4444" },
      ];
      const elements: ExcalidrawElement[] = [
        newElement({
          type: "ellipse",
          x: cx - 110,
          y: cy - 44,
          width: 220,
          height: 88,
          backgroundColor: "#6366F1",
          strokeColor: "#4338CA",
          fillStyle: "solid",
          roughness: 0,
          strokeWidth: 2,
          groupIds: gIds,
        }),
        txt(cx, cy, "Main Idea", {
          fontSize: 20,
          strokeColor: "#FFFFFF",
          groupIds: gIds,
        }),
      ];
      branches.forEach((b) => {
        const bx = cx + b.dx;
        const by = cy + b.dy;
        const ex = b.dx < 0 ? cx - 110 : cx + 110;
        elements.push(
          line(ex, cy, bx + (b.dx < 0 ? 160 : 0), by, {
            strokeColor: b.color,
            strokeWidth: 2,
            groupIds: gIds,
          }),
          rect(bx - (b.dx < 0 ? 160 : 0), by - 26, 160, 52, {
            backgroundColor: b.color + "22",
            strokeColor: b.color,
            strokeWidth: 2,
            groupIds: gIds,
          }),
          txt(bx + (b.dx < 0 ? -80 : 80), by, b.label, {
            fontSize: 15,
            strokeColor: b.color,
            groupIds: gIds,
          }),
        );
      });
      return elements;
    },
  },

  {
    id: "brainstorm",
    name: "Brainstorming Board",
    category: "Ideation",
    description:
      "A free-form space with colour-coded sticky notes to capture and organise ideas.",
    emoji: "💡",
    previewBg: "#FFFBEB",
    previewType: "brainstorm",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const colors = [
        "#FFDD57",
        "#FF9F47",
        "#57BEFF",
        "#56D17E",
        "#B884F7",
        "#FF7B6B",
      ];
      const positions = [
        [0, 0],
        [220, 20],
        [440, 0],
        [660, 20],
        [110, 190],
        [330, 180],
        [550, 190],
      ];
      const labels = [
        "💡 Idea",
        "🤔 Question",
        "✨ Insight",
        "🎯 Goal",
        "📝 Note",
        "⚡ Action",
        "🔑 Key Point",
      ];
      const elements: ExcalidrawElement[] = [
        txt(430, -55, "Brainstorming Session", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "center",
          verticalAlign: "top",
        }),
      ];
      positions.forEach(([x, y], i) => {
        elements.push(
          sticky(x, y, labels[i] ?? "", colors[i % colors.length] ?? "#FFDD57", gIds),
        );
      });
      return elements;
    },
  },

  {
    id: "journey",
    name: "Customer Journey Map",
    category: "Mapping",
    description:
      "Map the customer experience across awareness, consideration, decision, and retention stages.",
    emoji: "🗺️",
    previewBg: "#F0F9FF",
    previewType: "journey",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const stages = ["Awareness", "Consideration", "Decision", "Retention", "Advocacy"];
      const rows = ["Actions", "Thoughts", "Emotions", "Pain Points", "Opportunities"];
      const CW = 220;
      const CH = 90;
      const LABEL_W = 160;
      const elements: ExcalidrawElement[] = [
        txt(LABEL_W + (stages.length * CW) / 2, -50, "Customer Journey Map", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "center",
          verticalAlign: "top",
        }),
      ];
      stages.forEach((stage, ci) => {
        elements.push(
          rect(LABEL_W + ci * CW, 0, CW, CH, {
            backgroundColor: "#DBEAFE",
            strokeColor: "#93C5FD",
            groupIds: gIds,
          }),
          txt(LABEL_W + ci * CW + CW / 2, CH / 2, stage, {
            fontSize: 15,
            strokeColor: "#1D4ED8",
            groupIds: gIds,
          }),
        );
      });
      const rowColors = ["#F9FAFB", "#F0FDF4", "#FFF7ED", "#FEF2F2", "#F5F3FF"];
      rows.forEach((row, ri) => {
        const y = CH + ri * CH;
        elements.push(
          rect(0, y, LABEL_W, CH, {
            backgroundColor: "#F3F4F6",
            strokeColor: "#E5E7EB",
            groupIds: gIds,
          }),
          txt(LABEL_W / 2, y + CH / 2, row, {
            fontSize: 13,
            strokeColor: "#374151",
            groupIds: gIds,
          }),
        );
        stages.forEach((_, ci) => {
          elements.push(
            rect(LABEL_W + ci * CW, y, CW, CH, {
              backgroundColor: rowColors[ri % rowColors.length] ?? "#F9FAFB",
              strokeColor: "#E5E7EB",
              groupIds: gIds,
            }),
          );
        });
      });
      return elements;
    },
  },

  {
    id: "timeline",
    name: "Project Timeline",
    category: "Planning",
    description:
      "Plan your project milestones and key dates on a visual timeline.",
    emoji: "📅",
    previewBg: "#F0FDF4",
    previewType: "timeline",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const milestones = [
        { label: "Kickoff", desc: "Project start", above: true },
        { label: "Design", desc: "UI/UX complete", above: false },
        { label: "Dev Sprint", desc: "Build features", above: true },
        { label: "Testing", desc: "QA & review", above: false },
        { label: "Launch", desc: "Go live 🚀", above: true },
      ];
      const SPACING = 260;
      const CY = 200;
      const TOTAL_W = (milestones.length - 1) * SPACING;
      const elements: ExcalidrawElement[] = [
        txt(TOTAL_W / 2, -50, "Project Timeline", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "center",
          verticalAlign: "top",
        }),
        line(0, CY, TOTAL_W, CY, {
          strokeColor: "#6366F1",
          strokeWidth: 3,
          groupIds: gIds,
        }),
      ];
      milestones.forEach((m, i) => {
        const mx = i * SPACING;
        elements.push(
          newElement({
            type: "ellipse",
            x: mx - 18,
            y: CY - 18,
            width: 36,
            height: 36,
            backgroundColor: "#6366F1",
            strokeColor: "#4338CA",
            fillStyle: "solid",
            roughness: 0,
            strokeWidth: 2,
            groupIds: gIds,
          }),
        );
        if (m.above) {
          elements.push(
            line(mx, CY - 18, mx, CY - 80, {
              strokeColor: "#A5B4FC",
              strokeWidth: 1,
              groupIds: gIds,
            }),
            txt(mx, CY - 100, m.label, {
              fontSize: 16,
              strokeColor: "#312E81",
              groupIds: gIds,
            }),
            txt(mx, CY - 130, m.desc, {
              fontSize: 12,
              strokeColor: "#6B7280",
              groupIds: gIds,
            }),
          );
        } else {
          elements.push(
            line(mx, CY + 18, mx, CY + 80, {
              strokeColor: "#A5B4FC",
              strokeWidth: 1,
              groupIds: gIds,
            }),
            txt(mx, CY + 100, m.label, {
              fontSize: 16,
              strokeColor: "#312E81",
              groupIds: gIds,
            }),
            txt(mx, CY + 120, m.desc, {
              fontSize: 12,
              strokeColor: "#6B7280",
              groupIds: gIds,
            }),
          );
        }
      });
      return elements;
    },
  },

  {
    id: "matrix",
    name: "Eisenhower Matrix",
    category: "Strategy",
    description:
      "Prioritise tasks by urgency and importance across four quadrants.",
    emoji: "⚡",
    previewBg: "#FFF7ED",
    previewType: "matrix",
    create: () => {
      const g = randomId();
      const gIds = [g];
      const W = 480;
      const H = 400;
      const GAP = 12;
      const quadrants = [
        {
          label: "Do First",
          sub: "Urgent & Important",
          bg: "#FEE2E2",
          col: "#B91C1C",
        },
        {
          label: "Schedule",
          sub: "Not Urgent & Important",
          bg: "#DCFCE7",
          col: "#15803D",
        },
        {
          label: "Delegate",
          sub: "Urgent & Not Important",
          bg: "#FEF3C7",
          col: "#92400E",
        },
        {
          label: "Eliminate",
          sub: "Not Urgent & Not Important",
          bg: "#F3F4F6",
          col: "#374151",
        },
      ];
      const AXIS_OFFSET = 50;
      const elements: ExcalidrawElement[] = [
        txt(W + GAP / 2 + AXIS_OFFSET, -55, "Eisenhower Matrix", {
          fontSize: 28,
          strokeColor: "#111827",
          groupIds: gIds,
          textAlign: "center",
          verticalAlign: "top",
        }),
        txt(W + GAP / 2 + AXIS_OFFSET, -15, "↑ Important", {
          fontSize: 13,
          strokeColor: "#6B7280",
          groupIds: gIds,
          textAlign: "center",
        }),
        txt(AXIS_OFFSET + (2 * W + GAP) + 20, H + GAP / 2, "Urgent →", {
          fontSize: 13,
          strokeColor: "#6B7280",
          groupIds: gIds,
          textAlign: "left",
        }),
      ];
      const positions = [
        [AXIS_OFFSET, 0],
        [AXIS_OFFSET + W + GAP, 0],
        [AXIS_OFFSET, H + GAP],
        [AXIS_OFFSET + W + GAP, H + GAP],
      ];
      quadrants.forEach((q, i) => {
        const [x, y] = positions[i] ?? [0, 0];
        elements.push(
          rect(x, y, W, H, {
            backgroundColor: q.bg,
            strokeColor: "#E5E7EB",
            groupIds: gIds,
          }),
          txt(x + W / 2, y + 36, q.label, {
            fontSize: 22,
            strokeColor: q.col,
            groupIds: gIds,
          }),
          txt(x + W / 2, y + 68, q.sub, {
            fontSize: 12,
            strokeColor: q.col + "99",
            groupIds: gIds,
          }),
        );
      });
      return elements;
    },
  },
];
