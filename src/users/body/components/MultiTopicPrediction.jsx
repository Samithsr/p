import React, { useState, useEffect, useRef } from 'react';
import { createChart, CrosshairMode } from 'lightweight-charts';
import apiClient from '../../../api/apiClient';

const MultiTopicPrediction = () => {
  const [topics, setTopics] = useState([]);
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [thresholds, setThresholds] = useState({});
  const [realTimeMode, setRealTimeMode] = useState(false);
  
  const chartContainerRef = useRef();
  const chartRef = useRef();
  const seriesRefs = useRef({});
  const socketRef = useRef(null);

  // Initialize chart
  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 600,
      layout: { backgroundColor: '#ffffff', textColor: '#333' },
      grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: {
        borderColor: '#cccccc',
        timeVisible: true,
        secondsVisible: true,
      },
    });

    chartRef.current = chart;

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current) {
        chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chartRef.current && !chartRef.current._disposed) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
  }, []);

  // Load available topics
  useEffect(() => {
    const loadTopics = async () => {
      try {
        const response = await apiClient.get('/prediction/get-available-topics');
        if (response.data.success) {
          setTopics(response.data.data);
          // Auto-select first 5 topics
          const firstFive = response.data.data.slice(0, 5).map(t => t.topic);
          setSelectedTopics(firstFive);
        }
      } catch (err) {
        setError('Failed to load topics');
        console.error('Error loading topics:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTopics();
  }, []);

  // Load predictions for selected topics
  useEffect(() => {
    if (selectedTopics.length === 0) return;

    const loadPredictions = async () => {
      try {
        const response = await apiClient.get(`/prediction/get-all-predictions?topics=${selectedTopics.join(',')}`);
        if (response.data.success) {
          const predictionsData = {};
          const thresholdsData = {};
          
          response.data.data.forEach(pred => {
            predictionsData[pred.topic] = pred;
            thresholdsData[pred.topic] = pred.threshold;
          });
          
          setPredictions(predictionsData);
          setThresholds(thresholdsData);
          updateChartSeries(predictionsData);
        }
      } catch (err) {
        setError('Failed to load predictions');
        console.error('Error loading predictions:', err);
      }
    };

    loadPredictions();
  }, [selectedTopics]);

  // Setup real-time updates
  useEffect(() => {
    if (!realTimeMode || selectedTopics.length === 0) return;

    const socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000');
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('Connected to socket for real-time predictions');
      selectedTopics.forEach(topic => {
        socket.emit('subscribeToTopic', topic);
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from socket');
    });

    socket.on('mqtt-data', (data) => {
      if (selectedTopics.includes(data.topic)) {
        // Update predictions in real-time
        loadLatestPredictions();
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [realTimeMode, selectedTopics]);

  const updateChartSeries = (predictionsData) => {
    if (!chartRef.current) return;

    // Clear existing series
    Object.values(seriesRefs.current).forEach(series => {
      if (series) chartRef.current.removeSeries(series);
    });
    seriesRefs.current = {};

    // Create series for each selected topic
    Object.entries(predictionsData).forEach(([topic, predData], index) => {
      if (!predData.predictionHistory || predData.predictionHistory.length === 0) return;

      const colors = ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2'];
      const color = colors[index % colors.length];

      // Live data series
      const liveSeries = chartRef.current.addLineSeries({
        color: color,
        lineWidth: 2,
        title: `${predData.label} (Live)`,
      });

      // Predicted data series
      const predSeries = chartRef.current.addLineSeries({
        color: color,
        lineWidth: 1,
        lineStyle: 2, // Dashed
        title: `${predData.label} (Pred)`,
      });

      const liveData = predData.predictionHistory.map(point => ({
        time: point.timestamp,
        value: point.liveValue
      }));

      const predData = predData.predictionHistory.map(point => ({
        time: point.timestamp,
        value: point.predictedValue
      }));

      liveSeries.setData(liveData);
      predSeries.setData(predData);

      seriesRefs.current[`${topic}-live`] = liveSeries;
      seriesRefs.current[`${topic}-pred`] = predSeries;
    });

    // Fit chart to show all data
    chartRef.current.timeScale().fitContent();
  };

  const loadLatestPredictions = async () => {
    try {
      const response = await apiClient.get(`/prediction/get-all-predictions?topics=${selectedTopics.join(',')}`);
      if (response.data.success) {
        setPredictions(response.data.data.reduce((acc, pred) => {
          acc[pred.topic] = pred;
          return acc;
        }, {}));
      }
    } catch (err) {
      console.error('Error loading latest predictions:', err);
    }
  };

  const handleTopicToggle = (topic) => {
    setSelectedTopics(prev => {
      if (prev.includes(topic)) {
        return prev.filter(t => t !== topic);
      } else {
        return [...prev, topic];
      }
    });
  };

  const handleThresholdChange = async (topic, newThreshold) => {
    try {
      await apiClient.put('/prediction/update-thresholds', {
        thresholds: [{ topic, threshold: newThreshold }]
      });

      setThresholds(prev => ({
        ...prev,
        [topic]: newThreshold
      }));

      // Reload predictions
      loadLatestPredictions();
    } catch (err) {
      console.error('Error updating threshold:', err);
      setError('Failed to update threshold');
    }
  };

  const handleBatchThresholdUpdate = async () => {
    try {
      const thresholdUpdates = selectedTopics.map(topic => ({
        topic,
        threshold: thresholds[topic] || 99
      }));

      await apiClient.put('/prediction/update-thresholds', {
        thresholds: thresholdUpdates
      });

      // Reload predictions
      loadLatestPredictions();
    } catch (err) {
      console.error('Error updating thresholds:', err);
      setError('Failed to update thresholds');
    }
  };

  if (loading) {
    return <div>Loading multi-topic predictions...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Multi-Topic Predictions</h2>
      
      {/* Topic Selection */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Select Topics:</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
          {topics.map(topic => (
            <label key={topic.topic} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <input
                type="checkbox"
                checked={selectedTopics.includes(topic.topic)}
                onChange={() => handleTopicToggle(topic.topic)}
              />
              <span>{topic.label}</span>
            </label>
          ))}
        </div>
        
        <button
          onClick={() => setRealTimeMode(!realTimeMode)}
          style={{
            padding: '8px 16px',
            backgroundColor: realTimeMode ? '#52c41a' : '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          {realTimeMode ? 'Real-time ON' : 'Real-time OFF'}
        </button>
        
        <button
          onClick={loadLatestPredictions}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Refresh
        </button>
      </div>

      {/* Threshold Controls */}
      {selectedTopics.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Threshold Settings:</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', alignItems: 'center' }}>
            {selectedTopics.map(topic => {
              const topicData = topics.find(t => t.topic === topic);
              return (
                <div key={topic} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <label>{topicData?.label || topic}:</label>
                  <input
                    type="number"
                    value={thresholds[topic] || 99}
                    onChange={(e) => setThresholds(prev => ({
                      ...prev,
                      [topic]: parseFloat(e.target.value) || 99
                    }))}
                    style={{ width: '80px', padding: '4px' }}
                    step="0.1"
                  />
                </div>
              );
            })}
            <button
              onClick={handleBatchThresholdUpdate}
              style={{
                padding: '6px 12px',
                backgroundColor: '#52c41a',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Update All
            </button>
          </div>
        </div>
      )}

      {/* Prediction Status */}
      {selectedTopics.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <h3>Prediction Status:</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
            {selectedTopics.map(topic => {
              const pred = predictions[topic];
              const topicData = topics.find(t => t.topic === topic);
              
              if (!pred) return null;
              
              return (
                <div key={topic} style={{
                  border: '1px solid #d9d9d9',
                  borderRadius: '4px',
                  padding: '10px',
                  backgroundColor: pred.currentPrediction?.thresholdReached ? '#f6ffed' : '#fff'
                }}>
                  <h4>{topicData?.label || topic}</h4>
                  <p><strong>Threshold:</strong> {pred.threshold}</p>
                  {pred.currentPrediction && (
                    <>
                      <p><strong>Live Value:</strong> {pred.currentPrediction.liveValue?.toFixed(2)}</p>
                      <p><strong>Predicted Value:</strong> {pred.currentPrediction.predictedValue?.toFixed(2)}</p>
                      <p><strong>Status:</strong> {
                        pred.currentPrediction.thresholdReached 
                          ? `Reached at ${pred.currentPrediction.thresholdReachTime}`
                          : pred.currentPrediction.estimatedReachTime || 'Monitoring...'
                      }</p>
                    </>
                  )}
                  <p><strong>Last Updated:</strong> {new Date(pred.lastUpdated).toLocaleString()}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Chart */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Prediction Chart:</h3>
        <div ref={chartContainerRef} style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '4px',
          height: '600px'
        }} />
      </div>
    </div>
  );
};

export default MultiTopicPrediction;
