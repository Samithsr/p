import React, { useEffect, useState } from "react";
import "../../style.css";
import { useNavigate, useParams } from "react-router-dom";
import SmallGraph from "../graphs/smallgraph/SmallGraph";
import { IoClose } from "react-icons/io5";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";

const EditGraph = () => {
  const { topicparams } = useParams();
  const [thresholdNumber, setThresholdNumber] = useState(0);
  const [thresholds, setThreshold] = useState([]);
  const [topicLabel, setTopicLabel] = useState("");
  const navigate = useNavigate();

  let topic = encodeURIComponent(topicparams);

  useEffect(() => {
    fetchThresholdApi();
    fetchLabelApi();
  }, []);

  const fetchLabelApi = async () => {
    try {
      const res = await apiClient.post("/mqtt/get-single-topic-label", {
        topic: topicparams,
      });
      setTopicLabel(res?.data?.data[0]?.label);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    let updatedThresholds = Array.from(
      { length: Number(thresholdNumber) },
      (_, index) => {
        if (thresholdNumber === 2) {
          return index === 0
            ? { value: thresholds[index]?.value || "", color: "orange" }
            : { value: thresholds[index]?.value || "", color: "red" };
        }
        return thresholds[index] || { value: "", color: "orange" };
      }
    );
    setThreshold(updatedThresholds);
  }, [thresholdNumber]);

  const fetchThresholdApi = async () => {
    try {
      const res = await apiClient.get(`/mqtt/get?topic=${topic}`);
      const fetchedThresholds = res?.data?.data?.thresholds || [];
      const processedThresholds = fetchedThresholds.map((threshold) => ({
        ...threshold,
        value: parseInt(threshold.value, 10),
      }));
      setThreshold(processedThresholds);
      setThresholdNumber(processedThresholds.length);
    } catch (error) {
      console.log("No threshold is present");
    }
  };

  const handleSelectNumberOfThreshold = (e) => {
    setThresholdNumber(Number(e.target.value));
  };

  const handleThresholdChange = (index, key, value) => {
    const updatedThresholds = [...thresholds];
    
    if (key === "value") {
      const newValue = parseInt(value, 10) || 0;
      updatedThresholds[index] = {
        ...updatedThresholds[index],
        value: newValue,
      };
    } else if (key === "color") {
      updatedThresholds[index] = {
        ...updatedThresholds[index],
        color: value,
      };
    }

    setThreshold(updatedThresholds);
  };

  const handleSaveChanges = async () => {
    if (thresholdNumber === 2) {
      const orangeValue = parseInt(thresholds[0]?.value, 10) || 0;
      const redValue = parseInt(thresholds[1]?.value, 10) || 0;
      if (redValue <= orangeValue) {
        toast.warning("Red threshold must be greater than Yellow threshold");
        return;
      }
    }

    try {
      const payloadThresholds = Number(thresholdNumber) === 0 ? [] : thresholds;
      await apiClient.post(`/mqtt/add?topic=${topic}`, {
        thresholds: payloadThresholds,
      });
      window.location.reload();
    } catch (error) {
      console.log(error.message);
    }
  };

  return (
    <div className="edit-graph-container">
      <div className="edit-graph-card">
        <div className="edit-graph-header">
          <div className="edit-graph-title">Edit {topicLabel}</div>
          <button
            className="edit-graph-close-btn"
            onClick={() => navigate(-1)}
            aria-label="Close"
          >
            <IoClose />
          </button>
        </div>
        <div className="edit-graph-content">
          <div className="graph-wrapper">
            <SmallGraph topic={topicparams} height={"400"} shadow={true} />
          </div>
          <div className="threshold-controls">
            <div className="threshold-form">
              <h4 className="threshold-title">Set Threshold</h4>
              <div className="threshold-selector">
                <select
                  value={thresholdNumber}
                  onChange={handleSelectNumberOfThreshold}
                  className="threshold-dropdown"
                >
                  <option value="0">0</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </div>
              <div className="threshold-inputs">
                {[...Array(Number(thresholdNumber))].map((_, index) => (
                  <div key={index} className="threshold-input-group">
                    <input
                      type="number"
                      value={thresholds[index]?.value || ""}
                      placeholder={`Threshold ${index + 1}`}
                      onChange={(e) =>
                        handleThresholdChange(index, "value", e.target.value)
                      }
                      className="threshold-input"
                    />
                    {thresholdNumber === 2 ? (
                      <div
                        className="threshold-color-display"
                        style={{
                          backgroundColor: index === 0 ? "orange" : "red",
                          width: "80px",
                          height: "30px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "white",
                        }}
                      >
                        {index === 0 ? "Yellow" : "Red"}
                      </div>
                    ) : (
                      <select
                        className="threshold-color-select"
                        value={thresholds[index]?.color || ""}
                        onChange={(e) =>
                          handleThresholdChange(index, "color", e.target.value)
                        }
                      >
                        <option value="orange">Yellow</option>
                        <option value="red">Red</option>
                      </select>
                    )}
                  </div>
                ))}
              </div>
              <div className="threshold-buttons">
                <button
                  onClick={() => setThreshold([])}
                  className="btn-clear"
                >
                  Clear All
                </button>
                <button
                  onClick={handleSaveChanges}
                  className="btn-save"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditGraph;


