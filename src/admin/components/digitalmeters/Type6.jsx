import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const Type6 = ({ topic, minValue = 0, maxValue = 100, unit = "", label = "n/a" }) => {
  const [value, setValue] = useState(minValue);

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

  const percentage = ((value - minValue) / (maxValue - minValue)) * 100;

  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "2rem",
        borderRadius: "20px",
        position: "relative",
        width: "300px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
      }}
    >
      <div
        style={{
          position: "relative",
          height: "120px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            width: "200%",
            height: "200%",
            left: "-50%",
            background: `conic-gradient(
            #00ff88 0% ${percentage}%,
            #2a2a2a ${percentage}% 100%
          )`,
            borderRadius: "50%",
            transform: "rotate(-135deg)",
            transition: "background 0.5s ease",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: "10px",
            background: "#1a1a1a",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
          }}
        >
          <div
            style={{ color: "#00ff88", fontSize: "2rem", fontWeight: "bold" }}
          >
            {value.toFixed(0)}
            {unit}
          </div>
          <div style={{ color: "#666", fontSize: "0.9rem" }}></div>
        </div>
      </div>
      {/* Label Below the Value */}
      <div
        style={{
          textAlign: "center",
          marginTop: "10px",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#fff",
        }}
      >
        {label}
      </div>
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          right: "20px",
          fontSize: "1.5rem",
          opacity: 0.8,
        }}
      >
        {percentage > 75 ? "⚠️" : "📊"}
      </div>
    </div>
  );
};

export default Type6;
