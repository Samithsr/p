import React, { useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  const [hoveredButton, setHoveredButton] = useState(null);
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "white",
          color: "black",
          borderRadius: "4px",
          padding: "8px",
          border: "none",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        }}
      >
        <p style={{ margin: "4px 0" }}>{`Frequency : ${label}`}</p>
        <p style={{ margin: "4px 0" }}>{`Amplitude : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const StaticPlotGraph = ({ topic, height, dy }) => {
  const [dataPoints, setDataPoints] = useState([]);
  const [xMax, setXMax] = useState(0);
  const [yMax, setYMax] = useState(10);
  const [stepSize, setStepSize] = useState(1); 
  const [visibleRange, setVisibleRange] = useState([0, 100]);
  const [isInitialDataLoaded, setIsInitialDataLoaded] = useState(false);
  const [touchStartPos, setTouchStartPos] = useState({ x: 0, y: 0 });
  const [lastTouchPos, setLastTouchPos] = useState({ x: 0, y: 0 });
  const [pinchStartDistance, setPinchStartDistance] = useState(null);
  const [pinchCenterX, setPinchCenterX] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartRange, setDragStartRange] = useState([0, 0]);

  const chartContainerRef = useRef(null);
  const chartMargins = { left: 20, right: 30, top: 5, bottom: 5 };

  const labels = Array.from({ length: xMax }, (_, i) => (i + 1) * stepSize);
  const chartData = labels.map((x, i) => ({
    x,
    y: dataPoints[i] || 0,
  }));

  useEffect(() => {
    const socket = io("http://3.108.252.186:4000", { transports: ["websocket",'polling'] });

    const handleLiveMessage = (message) => {
      try {
        const parsedData = JSON.parse(message.message.message.message);
        const numericData = parsedData.map(Number);
        const [newYMax, newXMax, initialStepSize, ...newDataPoints] = numericData;

        setYMax(newYMax);
        setXMax(newXMax);
        setDataPoints(newDataPoints);
        setStepSize(initialStepSize); 

        if (!isInitialDataLoaded) {
          setVisibleRange([0, newXMax - 1]);
          setIsInitialDataLoaded(true);
        }
      } catch (error) {
        console.error("Error processing message:", error);
      }
    };

    socket.emit("subscribeToTopic", topic);
    socket.on("liveMessage", handleLiveMessage);

    return () => {
      socket.off("liveMessage", handleLiveMessage);
      socket.disconnect();
    };
  }, [topic, isInitialDataLoaded]);

  useEffect(() => {
    if (xMax === 0) return;
    setVisibleRange(([prevStart, prevEnd]) => [
      Math.max(0, prevStart),
      Math.min(xMax - 1, prevEnd),
    ]);
  }, [xMax]);

  const generateYTicks = useCallback(() => {
    return Array.from({ length: yMax + 1 }, (_, i) => i);
  }, [yMax]);

  const handleZoom = useCallback(
    (event) => {
      event.preventDefault();
      if (!chartContainerRef.current || xMax === 0) return;
      const zoomFactor = event.deltaY > 0 ? 0.8 : 1.2;
      handleZoomLogic(zoomFactor, event.clientX);
    },
    [visibleRange, xMax]
  );

  const handleZoomLogic = useCallback(
    (zoomFactor, clientX) => {
      const [start, end] = visibleRange;
      const currentRangeSize = end - start + 1;
      const newRangeSize = Math.max(
        10,
        Math.min(xMax, Math.round(currentRangeSize * zoomFactor))
      );

      const rect = chartContainerRef.current.getBoundingClientRect();
      const mouseX = clientX - rect.left;

      const plotWidth = rect.width - chartMargins.left - chartMargins.right;
      const adjustedX = mouseX - chartMargins.left;
      const fraction = adjustedX / plotWidth;

      const visibleDataLength = end - start + 1;
      const indexInVisible = Math.round(fraction * (visibleDataLength - 1));
      const targetIndex = start + indexInVisible;

      let newStart = Math.max(0, targetIndex - Math.floor(newRangeSize / 2));
      let newEnd = newStart + newRangeSize - 1;

      if (newEnd >= xMax) {
        newEnd = xMax - 1;
        newStart = Math.max(0, newEnd - newRangeSize + 1);
      }

      setVisibleRange([newStart, newEnd]);
    },
    [visibleRange, xMax]
  );

  const handlePan = useCallback(
    (deltaX) => {
      if (xMax === 0) return;

      const container = chartContainerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const plotWidth = rect.width - chartMargins.left - chartMargins.right;
      const visibleDataPoints = visibleRange[1] - visibleRange[0] + 1;
      const dataPointsPerPixel = visibleDataPoints / plotWidth;
      const shift = -deltaX * dataPointsPerPixel;

      const [start, end] = visibleRange;
      let newStart = Math.max(0, start + shift);
      let newEnd = Math.min(xMax - 1, end + shift);

      if (newEnd - newStart !== end - start) {
        newEnd = newStart + (end - start);
      }

      if (newStart < 0) {
        newStart = 0;
        newEnd = Math.min(xMax - 1, end - start);
      } else if (newEnd >= xMax) {
        newEnd = xMax - 1;
        newStart = Math.max(0, newEnd - (end - start));
      }

      setVisibleRange([newStart, newEnd]);
    },
    [visibleRange, xMax]
  );

  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartPos({ x: touch.clientX, y: touch.clientY });
      setLastTouchPos({ x: touch.clientX, y: touch.clientY });
    } else if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setPinchStartDistance(distance);
      setPinchCenterX((touch1.clientX + touch2.clientX) / 2);
    }
  }, []);

  const handleTouchMove = useCallback(
    (e) => {
      if (!chartContainerRef.current || xMax === 0) return;

      if (e.touches.length === 1) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - lastTouchPos.x;
        const deltaY = touch.clientY - lastTouchPos.y;

        if (Math.abs(deltaX) > Math.abs(deltaY)) {
          e.preventDefault();
          handlePan(deltaX);
        }
        setLastTouchPos({ x: touch.clientX, y: touch.clientY });
      } else if (e.touches.length === 2 && pinchStartDistance !== null) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.hypot(
          touch2.clientX - touch1.clientX,
          touch2.clientY - touch1.clientY
        );
        const scale = currentDistance / pinchStartDistance;
        const centerX = (touch1.clientX + touch2.clientX) / 2;
        handleZoomLogic(scale, centerX);
      }
    },
    [lastTouchPos, pinchStartDistance, handlePan, handleZoomLogic, xMax]
  );

  const handleTouchEnd = useCallback(() => {
    setPinchStartDistance(null);
    setPinchCenterX(null);
  }, []);

  const handleMouseDown = useCallback(
    (event) => {
      setIsDragging(true);
      setDragStartX(event.clientX);
      setDragStartRange(visibleRange);
      event.preventDefault();
    },
    [visibleRange]
  );

  const handleMouseMove = useCallback(
    (event) => {
      if (!isDragging || !chartContainerRef.current) return;

      const deltaX = event.clientX - dragStartX;
      const plotWidth =
        chartContainerRef.current.offsetWidth -
        chartMargins.left -
        chartMargins.right;
      const dataPointsPerPixel =
        (dragStartRange[1] - dragStartRange[0] + 1) / plotWidth;
      const dataPointDelta = deltaX * dataPointsPerPixel;

      const newStart = Math.max(0, dragStartRange[0] - dataPointDelta);
      const newEnd = Math.min(
        xMax - 1,
        dragStartRange[1] - dataPointDelta
      );

      if (newStart !== visibleRange[0] || newEnd !== visibleRange[1]) {
        setVisibleRange([newStart, newEnd]);
      }
    },
    [isDragging, dragStartX, dragStartRange, xMax, visibleRange]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  return (
    <div
      style={{
        height: "100%",
        minHeight: height ? height : "100dvh",
        width: "100%",
        position: "relative",
      }}
    >
      <div
        ref={chartContainerRef}
        style={{
          width: "100%",
          height: height ? height : "calc(100vh - 20px)",
          overflow: "hidden",
          touchAction: "pan-y",
          cursor: isDragging ? "grabbing" : "grab",
          position: "relative",
        }}
        onWheel={handleZoom}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData.slice(visibleRange[0], visibleRange[1] + 1)}
            margin={chartMargins}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              label={{ value: "Frequency(Hz)", position: "insideBottom", dy: 10 }}
              tickFormatter={(value) => value}
            />
            <YAxis
              orientation="right"
              domain={[0, yMax]}
              ticks={generateYTicks()}
              label={{
                value: "Amplitude(Amp)",
                angle: 90,
                position: "insideRight",
                dy: dy ? dy : 0,
              }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="y"
              stroke="darkblue"
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StaticPlotGraph;