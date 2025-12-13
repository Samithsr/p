import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import { useNavigate } from "react-router-dom";
import apiClient from "../../../../api/apiClient";
import io from "socket.io-client";

// Theme configurations
const themeConfig = {
  light: {
    layout: { backgroundColor: "#ffffff", textColor: "#000000" },
    grid: { vertLines: "#eeeeee", horzLines: "#eeeeee" },
    priceScale: { borderColor: "#cccccc" },
    timeScale: { borderColor: "#cccccc" },
    defaultColor: "rgba(41, 98, 255, 0.3)",
  },
  dark: {
    layout: { backgroundColor: "#2d2d2d", textColor: "#ffffff" },
    grid: { vertLines: "#424242", horzLines: "#424242" },
    priceScale: { borderColor: "#666666" },
    timeScale: { borderColor: "#666666" },
    defaultColor: "rgba(41, 98, 255, 0.3)",
  },
};

const SmallGraph = ({ topic, height, viewgraph }) => {
  const navigate = useNavigate();
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const thresholdLineSeriesRefs = useRef([]);
  const dataWindow = useRef([]);
  const latestTimestamp = useRef(0);
  const currentColorRef = useRef(themeConfig.light.defaultColor);
  const isChartInitialized = useRef(false);
  const [thresholds, setThreshold] = useState([]);
  const [subscribed, setSubscribed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const encodedTopic = encodeURIComponent(topic);
  const socket = useRef(null);
  const TWO_HOURS_IN_SECONDS = 2 * 60 * 60;

  // Format timestamp to IST
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

  // Check if the chart is valid and initialized
  const isChartValid = () => chartRef.current && isChartInitialized.current;

  // Create threshold lines on the chart
  const createThresholdLines = () => {
    if (isChartValid()) {
      thresholdLineSeriesRefs.current.forEach((series) => {
        try {
          chartRef.current.removeSeries(series);
        } catch (error) {
          console.warn("Error removing threshold series:", error);
        }
      });
      thresholdLineSeriesRefs.current = [];
      const currentTime = Math.floor(Date.now() / 1000);
      const startTime = currentTime - TWO_HOURS_IN_SECONDS;
      const endTime = currentTime + 60 * 60;
      thresholds.forEach((threshold) => {
        if (isChartValid()) {
          const thresholdLine = chartRef.current.addLineSeries({
            color: threshold.color,
            lineWidth: 2,
            priceLineVisible: false,
            crosshairMarkerVisible: false,
          });
          const thresholdData = [
            { time: startTime, value: threshold.value },
            { time: endTime, value: threshold.value },
          ];
          thresholdLine.setData(thresholdData);
          thresholdLineSeriesRefs.current.push(thresholdLine);
        }
      });
    }
  };

  // Fetch subscription status
  const fetchSubscriptionApi = async () => {
    try {
      const res = await apiClient.get(`/mqtt/is-subscribed?topic=${encodedTopic}`);
      setSubscribed(res?.data?.isSubscribed);
    } catch (error) {
      console.error("Error fetching subscription status:", error.message);
    }
  };

  // Fetch thresholds for the topic
  const fetchThresholdApi = async () => {
    try {
      const res = await apiClient.get(`/mqtt/get?topic=${topic}`);
      if (res?.data?.data?.thresholds?.length) {
        setThreshold(res?.data?.data?.thresholds);
      } else {
        console.log("No thresholds found for this topic");
      }
    } catch (error) {
      console.log("Error fetching thresholds:", error.message);
    }
  };

  // Fetch initial data for the chart
  const fetchInitialData = async () => {
    try {
      const response = await apiClient.post("/mqtt/realtime-data/last-2-hours", { topic });
      if (response.data && response.data.messages) {
        let historicalData = response.data.messages.map((msg) => ({
          time: Math.floor(new Date(msg.timestamp).getTime() / 1000),
          value: parseFloat(msg.message),
        }));
        historicalData.sort((a, b) => a.time - b.time);
        historicalData = historicalData.filter(
          (dataPoint, index, self) =>
            index === 0 || dataPoint.time > self[index - 1].time
        );
        if (historicalData.length > 0) {
          latestTimestamp.current = historicalData[historicalData.length - 1].time;
          dataWindow.current = historicalData;
          if (isChartValid()) {
            areaSeriesRef.current.setData(historicalData);
            // Removed chartRef.current?.timeScale().fitContent() to prevent fitting all data
          }
        } else {
          dataWindow.current = [];
          if (isChartValid()) {
            areaSeriesRef.current.setData([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
      dataWindow.current = [];
      if (isChartValid()) {
        areaSeriesRef.current.setData([]);
      }
    }
  };

  // Update series color based on thresholds
  const updateSeriesColor = (color) => {
    if (isChartValid()) {
      try {
        areaSeriesRef.current.applyOptions({
          topColor: color,
          bottomColor: "rgba(0, 0, 0, 0)",
          lineColor: color,
        });
      } catch (error) {
        console.warn("Error updating series color:", error);
      }
    }
  };

  // Download chart as PNG
  const downloadImage = () => {
    if (chartRef.current) {
      const canvas = chartContainerRef.current.querySelector("canvas");
      if (canvas) {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = url;
        a.download = `${topic}_${new Date().toISOString()}.png`;
        a.click();
      }
    }
  };

  // Download data as CSV
  const downloadCSV = () => {
    if (dataWindow.current.length > 0) {
      const csvRows = [];
      const headers = ["Timestamp (IST)", "Value"];
      csvRows.push(headers.join(","));
      dataWindow.current.forEach((dataPoint) => {
        const date = new Date(dataPoint.time * 1000);
        const formattedDate = new Date(date).toLocaleString("en-IN", {
          timeZone: "Asia/Kolkata",
          dateStyle: "short",
          timeStyle: "medium",
        });
        const row = [formattedDate, dataPoint.value];
        csvRows.push(row.join(","));
      });
      const csvData = csvRows.join("\n");
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${topic}_${new Date().toISOString()}.csv`;
      a.click();
    }
  };

  // Initialize chart
  useEffect(() => {
    if (!chartRef.current) {
      const theme = isDarkMode ? themeConfig.dark : themeConfig.light;
      chartRef.current = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height,
        layout: {
          background: { color: theme.layout.backgroundColor },
          textColor: theme.layout.textColor,
        },
        grid: {
          vertLines: { color: theme.grid.vertLines },
          horzLines: { color: theme.grid.horzLines },
        },
        priceScale: {
          borderColor: theme.priceScale.borderColor,
          scaleMargins: {
            top: 0.1,
            bottom: 0.1,
          },
        },
        timeScale: {
          borderColor: theme.timeScale.borderColor,
          timeVisible: true,
          secondsVisible: true,
          rightOffset: 20,
          tickMarkFormatter: (timestamp) => formatToIST(timestamp * 1000),
        },
      });
      areaSeriesRef.current = chartRef.current.addAreaSeries({
        topColor: theme.defaultColor,
        bottomColor: "rgba(0, 0, 0, 0)",
        lineColor: theme.defaultColor,
        lineWidth: 2,
      });
      isChartInitialized.current = true;

      const handleResize = () => {
        if (chartRef.current) {
          chartRef.current.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };
      window.addEventListener("resize", handleResize);

      fetchSubscriptionApi();
      fetchThresholdApi();
      fetchInitialData();

      return () => {
        window.removeEventListener("resize", handleResize);
        if (chartRef.current) {
          chartRef.current.remove();
          chartRef.current = null;
          isChartInitialized.current = false;
        }
      };
    }
  }, [height, topic]);

  // Update thresholds when they change
  useEffect(() => {
    if (isChartValid()) {
      createThresholdLines();
    }
  }, [thresholds]);

  useEffect(() => {
    socket.current = io("http://3.107.196.29:4000", {
      // path: "/socket.io/",
      transports: ["websocket"],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      upgrade: false, 
    });

    // socket.current = io("http://localhost:4000", {
    //   path: "/socket.io/",
    //   transports: ["websocket"],
    //   secure: true,
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 5000,
    //   upgrade: false, 
    // });

    socket.current.emit("subscribeToTopic", topic);

    socket.current.on("liveMessage", (data) => {
      if (data.success) {
        const { message, timestamp } = data.message;
        const newPoint = {
          time: Math.floor(new Date(timestamp).getTime() / 1000),
          value: parseFloat(message.message),
        };
        const defaultColor = isDarkMode ? themeConfig.dark.defaultColor : themeConfig.light.defaultColor;
        if (thresholds.length > 0) {
          const sortedThresholds = [...thresholds].sort((a, b) => a.value - b.value);
          let newColor = defaultColor;
          for (let i = sortedThresholds.length - 1; i >= 0; i--) {
            if (newPoint.value > sortedThresholds[i].value) {
              newColor = sortedThresholds[i].color;
              break;
            }
          }
          updateSeriesColor(newColor);
        } else {
          updateSeriesColor(defaultColor);
        }
        if (newPoint.time > latestTimestamp.current) {
          latestTimestamp.current = newPoint.time;
          dataWindow.current.push(newPoint);
          const earliestAllowedTime = newPoint.time - TWO_HOURS_IN_SECONDS;
          dataWindow.current = dataWindow.current.filter(
            (point) => point.time >= earliestAllowedTime
          );
          if (isChartValid()) {
            areaSeriesRef.current.setData(dataWindow.current);
          }
        }
      }
    });

    return () => {
      if (socket.current) {
        socket.current.emit("unsubscribeFromTopic", topic);
        socket.current.disconnect();
        socket.current = null;
      }
    };
  }, [topic, thresholds, isDarkMode]);

  // Update chart theme when Dark Mode changes
  useEffect(() => {
    if (isChartValid()) {
      const theme = isDarkMode ? themeConfig.dark : themeConfig.light;
      chartRef.current.applyOptions({
        layout: {
          background: { color: theme.layout.backgroundColor },
          textColor: theme.layout.textColor,
        },
        grid: {
          vertLines: { color: theme.grid.vertLines },
          horzLines: { color: theme.grid.horzLines },
        },
        priceScale: {
          borderColor: theme.priceScale.borderColor,
        },
        timeScale: {
          borderColor: theme.timeScale.borderColor,
        },
      });
      currentColorRef.current = theme.defaultColor;
      areaSeriesRef.current.applyOptions({
        topColor: theme.defaultColor,
        lineColor: theme.defaultColor,
      });
    }
  }, [isDarkMode]);

  return (
    <div>
      <div
        ref={chartContainerRef}
        style={{
          position: "relative",
          width: "100%",
          height: `${height}px`,
          marginTop: viewgraph && "5px",
        }}
      >
        {viewgraph && (
          <label
            style={{
              position: "absolute",
              top: "10px",
              left: "10px",
              zIndex: 0,
              padding: "8px 12px",
              borderRadius: "6px",
              border: `1px solid ${isDarkMode ? "#666666" : "#cccccc"}`,
              backgroundColor: isDarkMode ? "#2d2d2d" : "#ffffff",
              color: isDarkMode ? "#ffffff" : "#000000",
              fontSize: "14px",
              cursor: "pointer",
              boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              transition: "all 0.3s ease",
            }}
          >
            <input
              type="checkbox"
              checked={isDarkMode}
              onChange={(e) => setIsDarkMode(e.target.checked)}
              style={{ marginRight: "8px", cursor: "pointer" }}
            />
            Dark Mode
          </label>
        )}
      </div>
    </div>
  );
};

export default SmallGraph;