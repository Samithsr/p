import React, { useEffect, useState } from "react";
import io from "socket.io-client";

const Type3 = ({
  topic,
  minValue = 0,
  maxValue = 100,
  unit = "% RH",
  darkColor = false,
  label = "n/a",
}) => {
  const [value, setValue] = useState(50);

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
      const boundedValue = Math.min(
        Math.max(data?.message?.message?.message ?? 0, minValue),
        maxValue
      );
      setValue(boundedValue);
    });
    return () => socket.disconnect();
  }, [topic, minValue, maxValue]);

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          background: "#0f172a",
          padding: "1rem",
          borderRadius: "20px",
          position: "relative",
          overflow: "hidden",
          width: "140px",
          height: "180px",
        }}
      >
        <div
          style={{
            position: "relative",
            height: "150px",
            background: "rgba(255,255,255,0.1)",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: `${value}%`,
              background: "linear-gradient(to top, #3b82f6, #60a5fa)",
              transition: "height 0.3s ease",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                fontSize: "2rem",
                transform: "translateY(30px)",
                opacity: 0.7,
              }}
            >
              💧
            </div>
          </div>
        </div>
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontSize: "1.5rem",
            fontWeight: "bold",
            textShadow: "0 2px 4px rgba(0,0,0,0.5)",
          }}
        >
          {value.toFixed(0)}
          {unit}
        </div>
      </div>

      {/* Label Below the Meter */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          color: darkColor ? "#ffffff" : "white",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default Type3;
