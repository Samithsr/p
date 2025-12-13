import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import apiClient from "../../../../api/apiClient";
import { toZonedTime } from "date-fns-tz";
import './style.css';

const HistoryGraph1M = ({ topic, height, topicLabel }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const thresholdLineSeriesRefs = useRef([]);
  const [graphData, setGraphData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [thresholds, setThresholds] = useState([]);

  // Set date range to last 1 month
  const getDateRange = () => {
    const toDate = new Date();
    const fromDate = new Date();
    fromDate.setMonth(fromDate.getMonth() - 1);
    return { fromDate, toDate };
  };

  const { fromDate, toDate } = getDateRange();
  const granularity = "hours"; // Default granularity for 1 month data

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        const response = await apiClient.get(`/mqtt/get?topic=${topic}`);
        if (response.data?.data?.thresholds) {
          setThresholds(response.data.data.thresholds);
        }
      } catch (error) {
        console.error("Error fetching thresholds:", error);
      }
    };
    fetchThresholds();
  }, [topic]);

  useEffect(() => {
    // Initialize chart
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: { 
        backgroundColor: "#ffffff", 
        textColor: "#000000",
        fontFamily: '"Roboto", sans-serif'
      },
      grid: { 
        vertLines: { color: "#eeeeee" }, 
        horzLines: { color: "#eeeeee" } 
      },
      priceScale: { 
        borderColor: "#cccccc", 
        scaleMargins: { top: 0.1, bottom: 0.1 } 
      },
      timeScale: { 
        borderColor: "#cccccc", 
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 20,
        barSpacing: 10
      },
      crosshair: {
        mode: 1, // CrosshairMode.Normal
        vertLine: {
          width: 2,
          color: 'rgba(41, 98, 255, 0.5)',
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: 'rgba(41, 98, 255, 0.8)'
        },
        horzLine: {
          width: 2,
          color: 'rgba(41, 98, 255, 0.5)',
          style: 2, // LineStyle.Dashed
          labelBackgroundColor: 'rgba(41, 98, 255, 0.8)'
        }
      },
      handleScroll: {
        mouseWheel: true,
        pressedMouseMove: true,
        horzTouchDrag: true,
        vertTouchDrag: true
      },
      handleScale: {
        axisPressedMouseMove: true,
        mouseWheel: true,
        pinch: true
      }
    });

    areaSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: "rgba(41, 98, 255, 0.3)",
      bottomColor: "rgba(41, 98, 255, 0.05)",
      lineColor: "rgba(41, 98, 255, 1)",
      lineWidth: 2,
      priceLineVisible: false,
      lastValueVisible: true,
      priceLineColor: 'rgba(41, 98, 255, 0.5)',
      priceLineWidth: 1,
      priceLineStyle: 2, // LineStyle.Dashed
    });

    const handleResize = () => {
      if (chartRef.current) {
        chartRef.current.applyOptions({ 
          width: chartContainerRef.current.clientWidth 
        });
      }
    };

    window.addEventListener("resize", handleResize);
    fetchGraphData();

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) chartRef.current.remove();
    };
  }, [height]);

  const fetchGraphData = async () => {
    setIsLoading(true);
    try {
      const adjustedFromDate = new Date(fromDate);
      adjustedFromDate.setHours(0, 0, 0, 0);

      const adjustedToDate = new Date(toDate);
      adjustedToDate.setHours(23, 59, 59, 999);

      const response = await apiClient.get(`/mqtt/history`, {
        params: {
          topic,
          from: adjustedFromDate.toISOString(),
          to: adjustedToDate.toISOString(),
          granularity
        }
      });

      const data = response.data.data || [];
      
      // Transform data for the chart
      const formattedData = data.map(item => ({
        time: Math.floor(new Date(item.timestamp).getTime() / 1000),
        value: parseFloat(item.value)
      }));

      setGraphData(formattedData);
      
      if (areaSeriesRef.current) {
        areaSeriesRef.current.setData(formattedData);
        
        // Create threshold lines
        createThresholdLines();
        
        // Set visible range to show the most recent data
        if (formattedData.length > 0) {
          const visibleRange = {
            from: Math.min(...formattedData.map(d => d.time)),
            to: Math.max(...formattedData.map(d => d.time))
          };
          chartRef.current.timeScale().setVisibleRange(visibleRange);
        }
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const createThresholdLines = () => {
    if (!chartRef.current || !thresholds.length) return;

    // Remove existing threshold lines
    thresholdLineSeriesRefs.current.forEach(series => {
      try {
        chartRef.current.removeSeries(series);
      } catch (error) {
        console.warn("Error removing threshold series:", error);
      }
    });
    thresholdLineSeriesRefs.current = [];

    // Add new threshold lines
    thresholds.forEach(threshold => {
      if (!chartRef.current) return;
      
      const thresholdLine = chartRef.current.addLineSeries({
        color: threshold.color || '#FF6B6B',
        lineWidth: 2,
        lineStyle: 2, // Dashed line
        priceLineVisible: false,
        lastValueVisible: true,
        title: `Threshold: ${threshold.value}`,
        priceFormat: {
          type: 'price',
          precision: 2,
          minMove: 0.01,
        }
      });

      if (graphData.length > 0) {
        const startTime = graphData[0].time;
        const endTime = graphData[graphData.length - 1].time;
        
        thresholdLine.setData([
          { time: startTime, value: threshold.value },
          { time: endTime, value: threshold.value }
        ]);
      }

      thresholdLineSeriesRefs.current.push(thresholdLine);
    });
  };

  useEffect(() => {
    if (graphData.length > 0 && areaSeriesRef.current) {
      areaSeriesRef.current.setData(graphData);
      createThresholdLines();
    }
  }, [graphData, thresholds]);

  return (
    <div className="history-graph-container">
      <div className="graph-header">
        <h3>{topicLabel || topic} - Last 1 Month</h3>
        <div className="graph-controls">
          <button 
            onClick={fetchGraphData}
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>
      
      <div 
        ref={chartContainerRef} 
        className="graph-container"
        style={{
          height: `${height}px`,
          position: 'relative',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}
      >
        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        )}
      </div>
      
      <style jsx>{`
        .history-graph-container {
          width: 100%;
          margin: 0 auto;
          padding: 15px;
          background: #f9f9f9;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        
        .graph-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
          padding: 0 10px;
        }
        
        .graph-header h3 {
          margin: 0;
          color: #333;
          font-size: 16px;
          font-weight: 600;
        }
        
        .refresh-button {
          padding: 6px 12px;
          background-color: #2962ff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        
        .refresh-button:hover {
          background-color: #1e4bd9;
        }
        
        .refresh-button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        
        .loading-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(255, 255, 255, 0.8);
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          z-index: 10;
          border-radius: 8px;
        }
        
        .loading-spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          border-radius: 50%;
          border-top: 4px solid #2962ff;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 10px;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default HistoryGraph1M;
