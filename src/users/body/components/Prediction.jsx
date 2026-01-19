import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
import apiClient from '../../../api/apiClient';
import { io } from 'socket.io-client';
import { useLocation } from 'react-router-dom';

const Prediction = () => {
  const chartContainerRef = useRef();
  const chart = useRef();
  const liveSeries = useRef();
  const predictiveSeries = useRef();
  const thresholdLine = useRef();
  const baseData = useRef([]);
  const predictiveData = useRef([]);

  const [threshold, setThreshold] = useState(99);
  const [thresholdReachTime, setThresholdReachTime] = useState(null);
  const [timeFrame, setTimeFrame] = useState('2H');
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredButton, setHoveredButton] = useState(null);

  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const topic = queryParams.get('topic') || '';

  const formatDate = (date) => Math.floor(new Date(date).getTime() / 1000);

  // === DATABASE FUNCTIONS ===
  const savePredictionToDatabase = async (liveValue, predictedValue, timestamp, thresholdReached = false, thresholdReachTime = null, estimatedReachTime = null) => {
    try {
      const response = await apiClient.post('/prediction/save-prediction', {
        topic,
        liveValue,
        predictedValue,
        threshold,
        timestamp,
        thresholdReached,
        thresholdReachTime,
        estimatedReachTime
      });
      
      console.log('Prediction saved to database:', response.data);
    } catch (error) {
      console.error('Error saving prediction to database:', error);
    }
  };

  const saveBatchPredictionsToDatabase = async (predictions) => {
    try {
      const response = await apiClient.post('/prediction/save-batch-predictions', {
        topic,
        predictions,
        threshold
      });
      
      console.log('Batch predictions saved to database:', response.data);
    } catch (error) {
      console.error('Error saving batch predictions to database:', error);
    }
  };

  const loadPredictionFromDatabase = async () => {
    try {
      const response = await apiClient.get(`/prediction/get-prediction/${encodeURIComponent(topic)}`);
      
      if (response.data.success && response.data.data) {
        const predictionData = response.data.data;
        setThreshold(predictionData.threshold || 99);
        
        // Load prediction history if available
        if (predictionData.predictionHistory && predictionData.predictionHistory.length > 0) {
          const historyData = predictionData.predictionHistory.map(point => ({
            time: point.timestamp,
            value: point.predictedValue
          }));
          predictiveData.current = historyData;
          if (predictiveSeries.current) {
            predictiveSeries.current.setData(historyData);
          }
        }

        // Set current prediction info
        if (predictionData.currentPrediction) {
          const { thresholdReached, thresholdReachTime, estimatedReachTime } = predictionData.currentPrediction;
          if (thresholdReachTime) {
            setThresholdReachTime(thresholdReachTime);
          } else if (estimatedReachTime) {
            setThresholdReachTime(estimatedReachTime);
          }
        }
      }
    } catch (error) {
      console.error('Error loading prediction from database:', error);
    }
  };

  const toUnixSeconds = (input) => {
    if (input === null || input === undefined) return null;
    if (typeof input === 'number' && Number.isFinite(input)) return Math.floor(input);
    if (typeof input === 'string') {
      const asNum = Number(input);
      if (Number.isFinite(asNum)) return Math.floor(asNum);
      const d = new Date(input);
      const ms = d.getTime();
      return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
    }
    if (input instanceof Date) {
      const ms = input.getTime();
      return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
    }
    if (typeof input === 'object') {
      if (Object.prototype.hasOwnProperty.call(input, 'time')) return toUnixSeconds(input.time);
      if (Object.prototype.hasOwnProperty.call(input, 'timestamp')) return toUnixSeconds(input.timestamp);
      if (
        Object.prototype.hasOwnProperty.call(input, 'year') &&
        Object.prototype.hasOwnProperty.call(input, 'month') &&
        Object.prototype.hasOwnProperty.call(input, 'day')
      ) {
        const d = new Date(Date.UTC(input.year, input.month - 1, input.day));
        const ms = d.getTime();
        return Number.isFinite(ms) ? Math.floor(ms / 1000) : null;
      }
    }
    return null;
  };

  const normalizePoints = (points) => {
    const mapped = (Array.isArray(points) ? points : [])
      .map((p) => {
        if (!p) return null;
        const t = toUnixSeconds(p.time ?? p.timestamp);
        const v = Number(p.value ?? p.message);
        if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
        return { time: t, value: v };
      })
      .filter(Boolean)
      .sort((a, b) => a.time - b.time);

    const out = [];
    for (const p of mapped) {
      if (out.length === 0 || p.time > out[out.length - 1].time) {
        out.push(p);
      } else if (p.time === out[out.length - 1].time) {
        out[out.length - 1] = p;
      }
    }
    return out;
  };

  const normalizeTimeFrame = (tf) => {
    if (tf === '2H') return '2h';
    if (tf === '8H') return '8h';
    return tf;
  };

  const timeframeToSeconds = (tf) => {
    switch (tf) {
      case '2H':
        return 7200;
      case '8H':
        return 28800;
      case '1D':
        return 86400;
      case '1W':
        return 604800;
      case '1M':
        return 2592000;
      case '2h':
      default:
        return 7200;
    }
  };

  const socket = useRef();
  // === FETCH INITIAL DATA (PER TOPIC) ===
  const fetchInitialData = useCallback(
    async (tf) => {
      if (!topic) return;
      try {
        setIsLoading(true);
        setError(null);

        const effectiveTf = tf ?? '2H';
        const normalizedTf = normalizeTimeFrame(effectiveTf);

        let history = [];
        if (effectiveTf === '2H') {
          const toDate = new Date();
          const fromDate = new Date(toDate.getTime() - 2 * 60 * 60 * 1000);
          const body = {
            topic,
            from: fromDate.toISOString(),
            to: toDate.toISOString(),
            granularity: 'seconds',
            sortOrder: 'asc',
            limit: 10000,
            aggregationMethod: 'average',
          };

          const rangeRes = await apiClient.post('/mqtt/realtime-data/custom-range', body);
          if (rangeRes.data?.success && Array.isArray(rangeRes.data.messages)) {
            history = rangeRes.data.messages
              .map((m) => {
                const t = toUnixSeconds(m.timestamp);
                const v = Number(m.message);
                if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
                return { time: t, value: v };
              })
              .filter(Boolean);
          }
        }

        const limit = normalizedTf === '1M' ? 10000 : normalizedTf === '1W' ? 8000 : normalizedTf === '1D' ? 5000 : (normalizedTf === '2h' || normalizedTf === '2H' || normalizedTf === '8H') ? 10000 : 2000;

        const response = await apiClient.get(
          `/mqtt/prediction/${encodeURIComponent(topic)}?timeframe=${encodeURIComponent(normalizedTf)}&limit=${limit}`
        );

        const { historyGraphData, predictionGraphData, predictions, historical } = response.data.data;

        const apiHistoryRaw = Array.isArray(historyGraphData) ? historyGraphData : (Array.isArray(historical) ? historical : []);
        const predictionBaseRaw = Array.isArray(predictionGraphData) ? predictionGraphData : [];

        const apiHistory = apiHistoryRaw
          .map((p) => {
            const t = toUnixSeconds(p?.time ?? p?.timestamp);
            const v = Number(p?.value ?? p?.message);
            if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
            return { time: t, value: v };
          })
          .filter(Boolean);

        const predictionBase = predictionBaseRaw
          .map((p) => {
            const t = toUnixSeconds(p?.time ?? p?.timestamp);
            const v = Number(p?.value ?? p?.message);
            if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
            return { time: t, value: v };
          })
          .filter(Boolean);

        if (history.length === 0) history = apiHistory;

        const sortedHistory = normalizePoints(history);

        const sortedPredictionBase = [...predictionBase]
          .sort((a, b) => a.time - b.time)
          .filter((p, i, arr) => i === 0 || p.time > arr[i - 1].time);

        const normalizedPredictions = (Array.isArray(predictions) ? predictions : [])
          .map((p) => {
            const t = toUnixSeconds(p?.time ?? p?.timestamp);
            const v = Number(p?.value ?? p?.message);
            if (!Number.isFinite(t) || !Number.isFinite(v)) return null;
            return { time: t, value: v };
          })
          .filter(Boolean);

        baseData.current = sortedHistory;
        predictiveData.current = normalizePoints([...sortedPredictionBase, ...normalizedPredictions]);

        if (chart.current) {
          if (sortedHistory.length > 0) {
            liveSeries.current.setData(normalizePoints(sortedHistory));
            predictiveSeries.current.setData(normalizePoints(predictiveData.current));
            updateThresholdLine();
            estimateThresholdReachTime();
          }
          const windowSeconds = timeframeToSeconds(effectiveTf);
          const lastDataTime = sortedHistory.length > 0 ? sortedHistory[sortedHistory.length - 1].time : Math.floor(Date.now() / 1000);
          chart.current.timeScale().setVisibleRange({
            from: lastDataTime - windowSeconds,
            to: lastDataTime + 300,
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data for this topic');
      } finally {
        setIsLoading(false);
      }
    },
    [topic]
  );

  // === LOAD PREDICTION DATA FROM DATABASE ===
  useEffect(() => {
    if (topic) {
      loadPredictionFromDatabase();
    }
  }, [topic]);

  // === SAFE THRESHOLD LINE UPDATE ===
  const updateThresholdLine = () => {
    if (!thresholdLine.current || baseData.current.length === 0) {
      thresholdLine.current?.setData([]);
      return;
    }

    const data = baseData.current;
    let start = data[0].time;
    let end = data[data.length - 1].time;

    // Handle single point or same time
    if (data.length === 1 || start >= end) {
      const now = Math.floor(Date.now() / 1000);
      if (now > start) {
        end = now;
      } else {
        thresholdLine.current.setData([]);
        return;
      }
    }

    // Only set if start < end
    if (start < end) {
      thresholdLine.current.setData([
        { time: start, value: threshold },
        { time: end, value: threshold },
      ]);
    }
  };

  // === TIMEFRAME CHANGE ===
  const handleTimeFrameChange = async (newTimeFrame) => {
    if (isLoading) return;
    setTimeFrame(newTimeFrame);
    try {
      await fetchInitialData(newTimeFrame);
    } catch (err) {
      console.error('Error changing time frame:', err);
      setError('Failed to update time frame');
    } 
  };

  // === SOCKET.IO SETUP ===
  useEffect(() => {
  if (!topic) return;

  const socketInstance = io('http://localhost:4000', {
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay: 5000,
  });

  socket.current = socketInstance;

  socketInstance.on('connect', () => {
    setIsConnected(true);
    socketInstance.emit('subscribeToTopic', topic);
  });

  socketInstance.on('disconnect', () => setIsConnected(false));
  // socketInstance.on('connect_error', () => setError('Connection failed'));

  return () => {
    socketInstance.emit('unsubscribeFromTopic', topic);
    socketInstance.disconnect();
  };
}, [topic]);

  // === LIVE DATA HANDLER ===
  useEffect(() => {
    if (!socket.current) return;

    const handleLiveData = (data) => {
      if (!data.success) return;

      const rawMessage = data.message?.message?.message || data.message?.message || data.message;
      const timestamp = data.message?.timestamp || new Date().toISOString();
      const value = parseFloat(rawMessage);
      if (isNaN(value)) return;

      const time = toUnixSeconds(timestamp);
      if (!Number.isFinite(time)) return;

      // Ensure our in-memory arrays are always numeric + ascending before we compare/update
      baseData.current = normalizePoints(baseData.current);
      predictiveData.current = normalizePoints(predictiveData.current);

      if (baseData.current.length > 0 && typeof baseData.current[baseData.current.length - 1]?.time !== 'number') {
        baseData.current = normalizePoints(baseData.current);
        if (liveSeries.current) {
          liveSeries.current.setData(baseData.current);
        }
      }

      // === PREVENT DUPLICATE OR OUT-OF-ORDER TIME ===
      const lastTimeRaw = baseData.current.length > 0
        ? baseData.current[baseData.current.length - 1].time
        : 0;
      const lastTime = toUnixSeconds(lastTimeRaw) ?? 0;

      if (time <= lastTime) return; // Skip

      const newPoint = { time, value };
      baseData.current.push(newPoint);
      if (liveSeries.current) liveSeries.current.update(newPoint);

      // === SIMPLE PREDICTION (TREND + NOISE) ===
      const last5 = baseData.current.slice(-5).map(p => p.value);
      const avg = last5.reduce((a, b) => a + b, 0) / last5.length;
      const trend = last5.length > 1 ? last5[last5.length - 1] - last5[0] : 0;
      const prediction = value + trend * 0.5 + (Math.random() - 0.5) * 2;

      // IMPORTANT: predictive series already contains future points (from API predictions).
      // If we update using the current live timestamp, it can be "older" than the last predicted point.
      // So we always append at a time strictly greater than the last predictive point.
      const lastPredTimeRaw =
        predictiveData.current.length > 0 ? predictiveData.current[predictiveData.current.length - 1].time : time;
      const lastPredTime = toUnixSeconds(lastPredTimeRaw) ?? time;
      const nextPredTime = Math.max(lastPredTime, time) + 1;

      const predPoint = { time: nextPredTime, value: prediction };
      predictiveData.current.push(predPoint);
      if (predictiveSeries.current) predictiveSeries.current.update(predPoint);

      // === UPDATE THRESHOLD & ESTIMATE ===
      updateThresholdLine();
      
      // Check if threshold is reached in current prediction
      let thresholdReached = false;
      let thresholdReachTimeStr = null;
      let estimatedReachTimeStr = null;
      
      if (prediction >= threshold) {
        thresholdReachTimeStr = `Threshold reached at ${new Date(time * 1000).toLocaleTimeString()}`;
        setThresholdReachTime(thresholdReachTimeStr);
        thresholdReached = true;
      } else {
        // Only update estimate if we haven't reached threshold yet
        estimateThresholdReachTime();
        // Get the current threshold reach time state for saving
        thresholdReachTimeStr = thresholdReachTime;
        estimatedReachTimeStr = thresholdReachTime;
      }

      // === SAVE PREDICTION TO DATABASE ===
      savePredictionToDatabase(value, prediction, time, thresholdReached, thresholdReachTimeStr, estimatedReachTimeStr);

      const windowSeconds = timeframeToSeconds(timeFrame);
      const cutoff = time - windowSeconds;

      let historyTrimmed = false;
      while (baseData.current.length > 0 && baseData.current[0].time < cutoff) {
        baseData.current.shift();
        historyTrimmed = true;
      }
      if (historyTrimmed && liveSeries.current) {
        baseData.current = normalizePoints(baseData.current);
        liveSeries.current.setData(baseData.current);
      }

      const predictionCutoff = time - 7200;
      const beforeLen = predictiveData.current.length;
      predictiveData.current = predictiveData.current.filter((p) => p.time >= predictionCutoff);
      if (predictiveSeries.current && predictiveData.current.length !== beforeLen) {
        predictiveData.current = normalizePoints(predictiveData.current);
        predictiveSeries.current.setData(predictiveData.current);
      }
    };

    socket.current.on('liveMessage', handleLiveData);

    return () => socket.current.off('liveMessage', handleLiveData);
  }, [threshold, timeFrame]);

  // === ESTIMATE THRESHOLD REACH TIME ===
  const estimateThresholdReachTime = () => {
    const data = predictiveData.current;
    if (data.length < 2) return;

    // Check if we already reached the threshold
    const lastPoint = data[data.length - 1];
    if (lastPoint.value >= threshold) {
      setThresholdReachTime(`Reached at ${new Date(lastPoint.time * 1000).toLocaleTimeString()}`);
      return;
    }

    // Use linear regression to estimate when threshold will be reached
    const last10 = data.slice(-10); // Use more points for better accuracy
    const x = last10.map(p => p.time);
    const y = last10.map(p => p.value);

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, val, i) => a + val * y[i], 0);
    const sumX2 = x.reduce((a, val) => a + val * val, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (slope <= 0) {
      // If not trending up, clear the estimate
      setThresholdReachTime('Not expected to reach threshold');
      return;
    }

    // Calculate estimated time to reach threshold
    const currentTime = x[x.length - 1];
    const currentValue = y[y.length - 1];
    const timeToReach = (threshold - currentValue) / slope;
    const reachTime = new Date((currentTime + timeToReach) * 1000);

    // Only show if in the future and not too far (within 24 hours)
    const now = new Date();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    
    let estimateStr = '';
    if (reachTime > now && (reachTime - now) < oneDayInMs) {
      estimateStr = `Estimated to reach at ${reachTime.toLocaleTimeString()}`;
      setThresholdReachTime(estimateStr);
    } else if (reachTime > now) {
      estimateStr = 'Estimated to reach in more than 24 hours';
      setThresholdReachTime(estimateStr);
    } else {
      estimateStr = 'Not expected to reach threshold';
      setThresholdReachTime(estimateStr);
    }

    // Save estimate to database if we have live data
    if (baseData.current.length > 0) {
      const lastPoint = baseData.current[baseData.current.length - 1];
      const lastPredPoint = data[data.length - 1];
      savePredictionToDatabase(lastPoint.value, lastPredPoint.value, lastPredPoint.time, false, null, estimateStr);
    }
  };


  // === THRESHOLD CHANGE ===
  const handleThresholdChange = (e) => {
    const val = parseFloat(e.target.value);
    if (!isNaN(val)) {
      setThreshold(val);
      updateThresholdLine();
      estimateThresholdReachTime();
      
      // Save threshold change to database
      if (baseData.current.length > 0) {
        const lastPoint = baseData.current[baseData.current.length - 1];
        savePredictionToDatabase(lastPoint.value, lastPoint.value, lastPoint.time, false, null, thresholdReachTime);
      }
    }
  };

  // === CHART INITIALIZATION ===
  useEffect(() => {
    if (!topic) return;
    chart.current = createChart(chartContainerRef.current, {
      width: 1200,
      height: 400,
      layout: { backgroundColor: '#ffffff', textColor: '#333' },
      grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
      crosshair: { mode: CrosshairMode.Normal },
      timeScale: { timeVisible: true, secondsVisible: true },
    });

    liveSeries.current = chart.current.addLineSeries({
      color: '#1890ff',
      lineWidth: 2,
      title: 'Live Data',
    });

    predictiveSeries.current = chart.current.addLineSeries({
      color: '#FF6B6B',
      lineWidth: 2,
      lineStyle: LineStyle.Dashed,
      title: 'Predicted',
    });

    thresholdLine.current = chart.current.addLineSeries({
      color: '#FF4D4F',
      lineWidth: 2,
      lineStyle: LineStyle.Dotted,
      title: 'Threshold',
    });

    // Start empty
    thresholdLine.current.setData([]);
   
    setTimeFrame('2H');
    fetchInitialData('2H');

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.current.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart.current && !chart.current._disposed) {
        chart.current.remove();
        chart.current = null;
      }
    };
  }, [topic]);

  const getButtonStyle = (tf) => ({
    padding: '4px 12px',
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    backgroundColor: timeFrame === tf ? '#1890ff' : hoveredButton === tf ? '#f5f5f5' : 'white',
    color: timeFrame === tf ? 'white' : 'rgba(0,0,0,0.85)',
    cursor: isLoading ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s',
  });

  return (
    <div style={{ width: '100%', padding: '20px', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <div style={{ width: '1200px', minHeight: '600px', backgroundColor: 'white', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0, color: '#333' }}>Prediction Chart: {topic || 'No Topic'}</h3>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* <span>Threshold:</span> */}
              {/* <input
                type="number"
                type="number"
                value={threshold}
                value={threshlod}
                value={threshold}
                type="number"
                type="number"
                type="number"
                type="number"
                type="number"
                type="number"
                value={threshold}
                value={threshold}
                onChange={handleThresholdChange}
                onChange={handleThresholdChange}
                style={{ width: '80px', padding: '4px 8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}
                step={0.1}
              /> */}
            </div>

            {thresholdReachTime && (
              <div style={{
                backgroundColor: thresholdReachTime.includes('reached') ? '#f6ffed' : '#fffbe6',
                border: thresholdReachTime.includes('reached') ? '1px solid #b7eb8f' : '1px solid #ffe58f',
                borderRadius: '4px',
                padding: '6px 12px',
                fontSize: '14px',
                color: thresholdReachTime.includes('reached') ? '#389e0d' : '#d48806',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: thresholdReachTime.includes('reached') ? '#52c41a' : '#faad14',
                  flexShrink: 0
                }}></span>
                {thresholdReachTime}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            {['2H', '8H', '1D', '1W', '1M'].map((tf) => (
              <button
                key={tf}
                onClick={() => handleTimeFrameChange(tf)}
                disabled={isLoading}
                style={getButtonStyle(tf)}
                onMouseEnter={() => setHoveredButton(tf)}
                onMouseLeave={() => setHoveredButton(null)}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px', fontSize: '14px' }}>
          <p style={{ margin: '8px 0' }}>
            Live data from MQTT via Socket.IO. Format:{' '}
            <code style={{ background: '#f0f0f0', padding: '2px 4px', borderRadius: '3px', fontFamily: 'monospace' }}>
              {'{'} "success": true, "message": {'{'} "message": "123.45", "timestamp": "2025-..." {'}} {'}'
            </code>
          </p>
          <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
            <li><span style={{ color: '#1890ff' }}>Blue</span> – Live Value</li>
            <li><span style={{ color: '#FF6B6B' }}>Red Dashed</span> – Predicted</li>
            <li><span style={{ color: '#FF4D4F' }}>Red Dotted</span> – Threshold ({threshold})</li>
          </ul>
        </div>

        <div ref={chartContainerRef} style={{ width: '100%', height: '400px' }} />

        <div style={{ marginTop: '10px', fontSize: '12px', color: isConnected ? '#389e0d' : '#d4380d' }}>
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>

        {error && (
          <div style={{ marginTop: '10px', color: '#d4380d', backgroundColor: '#fff2f0', padding: '8px', borderRadius: '4px', fontSize: '14px' }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Prediction;











// import React, {
//   useEffect,
//   useRef,
//   useState,
//   useCallback,
//   useMemo,
// } from 'react';
// import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts';
// import axios from 'axios';
// import { io } from 'socket.io-client';
// import { useLocation } from 'react-router-dom';

// const Prediction = () => {
//   const chartContainerRef = useRef();
//   const chart = useRef(null);
//   const liveSeries = useRef(null);
//   const predictiveSeries = useRef(null);
//   const thresholdLine = useRef(null);

//   // Historical data (real points)
//   const baseData = useRef([]);
//   // Historical + predicted points (what the dashed line shows)
//   const predictiveData = useRef([]);

//   const [threshold, setThreshold] = useState(99);
//   const [thresholdReachTime, setThresholdReachTime] = useState(null);
//   const [timeFrame, setTimeFrame] = useState('2h');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isConnected, setIsConnected] = useState(false);
//   const [error, setError] = useState(null);
//   const [hoveredButton, setHoveredButton] = useState(null);

//   const location = useLocation();
//   const queryParams = new URLSearchParams(location.search);
//   const topic = queryParams.get('topic') || '';

//   // ------------------------------------------------------------------
//   // Helper – linear regression on an array of {time, value}
//   // ------------------------------------------------------------------
//   const linearRegression = useCallback((points) => {
//     if (points.length < 2) return { slope: 0, intercept: 0 };

//     const n = points.length;
//     const sumX = points.reduce((s, p) => s + p.time, 0);
//     const sumY = points.reduce((s, p) => s + p.value, 0);
//     const sumXY = points.reduce((s, p) => s + p.time * p.value, 0);
//     const sumX2 = points.reduce((s, p) => s + p.time * p.time, 0);

//     const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
//     const intercept = (sumY - slope * sumX) / n;

//     return { slope, intercept };
//   }, []);

//   // ------------------------------------------------------------------
//   // Predict next value (moving-average + trend)
//   // ------------------------------------------------------------------
//   const predictNextValue = useCallback(() => {
//     const recent = baseData.current.slice(-10); // last 10 points give a stable trend
//     if (recent.length < 2) return recent[recent.length - 1]?.value || 0;

//     const { slope } = linearRegression(recent);
//     const last = recent[recent.length - 1];

//     // simple extrapolation + a little smoothing
//     return last.value + slope * 60; // 60 seconds into the future (you can tune this)
//   }, [linearRegression]);

//   // ------------------------------------------------------------------
//   // Estimate when the threshold will be crossed
//   // ------------------------------------------------------------------
//   const estimateThresholdReachTime = useCallback(() => {
//     const points = predictiveData.current;
//     if (points.length < 2) {
//       setThresholdReachTime(null);
//       return;
//     }

//     const last = points[points.length - 1];
//     if (last.value >= threshold) {
//       setThresholdReachTime(
//         `Threshold reached at ${new Date(last.time * 1000).toLocaleTimeString()}`
//       );
//       return;
//     }

//     const { slope } = linearRegression(points.slice(-20)); // more points → better slope

//     if (slope <= 0) {
//       setThresholdReachTime('Not trending toward threshold');
//       return;
//     }

//     const secondsToReach = (threshold - last.value) / slope;
//     const reachTimestamp = last.time + secondsToReach;
//     const reachDate = new Date(reachTimestamp * 1000);
//     const now = Date.now();

//     if (reachTimestamp * 1000 < now) {
//       setThresholdReachTime('Not expected to reach threshold');
//       return;
//     }

//     const diffMs = reachDate - now;
//     const oneDay = 24 * 60 * 60 * 1000;

//     if (diffMs > oneDay) {
//       setThresholdReachTime('Will reach in more than 24 h');
//     } else {
//       setThresholdReachTime(`Estimated: ${reachDate.toLocaleTimeString()}`);
//     }
//   }, [threshold, linearRegression]);

//   // ------------------------------------------------------------------
//   // Update the horizontal threshold line
//   // ------------------------------------------------------------------
//   const updateThresholdLine = useCallback(() => {
//     if (!thresholdLine.current) return;

//     const data = baseData.current;
//     if (data.length === 0) {
//       thresholdLine.current.setData([]);
//       return;
//     }

//     const start = data[0].time;
//     const end =
//       data.length > 1 ? data[data.length - 1].time : Math.floor(Date.now() / 1000) + 60;

//     thresholdLine.current.setData([
//       { time: start, value: threshold },
//       { time: end, value: threshold },
//     ]);
//   }, [threshold]);

//   // ------------------------------------------------------------------
//   // Fetch historical data for a given timeframe
//   // ------------------------------------------------------------------
//   const fetchInitialData = useCallback(
//     async (tf = timeFrame) => {
//       if (!topic) return;
//       try {
//         setIsLoading(true);
//         setError(null);

//         const { data } = await axios.get(
//           `/mqtt/prediction/${encodeURIComponent(topic)}?timeframe=${tf}`
//         );

//         const { historical, predictions } = data.data;

//         const sorted = [...historical]
//           .sort((a, b) => a.time - b.time)
//           .filter((v, i, a) => i === 0 || v.time !== a[i - 1].time);

//         baseData.current = sorted;
//         predictiveData.current = [...sorted, ...predictions];

//         if (liveSeries.current) liveSeries.current.setData(sorted);
//         if (predictiveSeries.current) predictiveSeries.current.setData(predictiveData.current);

//         updateThresholdLine();
//         estimateThresholdReachTime();
//       } catch (err) {
//         console.error(err);
//         setError('Failed to load data');
//       } finally {
//         setIsLoading(false);
//       }
//     },
//     [topic, timeFrame, updateThresholdLine, estimateThresholdReachTime]
//   );

//   // ------------------------------------------------------------------
//   // Socket.IO – live updates
//   // ------------------------------------------------------------------
//   const socket = useRef(null);

//   useEffect(() => {
//     if (!topic) return;

//     socket.current = io('http://localhost:4000', {
//       transports: ['websocket'],
//       reconnectionAttempts: 5,
//     });

//     socket.current.on('connect', () => {
//       setIsConnected(true);
//       socket.current.emit('subscribeToTopic', topic);
//     });
//     socket.current.on('disconnect', () => setIsConnected(false));
//     socket.current.on('connect_error', () => setError('Socket connection error'));

//     return () => {
//       socket.current?.emit('unsubscribeFromTopic', topic);
//       socket.current?.disconnect();
//     };
//   }, [topic]);

//   // Live message handler
//   useEffect(() => {
//     if (!socket.current) return;

//     const handler = (payload) => {
//       const raw = payload?.message?.message?.message || payload?.message?.message || payload?.message;
//       const ts = payload?.message?.timestamp || new Date().toISOString();
//       const val = parseFloat(raw);
//       if (isNaN(val)) return;

//       const time = Math.floor(new Date(ts).getTime() / 1000);

//       // ---- avoid duplicates / out-of-order ----
//       const lastTime = baseData.current[baseData.current.length - 1]?.time || 0;
//       if (time <= lastTime) return;

//       const newPoint = { time, value: val };
//       baseData.current.push(newPoint);
//       liveSeries.current?.update(newPoint);

//       // ---- prediction (average + trend) ----
//       const predictedValue = predictNextValue();
//       const predPoint = { time, value: predictedValue };
//       predictiveData.current.push(predPoint);
//       predictiveSeries.current?.update(predPoint);

//       // ---- keep chart tidy ----
//       if (baseData.current.length > 300) {
//         baseData.current.shift();
//         predictiveData.current.shift();
//         liveSeries.current?.setData([...baseData.current]);
//         predictiveSeries.current?.setData([...predictiveData.current]);
//       }

//       updateThresholdLine();
//       estimateThresholdReachTime();
//     };

//     socket.current.on('liveMessage', handler);
//     return () => socket.current.off('liveMessage', handler);
//   }, [predictNextValue, updateThresholdLine, estimateThresholdReachTime]);

//   // ------------------------------------------------------------------
//   // Chart creation
//   // ------------------------------------------------------------------
//   useEffect(() => {
//     chart.current = createChart(chartContainerRef.current, {
//       width: 1200,
//       height: 400,
//       layout: { backgroundColor: '#ffffff', textColor: '#333' },
//       grid: { vertLines: { color: '#f0f0f0' }, horzLines: { color: '#f0f0f0' } },
//       crosshair: { mode: CrosshairMode.Normal },
//       timeScale: { timeVisible: true, secondsVisible: true },
//     });

//     liveSeries.current = chart.current.addLineSeries({
//       color: '#1890ff',
//       lineWidth: 2,
//       title: 'Live Data',
//     });

//     predictiveSeries.current = chart.current.addLineSeries({
//       color: '#FF6B6B',
//       lineWidth: 2,
//       lineStyle: LineStyle.Dashed,
//       title: 'Predicted',
//     });

//     thresholdLine.current = chart.current.addLineSeries({
//       color: '#FF4D4F',
//       lineWidth: 2,
//       lineStyle: LineStyle.Dotted,
//       title: `Threshold (${threshold})`,
//     });

//     fetchInitialData();

//     const resize = () => {
//       if (chartContainerRef.current) {
//         chart.current.applyOptions({ width: chartContainerRef.current.clientWidth });
//       }
//     };
//     window.addEventListener('resize', resize);
//     resize();

//     return () => {
//       window.removeEventListener('resize', resize);
//       chart.current?.remove();
//     };
//   }, [fetchInitialData]);

//   // ------------------------------------------------------------------
//   // UI helpers
//   // ------------------------------------------------------------------
//   const buttonStyle = (tf) => ({
//     padding: '4px 12px',
//     border: '1px solid #d9d9d9',
//     borderRadius: '4px',
//     backgroundColor: timeFrame === tf ? '#1890ff' : hoveredButton === tf ? '#f5f5f5' : 'white',
//     color: timeFrame === tf ? 'white' : 'rgba(0,0,0,0.85)',
//     cursor: isLoading ? 'not-allowed' : 'pointer',
//     fontSize: '14px',
//     transition: 'all 0.3s',
//   });

//   return (
//     <div style={{ padding: '20px', backgroundColor: '#f5f5f5' }}>
//       <div
//         style={{
//           maxWidth: '1200px',
//           margin: '0 auto',
//           background: 'white',
//           borderRadius: '8px',
//           boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
//           padding: '20px',
//         }}
//       >
//         <div
//           style={{
//             display: 'flex',
//             justifyContent: 'space-between',
//             alignItems: 'center',
//             flexWrap: 'wrap',
//             gap: '12px',
//             marginBottom: '20px',
//           }}
//         >
//           <h3 style={{ margin: 0 }}>Prediction Chart: {topic || '–'}</h3>

//           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
//             {thresholdReachTime && (
//               <div
//                 style={{
//                   padding: '6px 12px',
//                   borderRadius: '4px',
//                   backgroundColor: thresholdReachTime.includes('reached')
//                     ? '#f6ffed'
//                     : '#fffbe6',
//                   border: `1px solid ${
//                     thresholdReachTime.includes('reached') ? '#b7eb8f' : '#ffe58f'
//                   }`,
//                   color: thresholdReachTime.includes('reached') ? '#389e0d' : '#d48806',
//                   fontWeight: 500,
//                 }}
//               >
//                 {thresholdReachTime}
//               </div>
//             )}

//             <input
//               type="number"
//               value={threshold}
//               onChange={(e) => {
//                 const v = parseFloat(e.target.value);
//                 if (!isNaN(v)) {
//                   setThreshold(v);
//                   updateThresholdLine();
//                   estimateThresholdReachTime();
//                 }
//               }}
//               step="0.1"
//               style={{ width: '80px', padding: '4px 8px' }}
//             />
//           </div>

//           <div style={{ display: 'flex', gap: '8px' }}>
//             {['1H', '1D', '1W', '1M', '2h'].map((tf) => (
//               <button
//                 key={tf}
//                 disabled={isLoading}
//                 style={buttonStyle(tf)}
//                 onMouseEnter={() => setHoveredButton(tf)}
//                 onMouseLeave={() => setHoveredButton(null)}
//                 onClick={() => {
//                   setTimeFrame(tf);
//                   fetchInitialData(tf);
//                 }}
//               >
//                 {tf}
//               </button>
//             ))}
//           </div>
//         </div>

//         <div style={{ marginBottom: '16px', fontSize: '14px' }}>
//           <ul style={{ margin: '8px 0', paddingLeft: '20px' }}>
//             <li>
//               <span style={{ color: '#1890ff' }}>Blue</span> – Live values
//             </li>
//             <li>
//               <span style={{ color: '#FF6B6B' }}>Red dashed</span> – Predicted (moving-average + trend)
//             </li>
//             <li>
//               <span style={{ color: '#FF4D4F' }}>Red dotted</span> – Threshold ({threshold})
//             </li>
//           </ul>
//         </div>

//         <div ref={chartContainerRef} style={{ position: 'relative', height: '400px' }} />

//         <div style={{ marginTop: '8px', fontSize: '12px', color: isConnected ? '#52c41a' : '#ff4d4f' }}>
//           {isConnected ? 'Connected' : 'Disconnected'}
//         </div>

//         {error && (
//           <div style={{ marginTop: '10px', color: '#d4380d', background: '#fff2f0', padding: '8px', borderRadius: '4px' }}>
//             {error}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Prediction;