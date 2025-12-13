import React, { useContext, useEffect, useState } from 'react';
import './GatewayStat.css';
import { navHeaderContaxt } from '../../../contaxts/navHeaderContaxt';
import io from 'socket.io-client';
import apiClient from '../../../api/apiClient';
import { toast } from 'react-toastify';
import { MdEdit } from "react-icons/md";

// Inline CSS for the modal, inspired by the reference
const customStyles = `
  .custom-edit-location-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }

  .custom-edit-location-modal {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .custom-edit-location-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .custom-edit-location-modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .custom-edit-location-modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }

  .custom-edit-location-modal-body {
    margin-bottom: 20px;
  }

  .custom-edit-location-modal-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
  }

  .custom-edit-location-modal-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    outline: none;
    transition: border-color 0.2s;
  }

  .custom-edit-location-modal-input:focus {
    border-color: #4d79ff;
  }

  .custom-edit-location-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .custom-edit-location-modal-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .custom-edit-location-modal-button-ok {
    background: #4d79ff;
    color: #fff;
  }

  .custom-edit-location-modal-button-ok:hover {
    background: #4066d9;
  }

  .custom-edit-location-modal-button-cancel {
    background: #f1f1f1;
    color: #333;
  }

  .custom-edit-location-modal-button-cancel:hover {
    background: #e0e0e0;
  }

  .gatewaystat_location_cell {
    position: relative;
    padding: 1rem;
  }

  .gatewaystat_edit_icon {
    position: absolute;
    top: 4px;
    right: 4px;
    cursor: pointer;
    color: #4d79ff;
    transition: color 0.2s;
  }

  .gatewaystat_edit_icon:hover {
    color: #4066d9;
  }
`;

// Append the styles to the document head
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = customStyles;
document.head.appendChild(styleSheet);

const GatewayStat = () => {
  const { navHeader } = useContext(navHeaderContaxt);
  const [gatewayTopics, setGatewayTopics] = useState([]);
  const [gatewayData, setGatewayData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    // Ensure navHeader.topics is an array before processing
    const gatewayNames = Array.isArray(navHeader?.topics)
      ? navHeader.topics
          .map((item) => {
            const parts = item.split('|')[0].split('/');
            return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : null;
          })
          .filter((item) => item !== null)
          .reduce((unique, item) => (unique.includes(item) ? unique : [...unique, item]), [])
      : [];

    setGatewayTopics(gatewayNames);

    // Initialize gateway data structure and fetch locations
    const initializeGatewayData = async () => {
      const initialData = {};
      
      for (const gateway of gatewayNames || []) { // Fallback to empty array if gatewayNames is undefined
        try {
          const encodedGateway = encodeURIComponent(gateway);
          const response = await apiClient.get(`/mqtt/get-gateway-location/${encodedGateway}`);
          
          initialData[gateway] = {
            signalStrength: 'N/A',
            numDevices: 0,
            deviceNames: [],
            deviceStatuses: [],
            location: response?.data?.success ? response?.data?.location : 'Location not set',
          };
        } catch (error) {
          console.error(`Error fetching location for ${gateway}:`, error);
          initialData[gateway] = {
            signalStrength: 'N/A',
            numDevices: 0,
            deviceNames: [],
            deviceStatuses: [],
            location: 'Location not set',
          };
        }
      }
      
      setGatewayData(initialData);
      setIsLoading(false);
    };

    initializeGatewayData();

    // Set up socket.io connection
    const socket = io('http://localhost:4000', {
      // path: '/socket.io/',
      transports: ['websocket'],
      secure: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 5000,
      upgrade: false,
    });

    // Debug connection events
    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      (gatewayNames || []).forEach((topic) => { // Fallback to empty array
        socket.emit('subscribeToTopic', topic);
        console.log(`Subscribed to topic: ${topic}`);
      });
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connect_error:', error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    // Handle incoming live messages
    socket.on('liveMessage', (data) => {
      const topic = data.topic;
      const message = data.message?.message?.message;
      console.log('Received liveMessage:', data);

      if (message && typeof message === 'string') {
        let signalStrength, numDevices, deviceNames, deviceStatuses;
        try {
          const parts = message.startsWith('[') && message.endsWith(']')
            ? message.replace(/[\[\]]/g, '').trim().split(',').map(val => val.trim())
            : message.split(',').map(val => val.trim());

          // First two parts are signalStrength and numDevices
          signalStrength = parts[0] || 'N/A';
          numDevices = parseInt(parts[1]) || 0;

          // Calculate expected message length: 2 (signalStrength, numDevices) + N (device names) + N (device statuses)
          const expectedLength = 2 + numDevices + numDevices;
          if (parts.length < expectedLength) {
            throw new Error(`Payload does not have enough parts for ${numDevices} devices`);
          }

          // Extract device names (from index 2 to 2 + numDevices - 1)
          deviceNames = parts.slice(2, 2 + numDevices).map(name => name || '');

          // Extract device statuses (from index 2 + numDevices to end)
          deviceStatuses = parts.slice(2 + numDevices, 2 + numDevices + numDevices).map(status => status || '');

          // Ensure deviceNames and deviceStatuses have the same length as numDevices
          if (deviceNames.length !== numDevices || deviceStatuses.length !== numDevices) {
            throw new Error('Mismatch between number of devices and device names/statuses');
          }
        } catch (error) {
          console.error('Error parsing message:', error);
          signalStrength = 'N/A';
          numDevices = 0;
          deviceNames = [];
          deviceStatuses = [];
        }

        setGatewayData((prevData) => ({
          ...prevData,
          [topic]: {
            ...prevData[topic],
            signalStrength,
            numDevices,
            deviceNames,
            deviceStatuses,
            location: prevData[topic]?.location || 'Location not set',
          },
        }));
      } else {
        console.log(`Message not processed: topic=${topic}, message=${message}`);
      }
    });
    
    // Cleanup on unmount
    return () => {
      socket.disconnect();
      console.log('Socket disconnected on cleanup');
    };
  }, [navHeader]);

  const openEditLocationModal = (gateway) => {
    setSelectedGateway(gateway);
    setNewLocation(gatewayData[gateway]?.location === 'Location not set' ? '' : gatewayData[gateway]?.location || '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGateway(null);
    setNewLocation('');
  };

  const handleUpdateLocation = async () => {
    if (!newLocation.trim()) {
      toast.warning("Location cannot be empty");
      return;
    }

    if (newLocation.trim().length > 50) {
      toast.warning("Location cannot exceed 50 characters");
      return;
    }

    if (!selectedGateway) {
      toast.error("No gateway selected for update");
      return;
    }

    try {
      const payload = {
        gatewayName: selectedGateway,
        location: newLocation.trim(),
      };
      
      await apiClient.post('/mqtt/registergateway-location', payload);
      toast.success('Location updated successfully!');

      setGatewayData((prevData) => ({
        ...prevData,
        [selectedGateway]: {
          ...prevData[selectedGateway],
          location: newLocation.trim() || 'Location not set',
        },
      }));
      
      closeModal();
    } catch (error) {
      toast.error('Failed to update location. Please try again.');
      console.error('Error submitting location:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleUpdateLocation();
    }
  };

  return (
    <div className="gatewaystat_container">
      {isLoading ? (
        <div className="gatewaystat_loading">Loading gateway data...</div>
      ) : gatewayTopics?.length > 0 ? (
        <div className="gatewaystat_table_wrapper">
          <table className="gatewaystat_table">
            <thead>
              <tr>
                <th className="gatewaystat_th">Gateway Name</th>
                <th className="gatewaystat_th">Signal Strength</th>
                <th className="gatewaystat_th">Number of Devices</th>
                <th className="gatewaystat_th">Device Names</th>
                <th className="gatewaystat_th">Device Status</th>
                <th className="gatewaystat_th">Location</th>
              </tr>
            </thead>
            <tbody>
              {gatewayTopics?.map((gateway) => {
                const gatewayInfo = gatewayData[gateway] || {
                  signalStrength: 'N/A',
                  numDevices: 0,
                  deviceNames: [],
                  deviceStatuses: [],
                  location: 'Location not set',
                };
                const numDevices = gatewayInfo.numDevices || 0;
                const rowSpan = numDevices > 0 ? numDevices : 1;

                return (
                  <React.Fragment key={gateway}>
                    {numDevices === 0 ? (
                      <tr className="gatewaystat_tr">
                        <td className="gatewaystat_td" rowSpan={rowSpan}>{gateway?.split("/")[1]}</td>
                        <td className="gatewaystat_td" rowSpan={rowSpan}>{gatewayInfo.signalStrength}</td>
                        <td className="gatewaystat_td" rowSpan={rowSpan}>{numDevices}</td>
                        <td className="gatewaystat_td">N/A</td>
                        <td className="gatewaystat_td">N/A</td>
                        <td className="gatewaystat_location_cell" rowSpan={rowSpan}>
                          {gatewayInfo.location || 'Location not set'}
                          <MdEdit
                            size={16}
                            className="gatewaystat_edit_icon"
                            onClick={() => openEditLocationModal(gateway)}
                          />
                        </td>
                      </tr>
                    ) : (
                      gatewayInfo.deviceNames.map((deviceName, index) => (
                        <tr key={`${gateway}-${index}`} className="gatewaystat_tr">
                          {index === 0 && (
                            <>
                              <td className="gatewaystat_td" rowSpan={rowSpan}>{gateway?.split("/")[1]}</td>
                              <td className="gatewaystat_td" rowSpan={rowSpan}>{gatewayInfo.signalStrength}</td>
                              <td className="gatewaystat_td" rowSpan={rowSpan}>{numDevices}</td>
                            </>
                          )}
                          <td className="gatewaystat_td">{deviceName || 'N/A'}</td>
                          <td className="gatewaystat_td">{gatewayInfo.deviceStatuses?.[index] || 'N/A'}</td>
                          {index === 0 && (
                            <td className="gatewaystat_location_cell" rowSpan={rowSpan}>
                              {gatewayInfo.location || 'Location not set'}
                              <MdEdit
                                size={16}
                                className="gatewaystat_edit_icon"
                                onClick={() => openEditLocationModal(gateway)}
                              />
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="gatewaystat_no_data">No gateways available</div>
      )}

      {isModalOpen && (
        <div className="custom-edit-location-modal-overlay">
          <div className="custom-edit-location-modal">
            <div className="custom-edit-location-modal-header">
              <h2 className="custom-edit-location-modal-title">Edit Location</h2>
              <button className="custom-edit-location-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="custom-edit-location-modal-body">
              <label className="custom-edit-location-modal-label">Current Location:</label>
              <input
                type="text"
                value={gatewayData[selectedGateway]?.location || 'Location not set'}
                disabled
                className="custom-edit-location-modal-input"
              />
              <label className="custom-edit-location-modal-label" style={{ marginTop: "12px" }}>
                New Location (max 50 chars):
              </label>
              <input
                type="text"
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value.slice(0, 50))}
                className="custom-edit-location-modal-input"
                placeholder="Enter new location (max 50 chars)"
                maxLength={50}
                onKeyDown={handleKeyPress}
              />
            </div>
            <div className="custom-edit-location-modal-footer">
              <button
                className="custom-edit-location-modal-button custom-edit-location-modal-button-cancel"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="custom-edit-location-modal-button custom-edit-location-modal-button-ok"
                onClick={handleUpdateLocation}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatewayStat;