import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import io from "socket.io-client";
import { SketchPicker } from "react-color";

const DualGraphPlot = ({ topic1, topic2, topic3, topic4, topic5, height, width }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const seriesRefs = useRef([]);
  const dataWindows = useRef([[], [], [], [], []]);
  const latestTimestamps = useRef([0, 0, 0, 0, 0]);
  const sockets = useRef([]);
  const isChartInitialized = useRef(false);

  const [showLineShadow, setShowLineShadow] = useState(true);
  const [colors, setColors] = useState([
    { r: 255, g: 0, b: 0 },
    { r: 0, g: 0, b: 255 },
    { r: 0, g: 128, b: 0 },
    { r: 255, g: 165, b: 0 },
    { r: 128, g: 0, b: 128 },
  ]);
  const [showColorPickers, setShowColorPickers] = useState([false, false, false, false, false]);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const getThemeOptions = (darkMode) => ({
    layout: {
      background: { color: darkMode ? "#000000" : "#ffffff" },
      textColor: darkMode ? "#ffffff" : "#000000",
    },
    grid: {
      vertLines: { color: darkMode ? "#333333" : "#eeeeee" },
      horzLines: { color: darkMode ? "#333333" : "#eeeeee" },
    },
    priceScale: { borderColor: darkMode ? "#555555" : "#cccccc" },
    timeScale: { borderColor: darkMode ? "#555555" : "#cccccc" },
  });

  const rgbToString = (rgb, alpha = 1) => `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;

  const formatToIST = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
      timeZone: "Asia/Kolkata",
    });
  };

  useEffect(() => {
    chartRef.current = createChart(chartContainerRef.current, {
      width,
      height,
      ...getThemeOptions(isDarkMode),
      timeScale: {
        timeVisible: true,
        secondsVisible: true,
        rightOffset: 20,
        tickMarkFormatter: (timestamp) => formatToIST(timestamp * 1000),
      },
    });

    [topic1, topic2, topic3, topic4, topic5].forEach((topic, index) => {
      if (topic) {
        seriesRefs.current[index] = chartRef.current.addAreaSeries({
          topColor: showLineShadow ? rgbToString(colors[index], 0.3) : "rgba(0, 0, 0, 0)",
          bottomColor: "rgba(0, 0, 0, 0)",
          lineColor: rgbToString(colors[index]),
          lineWidth: 2,
        });
      }
    });

    isChartInitialized.current = true;

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        isChartInitialized.current = false;
      }
    };
  }, [height, width, topic1, topic2, topic3, topic4, topic5]);

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions(getThemeOptions(isDarkMode));
    }
  }, [isDarkMode]);

  useEffect(() => {
    seriesRefs.current.forEach((series, index) => {
      if (series) {
        series.applyOptions({
          lineColor: rgbToString(colors[index]),
          topColor: showLineShadow ? rgbToString(colors[index], 0.3) : "rgba(0, 0, 0, 0)",
        });
      }
    });
  }, [colors, showLineShadow]);

  const setupSocket = (topic, index) => {
    if (!topic) return;
    // const socket = io("http://65.1.185.30", {
    //   path: "/socket.io/",  
    //   transports: ["websocket", "polling"],
    // });
    const socket = io("http://localhost:4000", {
      path: "/socket.io/",  
      transports: ["websocket", "polling"],
    });
    socket.emit("subscribeToTopic", topic);
    socket.on("liveMessage", (data) => {
      if (data.success) {
        const { message, timestamp } = data.message;
        const newPoint = {
          time: Math.floor(new Date(timestamp).getTime() / 1000),
          value: parseFloat(message.message),
        };
        if (newPoint.time > latestTimestamps.current[index]) {
          latestTimestamps.current[index] = newPoint.time;
          dataWindows.current[index].push(newPoint);
          if (isChartInitialized.current && seriesRefs.current[index]) {
            seriesRefs.current[index].setData(dataWindows.current[index]);
          }
        }
      }
    });
    return socket;
  };

  useEffect(() => {
    sockets.current = [
      setupSocket(topic1, 0),
      setupSocket(topic2, 1),
      setupSocket(topic3, 2),
      setupSocket(topic4, 3),
      setupSocket(topic5, 4),
    ];
    return () => {
      sockets.current.forEach((socket) => socket?.disconnect());
    };
  }, [topic1, topic2, topic3, topic4, topic5]);

  return (
    <div style={{ position: "relative", marginTop:"6px" }}>
      {/* Control Panel */}
      <div
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          zIndex: 100,
          backgroundColor: isDarkMode ? "#333333" : "white",
          color: isDarkMode ? "white" : "black",
          padding: "10px",
          borderRadius: "6px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={showLineShadow}
              onChange={() => setShowLineShadow(!showLineShadow)}
              style={{ marginRight: 5, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14 }}>Show Line Shadow</span>
          </label>

          <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={() => setIsDarkMode(!isDarkMode)}
              style={{ marginRight: 5, cursor: "pointer" }}
            />
            <span style={{ fontSize: 14 }}>Dark Mode</span>
          </label>

          <div
            style={{ display: "flex", alignItems: "center", cursor: "pointer" }}
            onClick={() => setIsPaletteOpen(!isPaletteOpen)}
          >
            <span role="img" aria-label="palette-icon">🎨</span>
            <span style={{ marginLeft: 5, fontSize: 14 }}>Color Palette</span>
          </div>
        </div>

        {isPaletteOpen && (
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 10px)",
              left: 25,
              zIndex: 1000,
              backgroundColor: isDarkMode ? "#333333" : "white",
              color: isDarkMode ? "white" : "black",
              padding: "10px",
              borderRadius: "6px",
              boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
              maxHeight: "359px",
              overflowY: "auto",
            }}
          >
            <button
              style={{
                width: "100%",
                justifyContent: "center",
                background: "transparent",
                border: "none",
                fontSize: "12px",
                cursor: "pointer",
                color: isDarkMode ? "#fff" : "#888",
              }}
              onClick={(e) => {
                e.stopPropagation();
                setIsPaletteOpen(false);
              }}
            >
              ✖️
            </button>
            {[topic1, topic2, topic3, topic4, topic5].map((topic, index) =>
              topic ? (
                <div key={index} style={{ marginBottom: 8 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      cursor: "pointer",
                      paddingRight: "30px",
                    }}
                    onClick={() => {
                      const newPickers = [...showColorPickers];
                      newPickers[index] = !newPickers[index];
                      setShowColorPickers(newPickers);
                    }}
                  >
                    <div
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        backgroundColor: rgbToString(colors[index]),
                        border: "1px solid #ddd",
                      }}
                    />
                    <span style={{ fontSize: 14 }}>{topic.split("|")[0]?.split("/")[2]}</span>
                  </div>
                  {showColorPickers[index] && (
                    <SketchPicker
                      color={colors[index]}
                      onChange={(color) => {
                        const newColors = [...colors];
                        newColors[index] = color.rgb;
                        setColors(newColors);
                      }}
                      disableAlpha={true}
                    />
                  )}
                </div>
              ) : null
            )}
          </div>
        )}
      </div>

      {/* Chart Container */}
      <div ref={chartContainerRef} style={{ width, height }} />
    </div>
  );
};

export default DualGraphPlot;