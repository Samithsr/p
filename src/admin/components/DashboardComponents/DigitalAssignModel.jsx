import React, { useEffect, useRef, useState } from "react";
import "./style.css";
import { IoCloseOutline } from "react-icons/io5";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useParams } from "react-router-dom";
import apiClient from "../../../api/apiClient";
import Loader from "../../../users/loader/Loader";

import Type1 from "../digitalmeters/Type1";
import Type2 from "../digitalmeters/Type2";
import Type3 from "../digitalmeters/Type3";
import Type4 from "../digitalmeters/Type4";
import Type5 from "../digitalmeters/Type5";
import Type6 from "../digitalmeters/Type6";
import Type7 from "../digitalmeters/Type7";

import Type1Img from "./../../../utils/Type1.png";
import Type2Img from "./../../../utils/Type2.png";
import Type3Img from "./../../../utils/Type3.png";
import Type4Img from "./../../../utils/Type4.png";
import Type5Img from "./../../../utils/Type5.png";
import Type6Img from "./../../../utils/Type6.png";
import Type7Img from "./../../../utils/Type7.png";

const DigitalAssignModel = () => {
  const { id, paramsTopic, role } = useParams();
  const [meterType, setMeterType] = useState("");
  const [fetchedUser, setFetchedUser] = useState({});
  const [alreadyAssignedMeter, setAlreadyAssignedMeter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [inputData, setInputData] = useState({
    minValue: "",
    maxValue: "",
    tick: "",
    label: "",
  });

  const [alreadyAssignedMeterName, setAlreadyAssignedMeterName] = useState("");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  useEffect(() => {
    fetchSelectedUser();
  }, [id]);

  // Confirmation Dialog Component
  const ConfirmDialog = ({ onConfirm, onCancel }) => (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'white',
        borderRadius: '8px',
        width: '400px',
        maxWidth: '90%',
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{
          background: '#F87171',
          padding: '15px 20px',
          borderTopLeftRadius: '8px',
          borderTopRightRadius: '8px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <h3 style={{ margin: 0, fontSize: '18px', color: 'white' }}>Confirm</h3>
          <button 
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              color: 'white',
              padding: '0 5px',
              lineHeight: '1',
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: '25px 20px', borderBottom: '1px solid #e9ecef' }}>
          <p style={{ margin: 0, color: '#333', fontSize: '16px', textAlign: 'center' }}>
            Are you sure you want to remove this meter?
          </p>
        </div>
        <div style={{ 
          padding: '15px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px',
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 20px',
              border: '1px solid #2e7d32',
              borderRadius: '4px',
              background: 'white',
              color: '#2e7d32',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.target.style.background = '#f5f5f5';
              e.target.style.borderColor = '#1b5e20';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'white';
              e.target.style.borderColor = '#2e7d32';
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 20px',
              border: 'none',
              borderRadius: '4px',
              background: '#d32f2f',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => e.target.style.background = '#b71c1c'}
            onMouseOut={(e) => e.target.style.background = '#d32f2f'}
          >
            {loading ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>
    </div>
  );

  const fetchSelectedUser = async () => {
    try {
      const res = await apiClient.get(`/auth/${role}/${id}`);
      setFetchedUser(res?.data?.data);
      const assignedMeter = res?.data?.data?.assignedDigitalMeters?.find(
        (item) => item.topic.toLowerCase() === paramsTopic.toLowerCase()
      );
      setAlreadyAssignedMeter(assignedMeter);

      if (assignedMeter) {
        setAlreadyAssignedMeterName(assignedMeter.meterType);
        setInputData({
          minValue: assignedMeter.minValue,
          maxValue: assignedMeter.maxValue,
          tick: assignedMeter.ticks,
          label: assignedMeter.label,
        });
      }
    } catch (error) {
      console.log(error.message);
    } finally {
      setLoading(false);
    }
  };

  const carouselRef = useRef(null);

  const handleRightScroll = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft += 400;
    }
  };

  const handleLeftScroll = () => {
    if (carouselRef.current) {
      carouselRef.current.scrollLeft -= 400;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setInputData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

const handleAssign = async () => {
  if (!alreadyAssignedMeterName) return;
  
  try {
    setLoading(true);
    
    // Get current assigned meters or empty array if none
    const currentMeters = fetchedUser?.assignedDigitalMeters || [];
    
    // Check if a meter already exists for this topic
    const existingMeterIndex = currentMeters.findIndex(
      meter => meter.topic.toLowerCase() === paramsTopic.toLowerCase()
    );

    // Create or update meter object
    const meterData = {
      id: existingMeterIndex !== -1 ? currentMeters[existingMeterIndex].id : `${paramsTopic}-${Date.now()}`,
      topic: paramsTopic,
      meterType: alreadyAssignedMeterName,
      minValue: parseFloat(inputData.minValue) || 0,
      maxValue: parseFloat(inputData.maxValue) || 100,
      ticks: parseInt(inputData.tick, 10) || 10,
      label: inputData.label || '',
      lastUpdated: new Date().toISOString()
    };

    let updatedMeters;
    if (existingMeterIndex !== -1) {
      // Update existing meter
      updatedMeters = [...currentMeters];
      updatedMeters[existingMeterIndex] = meterData;
    } else {
      // Add new meter
      updatedMeters = [...currentMeters, meterData];
    }

    // Update the user's assigned meters in the database
    await apiClient.put(`/auth/digitalmeter/${role}/${id}`, {
      assignedDigitalMeters: updatedMeters,
    });

    // Update the topic's label
    try {
      await apiClient.put(`/mqtt/update-topic-label`, {
        topic: paramsTopic,
        label: inputData.label || '',
      });
    } catch (labelError) {
      console.warn("Could not update topic label:", labelError);
    }

    // Update local state
    // Update local state with the new or updated meter
    setFetchedUser(prev => ({
      ...prev,
      assignedDigitalMeters: updatedMeters
    }));
    setAlreadyAssignedMeter(meterData);
    
    // Show success message based on whether it was an update or new assignment
    if (existingMeterIndex !== -1) {
      // alert("Meter updated successfully!");
    } else {
      // alert("Meter assigned successfully!");
    }
    
  } catch (error) {
    console.error("Error assigning meter:", error);
    alert(error.response?.data?.message || "Failed to assign meter. Please try again.");
  } finally {
    setLoading(false);
  }
};

const handleUpdate = async () => {
  if (!alreadyAssignedMeter || !alreadyAssignedMeterName) return;
  
  try {
    setLoading(true);
    
    // Get current assigned meters or empty array if none
    const currentMeters = fetchedUser?.assignedDigitalMeters || [];
    
    // Create updated meter object with existing ID but new meter type and values
    const updatedMeter = {
      ...alreadyAssignedMeter,
      meterType: alreadyAssignedMeterName, // Update with newly selected meter type
      minValue: parseFloat(inputData.minValue) || 0,
      maxValue: parseFloat(inputData.maxValue) || 100,
      ticks: parseInt(inputData.tick, 10) || 10,
      label: inputData.label || '',
      lastUpdated: new Date().toISOString()
    };

    // Find and update the existing meter in the array
    const meterIndex = currentMeters.findIndex(m => m.id === alreadyAssignedMeter.id);
    
    if (meterIndex === -1) {
      throw new Error("Meter not found in the assigned list");
    }

    const updatedMeters = [...currentMeters];
    updatedMeters[meterIndex] = updatedMeter;

    // Update the user's assigned meters in the database
    const response = await apiClient.put(`/auth/digitalmeter/${role}/${id}`, {
      assignedDigitalMeters: updatedMeters,
    });

    // Update the topic's label
    try {
      await apiClient.put(`/mqtt/update-topic-label`, {
        topic: paramsTopic,
        label: inputData.label || '',
      });
    } catch (labelError) {
      console.warn("Could not update topic label:", labelError);
    }

    // Update local state with the updated meter
    setFetchedUser(prev => ({
      ...prev,
      assignedDigitalMeters: updatedMeters
    }));
    
    // Update the alreadyAssignedMeter with the new data
    setAlreadyAssignedMeter(updatedMeter);
    
    // Show success message
    // alert("Meter updated successfully!");
    
    // Force a refresh of the meter data
    fetchSelectedUser();
    
  } catch (error) {
    console.error("Error updating meter:", error);
    alert(error.response?.data?.message || error.message || "Failed to update meter. Please try again.");
  } finally {
    setLoading(false);
  }
};

const handleRemoveMeter = () => {
  if (!alreadyAssignedMeter) return;
  setShowConfirmDialog(true);
};

const confirmRemoveMeter = async () => {
  if (!alreadyAssignedMeter) {
    setShowConfirmDialog(false);
    return;
  }
  
  try {
    setLoading(true);
    setShowConfirmDialog(false);
    
    // Get current assigned meters
    const currentMeters = fetchedUser?.assignedDigitalMeters || [];
    
    // Filter out the meter we want to remove
    const updatedMeters = currentMeters.filter(
      meter => meter.id !== alreadyAssignedMeter.id
    );

    // Update the user's assigned meters in the database
    await apiClient.put(`/auth/digitalmeter/${role}/${id}`, {
      assignedDigitalMeters: updatedMeters,
    });

    // Clear the topic's label
    try {
      await apiClient.put(`/mqtt/update-topic-label`, {
        topic: alreadyAssignedMeter.topic,
        label: "",
      });
    } catch (labelError) {
      console.warn("Could not clear topic label:", labelError);
    }

    // Update local state
    setFetchedUser(prev => ({
      ...prev,
      assignedDigitalMeters: updatedMeters
    }));
    
    // Reset the form
    setAlreadyAssignedMeter(null);
    setAlreadyAssignedMeterName("");
    setInputData({
      minValue: "",
      maxValue: "",
      tick: "",
      label: "",
    });
    
    // alert("Meter removed successfully!");
    
  } catch (error) {
    console.error("Error removing meter:", error);
    alert(error.response?.data?.message || "Failed to remove meter. Please try again.");
  } finally {
    setLoading(false);
  }
};

  const cancelRemoveMeter = () => {
    setShowConfirmDialog(false);
  };

  if (loading) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  const alreadyAssignedMinValue = Number(alreadyAssignedMeter?.minValue) || 0;
  const alreadyAssignedMaxValue = Number(alreadyAssignedMeter?.maxValue) || 0;
  const alreadyAssignedLabel = alreadyAssignedMeter?.label || "";
  const alreadyAssignedTick = Number(alreadyAssignedMeter?.ticks) || 0;

  return (
    <div className="_admin_assign_meter_main_container">
      {showConfirmDialog && (
        <ConfirmDialog 
          onConfirm={confirmRemoveMeter}
          onCancel={cancelRemoveMeter}
        />
      )}
      <div className="_admin_assign_meter_container">
        <header>
          <p>{fetchedUser?.email}</p>
          <div
            className="_admin_assign_meter_close"
            onClick={() => window.close()}
          >
            <IoCloseOutline color="white" size={"20"} />
          </div>
        </header>
        <section>
          <p>{paramsTopic}</p>
        </section>
        <section
          ref={carouselRef}
          className="_admin_assign_meter_carousel_container"
        >
          <section
            className="_admin_assign_meter_carousel_left_button_container"
            onClick={handleLeftScroll}
          >
            <div className="_admin_assign_meter_carousel_left_button">
              <FaChevronLeft />
            </div>
          </section>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type1")}
            className={
              alreadyAssignedMeterName === "Type1" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type1Img} alt="meter type one" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type2")}
            className={
              alreadyAssignedMeterName === "Type2" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type2Img} alt="meter type two" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type3")}
            className={
              alreadyAssignedMeterName === "Type3" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type3Img} alt="meter type three" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type4")}
            className={
              alreadyAssignedMeterName === "Type4" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type4Img} alt="meter type four" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type5")}
            className={
              alreadyAssignedMeterName === "Type5" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type5Img} alt="meter type five" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type6")}
            className={
              alreadyAssignedMeterName === "Type6" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type6Img} alt="meter type six" />
          </div>
          <div
            onClick={() => setAlreadyAssignedMeterName("Type7")}
            className={
              alreadyAssignedMeterName === "Type7" &&
              `_admin_assign_meter_carousel_container_active_meter`
            }
          >
            <img src={Type7Img} alt="meter type seven" />
          </div>
          <section
            className="_admin_assign_meter_carousel_right_button_container"
            onClick={handleRightScroll}
          >
            <div className="_admin_assign_meter_carousel_right_button">
              <FaChevronRight />
            </div>
          </section>
        </section>
        <section className="_admin_assign_digital_meter_and_edit_main_container">
          <div className="_admin_assign_digital_meter_edit_container">
            <div>
              <p>
                Edit the values and assign the digital meter for the selected
                topic
              </p>
              <div className="_admin_assign_digital_meter_edit_input_container">
                <input
                  type="text"
                  name="minValue"
                  value={inputData.minValue}
                  onChange={handleChange}
                  placeholder="Enter the minimum value"
                />
              </div>
              <div className="_admin_assign_digital_meter_edit_input_container">
                <input
                  type="text"
                  name="maxValue"
                  value={inputData.maxValue}
                  onChange={handleChange}
                  placeholder="Enter the maximum value"
                />
              </div>
              <div className="_admin_assign_digital_meter_edit_input_container">
                <input
                  type="text"
                  name="label"
                  value={inputData.label}
                  onChange={handleChange}
                  placeholder="Enter the label"
                />
              </div>
              {alreadyAssignedMeterName === "Type2" && (
                <div className="_admin_assign_digital_meter_edit_input_container">
                  <select
                    name="tick"
                    value={inputData.tick}
                    onChange={handleChange}
                  >
                    <option value="">Select the number of ticks</option>
                    {Array.from({ length: 20 }, (_, i) => i + 2).map((tick) => (
                      <option key={tick} value={tick}>
                        {tick}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="_admin_assign_digital_meter_edit_save_button" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleAssign}
                  disabled={!!alreadyAssignedMeter || !alreadyAssignedMeterName}
                  className={(!alreadyAssignedMeterName || !!alreadyAssignedMeter) ? 'disabled-button' : ''}
                >
                  Assign
                </button>
                <button 
                  onClick={handleUpdate}
                  disabled={!alreadyAssignedMeter}
                  className={!alreadyAssignedMeter ? 'disabled-button' : ''}
                >
                  Update
                </button>
                <button
                  onClick={handleRemoveMeter}
                  disabled={!alreadyAssignedMeter}
                  className={!alreadyAssignedMeter ? 'disabled-button remove-button' : 'remove-button'}
                >
                  Remove
                </button>
              </div>
              <style jsx>{`
                .disabled-button {
                  opacity: 0.6;
                  cursor: not-allowed;
                }
                .remove-button {
                  background-color: #ff4444;
                  color: white;
                }
                .remove-button:hover:not(:disabled) {
                  background-color: #cc0000;
                }
                .remove-button:disabled {
                  background-color: #ff9999;
                }
              `}</style>
            </div>
          </div>
          <div className="_admin_assign_digital_meter_view_container">
            {!alreadyAssignedMeter ? (
              <div className="_admin_assign_digital_meter_view_not_selected_message_container">
                <p>No Meter selected...!</p>
              </div>
            ) : (
              <div className="_admin_assign_digital_meter_view_wrapper">
                <div
                  className="_admin_assign_digital_meter_remove_btn"
                  onClick={handleRemoveMeter}
                  title="Remove Meter"
                >
                  ×
                </div>
                {alreadyAssignedMeterName === "Type1" && (
                  <Type1
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    topic={paramsTopic}
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type2" && (
                  <Type2
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    value={30}
                    tick={alreadyAssignedTick || 5}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    topic={paramsTopic}
                    adminWidth="500px"
                    adminHeight="400px"
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type3" && (
                  <Type3
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    topic={paramsTopic}
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type4" && (
                  <Type4
                    topic={paramsTopic}
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type5" && (
                  <Type5
                    topic={paramsTopic}
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type6" && (
                  <Type6
                    topic={paramsTopic}
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    label={alreadyAssignedLabel}
                  />
                )}
                {alreadyAssignedMeterName === "Type7" && (
                  <Type7
                    topic={paramsTopic}
                    minValue={alreadyAssignedMinValue}
                    maxValue={alreadyAssignedMaxValue}
                    unit={
                      paramsTopic.includes("|") ? paramsTopic.split("|")[1] : ""
                    }
                    label={alreadyAssignedLabel}
                  />
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DigitalAssignModel;
