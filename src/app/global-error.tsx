"use client";
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="th">
      <body style={{ background: "#0a0c14", color: "#eef0f8", fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100dvh", textAlign: "center" }}>
        <div>
          <h1>เกิดข้อผิดพลาดร้ายแรง</h1>
          <p>กรุณาลองโหลดหน้าใหม่อีกครั้ง</p>
          <button onClick={reset} style={{ padding: "10px 18px", borderRadius: 8, border: 0, background: "#8f7bff", color: "#0d0a24", fontWeight: 600 }}>ลองอีกครั้ง</button>
        </div>
      </body>
    </html>
  );
}
