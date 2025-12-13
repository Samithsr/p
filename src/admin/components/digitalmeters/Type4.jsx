import React, { useEffect, useState } from "react";
import { VictoryPie } from "victory";
import io from "socket.io-client";

const Type4 = ({ topic, minValue = 0, maxValue = 100, unit = "RPM", label = "n/a" }) => {
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

  const percentage = (value / maxValue) * 100;

  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          background: "radial-gradient(circle at center, #2c3e50, #1a252f)",
          padding: ".1rem",
          borderRadius: "50%",
          width: "180px",
          height: "180px",
          position: "relative",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        }}
      >
        <VictoryPie
          width={250}
          height={250}
          data={[
            { x: 1, y: percentage },
            { x: 2, y: 100 - percentage },
          ]}
          innerRadius={80}
          labels={() => null}
          style={{
            data: {
              fill: ({ datum }) => (datum.x === 1 ? "#e74c3c" : "#34495e"),
            },
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
          <div style={{ color: "#fff", fontSize: "2rem", fontWeight: "bold" }}>
            {value.toFixed(0)}
          </div>
          <div style={{ color: "#95a5a6", fontSize: "1rem" }}>{unit}</div>
          <div style={{ color: "#e74c3c", fontSize: "1.5rem", marginTop: "5px" }}>
            {/* ⚡ */}
          </div>
        </div>
      </div>

      {/* Label Below the Meter */}
      <div
        style={{
          marginTop: "8px",
          fontSize: "16px",
          fontWeight: "bold",
          color: "#fff",  // You can adjust this to make it dark mode compatible if needed
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default Type4;
