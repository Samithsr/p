import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const Type5 = ({
  topic,
  minValue = 0,
  maxValue = 100,
  unit = "mm/s",
  label = "n/a",  // Added label prop
}) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const socket = io("http://13.233.73.61:4000", {
      // path: "/socket.io/",
      transports: ["websocket"],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      upgrade: false, 
    });
    socket.emit("subscribeToTopic", topic);
    socket.on("liveMessage", (data) => {
      setValue(
        Math.min(Math.max(data.message.message.message, minValue), maxValue)
      );
    });
    return () => socket.disconnect();
  }, [topic]);

  return (
    <div
      style={{
        background: "#1e293b",
        padding: "2rem",
        borderRadius: "10px",
        fontFamily: "'Courier New', monospace",
        position: "relative",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          background: "#0f172a",
          padding: "1.5rem",
          borderRadius: "8px",
          border: "2px solid #334155",
        }}
      >
        <div
          style={{
            color: "#4ade80",
            fontSize: "2.5rem",
            textAlign: "center",
            textShadow: "0 0 10px #4ade8055",
          }}
        >
          {value.toFixed(2)}
          {unit}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: "10px",
          right: "10px",
          fontSize: "1.5rem",
          animation: "shake 0.5s infinite",
          filter: `opacity(${value / maxValue})`,
        }}
      >
        📳
      </div>
      
      {/* Label Below the Value */}
      <div
        style={{
          marginTop: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          textAlign:"center",
          color: "#fff", 
        }}
      >
        {label}
      </div>

      <style>{`
        @keyframes shake {
          0% { transform: translateX(0); }
          25% { transform: translateX(2px); }
          50% { transform: translateX(-2px); }
          75% { transform: translateX(1px); }
          100% { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
};

export default Type5;
