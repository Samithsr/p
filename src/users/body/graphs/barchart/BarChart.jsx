import React, { useState, useEffect } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import apiClient from "../../../../api/apiClient";

// Register necessary Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const BarChart = ({ topic }) => {
  const [todayValue, setTodayData] = useState(0);
  const [yesterdayMax, setYesterdayData] = useState(0);
  const [weekMax, setWeekData] = useState(0);

  const encodedTopic = encodeURIComponent(topic);

  const fetchTodaysHighest = async () => {
    try {
      const res = await apiClient.get(
        `/mqtt/todays-highest?topic=${encodedTopic}`
      );
      setTodayData(res?.data?.message || 0);
    } catch (error) {
      console.error("Error fetching today's highest:", error?.message);
    }
  };

  const fetchYesterdayHighest = async () => {
    try {
      const res = await apiClient.get(
        `/mqtt/yesterdays-highest?topic=${encodedTopic}`
      );
      setYesterdayData(res?.data?.message || 0);
    } catch (error) {
      console.error("Error fetching yesterday's highest:", error?.message);
    }
  };

  const fetchWeeksHighest = async () => {
    try {
      const res = await apiClient.get(
        `/mqtt/last-7-days-highest?topic=${encodedTopic}`
      );
      setWeekData(res?.data?.message || 0);
    } catch (error) {
      console.error("Error fetching week's highest:", error?.message);
    }
  };

  useEffect(() => {
    // Fetch data when the component mounts
    fetchTodaysHighest();
    fetchYesterdayHighest();
    fetchWeeksHighest();

    // Set intervals for subsequent fetches
    const todayInterval = setInterval(fetchTodaysHighest, 60000); // 1 minute
    const yesterdayInterval = setInterval(fetchYesterdayHighest, 43200000); // 12 hours

    // Cleanup intervals on component unmount
    return () => {
      clearInterval(todayInterval);
      clearInterval(yesterdayInterval);
    };
  }, [encodedTopic]);

  const data = {
    labels: ["Week Max", "Yesterday Max", "Today Max"],
    datasets: [
      {
        label: "Values",
        data: [weekMax, yesterdayMax, todayValue],
        backgroundColor: ["#4caf50", "#ff9800", "#2196f3"],
        borderColor: ["#388e3c", "#f57c00", "#1976d2"],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: "Values",
        },
      },
      x: {
        title: {
          display: true,
          text: "Categories",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        position: "top",
      },
    },
  };

  return (
    <div style={{ width: "100%",height:"100%", margin: "0 auto", padding:"20px",display:"flex",justifyContent:"center",alignItems:"center" }}>
      <Bar data={data} options={options} />
    </div>
  );
};

export default BarChart;
