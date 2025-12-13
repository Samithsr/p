import React, { useEffect, useState } from "react";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import io from "socket.io-client";
import "react-circular-progressbar/dist/styles.css";

const Type1 = ({
  topic,
  minValue = -20,
  maxValue = 100,
  unit = "°C",
  label
}) => {
  const [value, setValue] = useState(20);
  const [emoji, setEmoji] = useState("❄️");

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
      const newValue = Math.min(
        Math.max(data.message.message.message, minValue),
        maxValue
      );
      setValue(newValue);
      setEmoji(newValue > 35 ? "🔥" : newValue < 10 ? "❄️" : "🌡️");
    });
    return () => socket.disconnect();
  }, [topic, minValue, maxValue]);

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #1a1a1a, #2d2d2d)",
        padding: "2rem",
        borderRadius: "20px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
        position: "relative",
        width: "90%",
        height: "185px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ position: "absolute", top: 20, left: 20 }}>
        <span style={{ fontSize: "2.5rem" }}>{emoji}</span>
      </div>
      <div style={{ width: "50%", height: "50%" }}>
        <CircularProgressbar
          value={value}
          minValue={minValue}
          maxValue={maxValue}
          text={`${value.toFixed(1)}${unit}`}
          styles={buildStyles({
            pathColor: value > 50 ? "#ff4d4d" : "#4d79ff",
            textColor: "#ffffff",
            trailColor: "rgba(255,255,255,0.1)",
            textSize: "16px",
            pathTransitionDuration: 0.5,
          })}
        />
      </div>
      <div
        style={{
          textAlign: "center",
          color: "#fff",
          marginTop:"4.5rem",
          fontFamily: "'Segoe UI', sans-serif",
          fontSize: "1.2rem",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export default Type1;
