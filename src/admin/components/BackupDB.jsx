import React, { useState, useEffect, useRef } from 'react';
import './BackupDB.css';
import axios from 'axios';
import apiClient from '../../api/apiClient';

const BackupDB = () => {
  const [progress, setProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState('0 KB/s');
  const [timeRemaining, setTimeRemaining] = useState('--');
  const [downloadedSize, setDownloadedSize] = useState('0 MB');
  const [dbInfo, setDbInfo] = useState({
    dbName: 'sarayu-test-project-ec2',
    estimatedSize: 'Calculating...',
    collections: 0
  });
  const [error, setError] = useState(null);

  const abortControllerRef = useRef(null);
  const lastLoadedRef = useRef(0);
  const lastTimeRef = useRef(0);
  const totalSizeRef = useRef(0);
  const speedHistoryRef = useRef([]);

  useEffect(() => {
    const fetchDbInfo = async () => {
      try {
        const response = await apiClient.get('/backupdb/size');
        const formattedSize = formatBytes(response.data.size);
        setDbInfo({
          dbName: response.data.dbName || 'sarayu-test-project-ec2',
          estimatedSize: formattedSize,
          collections: response.data.collections || 0
        });
        totalSizeRef.current = response.data.size;
      } catch (error) {
        console.error('Failed to fetch DB info:', error);
        setError('Failed to fetch database information');
        setDbInfo(prev => ({
          ...prev,
          estimatedSize: 'Unknown'
        }));
      }
    };
    fetchDbInfo();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0 || !bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
  };

  const calculateSpeed = (loaded, timeNow) => {
    const timeDiff = (timeNow - lastTimeRef.current) / 1000;
    if (timeDiff === 0) return '0 KB/s';

    const loadedDiff = loaded - lastLoadedRef.current;
    const speed = loadedDiff / timeDiff;

    speedHistoryRef.current.push(speed);
    if (speedHistoryRef.current.length > 5) {
      speedHistoryRef.current.shift();
    }

    const avgSpeed = speedHistoryRef.current.reduce((a, b) => a + b, 0) / speedHistoryRef.current.length;

    return formatBytes(avgSpeed) + '/s';
  };

  const calculateTimeRemaining = (loaded, totalSize, speed) => {
    if (!speed || speed === '0 Bytes/s' || totalSize <= 0) return '--';

    const remainingBytes = Math.max(0, totalSize - loaded);
    if (remainingBytes <= 0) return '0s';

    const speedValue = parseFloat(speed);
    const unit = speed.includes('KB') ? 1024 :
                 speed.includes('MB') ? 1024 * 1024 :
                 speed.includes('GB') ? 1024 * 1024 * 1024 : 1;

    const bytesPerSecond = speedValue * unit;

    if (bytesPerSecond <= 0) return '--';

    const seconds = remainingBytes / bytesPerSecond;

    if (seconds > 86400) return `${Math.round(seconds / 86400)}d`;
    if (seconds > 3600) return `${Math.round(seconds / 3600)}h`;
    if (seconds > 60) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds)}s`;
  };

  const handleBackup = async () => {
    abortControllerRef.current = new AbortController();
    setIsDownloading(true);
    setProgress(0);
    setDownloadSpeed('0 KB/s');
    setTimeRemaining('--');
    setDownloadedSize('0 MB');
    setError(null);
    lastLoadedRef.current = 0;
    lastTimeRef.current = Date.now();
    speedHistoryRef.current = [];

    try {
      const response = await apiClient({
        url: '/backupdb',
        method: 'GET',
        responseType: 'blob',
        signal: abortControllerRef.current.signal,
        onDownloadProgress: (progressEvent) => {
          const timeNow = Date.now();
          const loaded = progressEvent.loaded;
          const total = progressEvent.total || totalSizeRef.current;

          if (loaded > totalSizeRef.current) {
            totalSizeRef.current = loaded;
          }

          const percentCompleted = totalSizeRef.current > 0
            ? Math.min(Math.round((loaded * 100) / totalSizeRef.current), 100)
            : 0;

          setProgress(percentCompleted);

          const speed = calculateSpeed(loaded, timeNow);
          setDownloadSpeed(speed);

          const remaining = calculateTimeRemaining(loaded, totalSizeRef.current, speed);
          setTimeRemaining(remaining);

          const formattedSize = formatBytes(loaded);
          setDownloadedSize(formattedSize);

          lastLoadedRef.current = loaded;
          lastTimeRef.current = timeNow;
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `backup_${dbInfo.dbName}_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log('Download canceled by user');
      } else {
        console.error('Backup failed:', error);
        setError(`Failed to download backup: ${error.message || 'Network error'}`);
      }
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  return (
    <div className="backup-container">
      <h2>Database Backup</h2>
      <div className="backup-info">
        <p><strong>Database Name:</strong> {dbInfo.dbName}</p>
        <p><strong>Estimated Size:</strong> {dbInfo.estimatedSize}</p>
        <p><strong>Collections:</strong> {dbInfo.collections}</p>

        {error && <div className="error-message">{error}</div>}

        {isDownloading && (
          <div className="progress-section">
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="progress-text">{progress}%</div>
            </div>

            <div className="download-stats">
              <div className="stat-item">
                <span className="stat-label">Downloaded:</span>
                <span className="stat-value">{downloadedSize}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Speed:</span>
                <span className="stat-value">{downloadSpeed}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Remaining:</span>
                <span className="stat-value">{timeRemaining}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="button-group">
        <button
          className={`backup-button ${isDownloading ? 'downloading' : ''}`}
          onClick={handleBackup}
          disabled={isDownloading || dbInfo.estimatedSize === 'Unknown'}
        >
          {isDownloading ? 'Downloading...' : 'Download Backup'}
        </button>

        {isDownloading && (
          <button
            className="cancel-button"
            onClick={handleCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default BackupDB;