// components/DebugPanel.tsx (nuevo)
export default function DebugPanel(props: Record<string, any>) {
  return (
    <pre
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 50,
        maxWidth: "38rem",
        maxHeight: "40vh",
        overflow: "auto",
        background: "rgba(0,0,0,0.85)",
        color: "#eee",
        padding: "10px 12px",
        fontSize: 12,
        borderRadius: 10,
        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
      }}
    >
      {JSON.stringify(props, null, 2)}
    </pre>
  );
}
