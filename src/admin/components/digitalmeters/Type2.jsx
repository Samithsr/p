
import React, { useEffect, useState, useRef } from "react";
import GaugeComponent from "react-gauge-component";
import io from "socket.io-client";

const Type2 = ({
  minValue = -500,
  maxValue = 500,
  unit = "",
  tick = 10,
  tickFontSize = "12px",
  topic,
  adminWidth,
  adminHeight,
  darkColor = false,
  label = "n/a",
}) => {
  const [liveData, setLiveData] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [error, setError] = useState('');
  const socketRef = useRef(null);

  // Validate minValue and maxValue when they change
  useEffect(() => {
    if (minValue >= maxValue) {
      setError('Minimum value must be less than maximum value');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      return; // Exit early if invalid
    }

    // If we get here, values are valid
    // Additional logic can go here if needed
  }, [minValue, maxValue]);

  // Handle socket connection and subscription
  useEffect(() => {
    // Don't connect if values are invalid
    if (minValue >= maxValue) return;

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    // Create new socket connection
    socketRef.current = io("http://13.233.73.61:4000", {
      transports: ["websocket"],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      upgrade: false,
    });

    // Subscribe to topic
    socketRef.current.emit("subscribeToTopic", topic);
    socketRef.current.on("liveMessage", (data) => {
      const value = data?.message?.message?.message ?? 0;
      const boundedValue = Math.min(
        Math.max(value, minValue),
        maxValue
      );
      setLiveData(boundedValue);
    });

    // Cleanup function
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [topic, minValue, maxValue]);

  const generateTicks = (min, max, tickCount) => {
    if (tickCount <= 0) return []; // Prevent invalid tick counts
    const ticks = [];
    const step = (max - min) / tickCount;
    for (let current = min; current <= max; current += step) {
      ticks.push({ value: current });
    }
    return ticks;
  };

  // Don't show anything if values are invalid
  if (minValue >= maxValue) {
    return (
      <div style={{ 
        padding: "20px",
        color: "#ff4d4d",
        textAlign: "center",
        minHeight: "100px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        ⚠️ Minimum value must be less than maximum value
      </div>
    );
  }

  const ticks = generateTicks(minValue, maxValue, tick);

  const valueLabelStyle = {
    fontSize: 24,
    ...(darkColor && { fill: "#000000", color: "#000000" }),
  };

  const tickLabelStyle = {
    fontSize: tickFontSize,
    ...(darkColor && { fill: "#000000", color: "#000000" }),
  };

  // Calculate sub-arcs dynamically to ensure smooth rendering even for small ranges
  // This helps with small max values like 1 by increasing granularity
  const range = maxValue - minValue;
  const nbSubArcs = Math.max(50, Math.min(200, Math.ceil(range / 2))); // Adjust based on range for better precision

  // Show the gauge
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        height: "100%",
        minHeight: "300px",
        position: "relative",
        padding: "10px",
      }}
    >
      <div style={{ 
        textAlign: "center", 
        width: "100%",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
      }}>
        <GaugeComponent
          arc={{
            nbSubArcs: nbSubArcs,
            colorArray: ["#5BE12C", "#F5CD19", "#EA4228"],
            width: 0.3,
            padding: 0.003,
            // gradient: true, // Enable gradient for smoother color transitions in small ranges
            subArcs: [
              { limit: minValue + range * 0.33, color: "#5BE12C" },
              { limit: minValue + range * 0.66, color: "#F5CD19" },
              { limit: maxValue, color: "#EA4228" }
            ]
          }}
          labels={{
            valueLabel: {
              style: valueLabelStyle,
              formatTextValue: () => `${liveData.toFixed(2)} ${unit}`, // Increased precision for small values
              styleText: darkColor ? { fill: "#000000" } : {},
            },
            tickLabels: {
              type: "outer",
              ticks: ticks,
              defaultTickValueConfig: {
                formatTextValue: (tickValue) =>
                  `${tickValue.toFixed(2)} ${unit}`, // Increased precision for small values
                style: tickLabelStyle,
                styleText: darkColor ? { fill: "#000000" } : {},
              },
            },
          }}
          value={liveData}
          maxValue={maxValue}
          minValue={minValue}
          pointer={{
            animationDuration: 0,
            animationDelay: 0,
            color: darkColor ? "#000000" : undefined,
            elastic: true, // Makes pointer more responsive
            width: 0.05, // Adjust pointer width for visibility in small gauges
          }}
        />
        <div
          style={{
            marginBottom: "50px",
            fontSize: "16px",
            fontWeight: "bold",
            color: darkColor ? "#000000" : "white",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
};

export default Type2;