import { COLORS } from "../constants";

export default function ProgressBar({ value, max, color, height = 4, width }) {
  return (
    <div style={{ width: width || "100%", height, background: COLORS.surface, borderRadius: 2, overflow: "hidden" }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min((value / max) * 100, 100)}%`,
          background: color,
          transition: "width 0.5s linear",
        }}
      />
    </div>
  );
}
