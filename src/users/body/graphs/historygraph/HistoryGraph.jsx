import React, { useEffect, useRef, useState } from "react";
import { createChart } from "lightweight-charts";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../../../../api/apiClient";
import "../../components/HistoryGraphPage.css";
import { toZonedTime } from "date-fns-tz";
import { parseISO } from "date-fns";
import './style.css'

const HistoryGraph = ({ topic, height, topicLabel }) => {
  const chartContainerRef = useRef();
  const chartRef = useRef(null);
  const areaSeriesRef = useRef(null);
  const thresholdLineSeriesRefs = useRef([]);
  const [graphData, setGraphData] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // New loading state

  const [fromDate, setFromDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);
    return toZonedTime(yesterday, "Asia/Kolkata");
  });
  const [toDate, setToDate] = useState(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return toZonedTime(today, "Asia/Kolkata");
  });
  const [granularity, setGranularity] = useState("minutes");
  const [minValue, setMinValue] = useState("");
  const [maxValue, setMaxValue] = useState("");
  const [aggregationMethod, setAggregationMethod] = useState("average");
  const [sortOrder, setSortOrder] = useState("asc");
  const [limit, setLimit] = useState("");
  const [startTimeOfDay, setStartTimeOfDay] = useState(null);
  const [endTimeOfDay, setEndTimeOfDay] = useState(null);
  const [thresholds, setThresholds] = useState([]);

  const granularityOptions = ["seconds", "minutes", "hours", "days"];
  const aggregationOptions = ["average", "sum", "min", "max"];
  const sortOrderOptions = ["asc", "desc"];

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
    chartRef.current = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height,
      layout: { backgroundColor: "#ffffff", textColor: "#000000" },
      grid: { vertLines: { color: "#eeeeee" }, horzLines: { color: "#eeeeee" } },
      priceScale: { borderColor: "#cccccc", scaleMargins: { top: 0.1, bottom: 0.1 } },
      timeScale: { borderColor: "#cccccc", timeVisible: true, secondsVisible: true, rightOffset: 20 },
    });

    areaSeriesRef.current = chartRef.current.addAreaSeries({
      topColor: "rgba(41, 98, 255, 0.3)",
      bottomColor: "rgba(0, 0, 0, 0)",
      lineColor: "rgba(41, 98, 255, 0.3)",
      lineWidth: 2,
    });

    const handleResize = () => {
      chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) chartRef.current.remove();
    };
  }, [height]);

  const fetchGraphData = async () => {
    setIsLoading(true); // Start loading
    try {
      const adjustedFromDate = new Date(fromDate);
      adjustedFromDate.setHours(0, 0, 0, 0);

      const adjustedToDate = new Date(toDate);
      adjustedToDate.setHours(23, 59, 59, 999);

      const body = {
        topic,
        from: adjustedFromDate.toISOString(),
        to: adjustedToDate.toISOString(),
        granularity,
        minValue: minValue ? parseFloat(minValue) : undefined,
        maxValue: maxValue ? parseFloat(maxValue) : undefined,
        aggregationMethod,
        sortOrder,
        limit: limit ? parseInt(limit) : undefined,
        startTimeOfDay: startTimeOfDay ? startTimeOfDay.toISOString() : undefined,
        endTimeOfDay: endTimeOfDay ? endTimeOfDay.toISOString() : undefined,
      };
      console.log("Request body:", body);

      const response = await apiClient.post("/mqtt/realtime-data/custom-range", body);
      console.log("API response:", response.data);

      if (response.data.success) {
        const data = response.data.messages
          .map((msg, index) => {
            const timestamp = parseISO(msg.timestamp);
            if (isNaN(timestamp.getTime())) {
              console.log("Invalid timestamp:", msg.timestamp);
              return null;
            }

            const istTimestamp = toZonedTime(timestamp, "Asia/Kolkata");
            const istOffsetSeconds = 5.5 * 60 * 60;

            let unixTimestamp = Math.floor(istTimestamp.getTime() / 1000) - istOffsetSeconds;
            unixTimestamp -= 1 * 60 * 60;

            console.log(
              `Message timestamp: ${msg.timestamp}, IST: ${istTimestamp}, UnixTimestamp: ${unixTimestamp}, Displayed as: ${new Date(
                unixTimestamp * 1000
              ).toISOString()}`
            );

            return {
              rowNo: index + 1,
              time: unixTimestamp,
              value: parseFloat(msg.message),
              timestamp: new Date(unixTimestamp * 1000).toISOString(),
            };
          })
          .filter(Boolean);

        console.log("Data for chart:", data);

        if (data.length > 0) {
          areaSeriesRef.current.setData(data.map(({ time, value }) => ({ time, value })));
          chartRef.current.timeScale().fitContent();
          setGraphData(data);
        } else {
          console.log("No data to plot after mapping");
          areaSeriesRef.current.setData([]);
          setGraphData([]);
        }
      } else {
        console.log("API response not successful:", response.data);
        areaSeriesRef.current.setData([]);
        setGraphData([]);
      }
    } catch (error) {
      console.error("Error fetching graph data:", error);
      areaSeriesRef.current.setData([]);
      setGraphData([]);
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  const downloadCSV = () => {
    if (graphData.length === 0) {
      alert("No data available to download.");
      return;
    }

    const headers = "Row No.,Value,Timestamp\n";
    const rows = graphData
      .map((item) => `${item.rowNo},${item.value},${item.timestamp}`)
      .join("\n");
    const csvContent = headers + rows;

    const currentTimestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `${topicLabel}_${currentTimestamp}.csv`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="_historygraph_wrapper">
      <div className="_historygraph_chart_container" ref={chartContainerRef}>
        {isLoading && (
          <div className="_historygraph_loading_overlay">
            <div className="_historygraph_spinner"></div>
            <p className="_historygraph_loading_text">Fetching Data...</p>
          </div>
        )}
      </div>
      <div className="_historygraph_controls_container">
        <div className="_historygraph_date_filter_row">
          <div className="_historygraph_datepicker_wrapper from-to-date">
            <label className="_historygraph_label">From Date</label>
            <DatePicker
              selected={fromDate}
              onChange={(date) => {
                const newDate = new Date(date);
                newDate.setHours(0, 0, 0, 0);
                setFromDate(newDate);
              }}
              dateFormat="yyyy-MM-dd"
              maxDate={toDate}
              className="_historygraph_datepicker"
              wrapperClassName="_historygraph_datepicker_wrapper_zindex"
            />
          </div>
          <div className="_historygraph_datepicker_wrapper from-to-date">
            <label className="_historygraph_label">To Date</label>
            <DatePicker
              selected={toDate}
              onChange={(date) => {
                const newDate = new Date(date);
                newDate.setHours(23, 59, 59, 999);
                setToDate(newDate);
              }}
              dateFormat="yyyy-MM-dd"
              minDate={fromDate}
              maxDate={new Date()}
              className="_historygraph_datepicker"
              wrapperClassName="_historygraph_datepicker_wrapper_zindex"
            />
          </div>
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Granularity</label>
            <select
              value={granularity}
              onChange={(e) => setGranularity(e.target.value)}
              className="_historygraph_dropdown"
            >
              {granularityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="_historygraph_date_filter_row">
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Min Value</label>
            <input
              type="number"
              value={minValue}
              onChange={(e) => setMinValue(e.target.value)}
              placeholder="Enter min value"
              className="_historygraph_datepicker"
            />
          </div>
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Max Value</label>
            <input
              type="number"
              value={maxValue}
              onChange={(e) => setMaxValue(e.target.value)}
              placeholder="Enter max value"
              className="_historygraph_datepicker"
            />
          </div>
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Aggregation Method</label>
            <select
              value={aggregationMethod}
              onChange={(e) => setAggregationMethod(e.target.value)}
              className="_historygraph_dropdown"
            >
              {aggregationOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="_historygraph_date_filter_row">
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Sort Order</label>
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
              className="_historygraph_dropdown"
            >
              {sortOrderOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
          <div className="_historygraph_filter_selector">
            <label className="_historygraph_label">Limit</label>
            <input
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              placeholder="Enter limit"
              className="_historygraph_datepicker"
            />
          </div>
        </div>
        <div className="_historygraph_date_filter_row">
          <div className="_historygraph_datepicker_wrapper time-of-day">
            <label className="_historygraph_label">Start Time of Day</label>
            <DatePicker
              selected={startTimeOfDay}
              onChange={setStartTimeOfDay}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="HH:mm"
              placeholderText="Select start time"
              className="_historygraph_datepicker"
              wrapperClassName="_historygraph_datepicker_wrapper_zindex"
            />
          </div>
          <div className="_historygraph_datepicker_wrapper time-of-day">
            <label className="_historygraph_label">End Time of Day</label>
            <DatePicker
              selected={endTimeOfDay}
              onChange={setEndTimeOfDay}
              showTimeSelect
              showTimeSelectOnly
              timeIntervals={15}
              timeCaption="Time"
              dateFormat="HH:mm"
              placeholderText="Select end time"
              className="_historygraph_datepicker"
              wrapperClassName="_historygraph_datepicker_wrapper_zindex"
            />
          </div>
        </div>
        <div className="_historygraph_button_group">
          <button className="_historygraph_submit_btn" onClick={fetchGraphData} disabled={isLoading}>
            {isLoading ? "Loading..." : "Apply"}
          </button>
          <button className="_historygraph_download_btn" onClick={downloadCSV} disabled={isLoading}>
            <span className="_historygraph_excel_icon"></span> Download CSV
          </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryGraph;