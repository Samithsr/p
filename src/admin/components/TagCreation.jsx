import React, { useEffect, useState } from "react";
import "../index.css";
import apiClient from "../../api/apiClient";
import { toast } from "react-toastify";
import AllTopicsList from "./DashboardComponents/AllTopicsList";
import { MdDelete } from "react-icons/md";
import { IoIosWarning } from "react-icons/io";
import { IoSearch } from "react-icons/io5";

const TagCreation = () => {
  const [createTagname, setCreateTagname] = useState("");
  const [createUnit, setCreateUnit] = useState("");
  const [createLabel, setCreateLabel] = useState("");
  const [createDevice, setCreateDevice] = useState("");
  const [topiCreated, setTopicCreated] = useState(false);
  const [createTagnameValidationError, setCreateTagnameValidationError] = useState("");
  const [recetntFiveTopic, setRecentFiveTopic] = useState([]);
  const [showTopicDeleteModel, setShowTopicDeleteModel] = useState(false);
  const [topicToDelete, setTopicToDelete] = useState("");
  const [topicList, setTopicList] = useState([]);
  const [topiListFilter, setTopicListFilter] = useState([]);

  useEffect(() => {
    fetchAllTopics();
  }, [topiCreated]);

  const handleTagnameChange = (e) => {
    setCreateTagnameValidationError("");
    setCreateTagname(e.target.value);
  };

  const handleUnitChange = (e) => {
    setCreateTagnameValidationError("");
    setCreateUnit(e.target.value);
  };

  const handleLabelChange = (e) => {
    setCreateTagnameValidationError("");
    setCreateLabel(e.target.value);
  };

  const handleDeviceChange = (e) => {
    setCreateTagnameValidationError("");
    setCreateDevice(e.target.value);
  };

  const validateInputs = () => {
    const tagnameRegex = /^[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+\/[a-zA-Z0-9_]+$/;
    if (!tagnameRegex.test(createTagname)) {
      setCreateTagnameValidationError("_futuristic_dashboard_input_error");
      return false;
    }
    if (!createUnit.trim()) {
      setCreateTagnameValidationError("_futuristic_dashboard_input_error");
      return false;
    }
    if (!createLabel.trim()) {
      setCreateTagnameValidationError("_futuristic_dashboard_input_error");
      return false;
    }
    if (!createDevice.trim()) {
      setCreateTagnameValidationError("_futuristic_dashboard_input_error");
      return false;
    }
    return true;
  };

  const storeSubscribedTopic = async (topic) => {
    try {
      await apiClient.post(`/auth/subscribedTopics`, { topic });
    } catch (error) {
      console.log(error.message);
    }
  };

  const fetchAllTopics = async () => {
    try {
      const response = await apiClient("/mqtt/get-all-tagname");
      setTopicList(response.data.data.sort((a, b) => b - a));
      setTopicListFilter(response.data.data.sort((a, b) => b - a));
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleTopicSearchFilter = (e) => {
    let query = e.target.value;
    const filteredData = topicList.filter((item) =>
      item.topic.toLowerCase().includes(query.toLowerCase())
    );
    setTopicListFilter(filteredData);
  };

  useEffect(() => {
    fetchRecentFiveTopics();
  }, []);

  const fetchRecentFiveTopics = async () => {
    try {
      const res = await apiClient.get("/mqtt/get-recent-5-tagname");
      setRecentFiveTopic(res.data.data);
      setTopicCreated(!topiCreated);
      setShowTopicDeleteModel(false);
    } catch (error) {
      console.log(error.message);
    }
  };

  const handleCreateTopic = async () => {
    if (!validateInputs()) return;
    const combinedTopic = `${createTagname}|${createUnit}`;
    
    try {
      await apiClient.post("/mqtt/create-tagname", {
        topic: combinedTopic,
        label: createLabel,
        device: createDevice,
      });
      toast.success("TagName created successfully!");
      await fetchRecentFiveTopics();
      setCreateTagname("");
      setCreateUnit("");
      setCreateLabel("");
      setCreateDevice("");
      setCreateTagnameValidationError("");
      setTopicCreated(!topiCreated);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const handleCreateAndSubscribeTopic = async () => {
    if (!validateInputs()) return;
    const combinedTopic = `${createTagname}|${createUnit}`;

    try {
      await apiClient.post("/mqtt/create-tagname", {
        topic: combinedTopic,
        label: createLabel,
        device: createDevice,
      });
      toast.success("TagName created successfully!");
      await apiClient.post("/mqtt/subscribe", {
        topic: combinedTopic,
      });
      storeSubscribedTopic(combinedTopic);
      toast.success(`Subscribed to ${combinedTopic} successfully!`);
      await fetchRecentFiveTopics();
      setCreateTagname("");
      setCreateUnit("");
      setCreateLabel("");
      setCreateDevice("");
      setCreateTagnameValidationError("");
      setTopicCreated(!topiCreated);
    } catch (error) {
      toast.error(error?.response?.data?.message);
    }
  };

  const handleDeleteTopic = async () => {
    try {
      let encodedTopic = encodeURIComponent(topicToDelete);
      await apiClient.delete(`/mqtt/delete-topic/${encodedTopic}`);
      toast.success(`${topicToDelete} deleted successfully!`);
      await fetchRecentFiveTopics();
      setTopicCreated(!topiCreated);
      setShowTopicDeleteModel(false);
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="_futuristic_dashboard_main_container">
      {showTopicDeleteModel && (
        <div className="_futuristic_dashboard_delete_model">
          <div>
            <div className="_futuristic_dashboard_delete_icon">
              <IoIosWarning size={"35"} />
            </div>
            <p>Are you sure you want to delete tagname: {topicToDelete}?</p>
            <div className="_futuristic_dashboard_delete_buttons">
              <button onClick={handleDeleteTopic}>Delete</button>
              <button onClick={() => setShowTopicDeleteModel(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <aside className="_futuristic_dashboard_sidebar">
        <h2 className="_futuristic_dashboard_title">Create TagName</h2>
        <p className={`_futuristic_dashboard_note ${createTagnameValidationError}`}>
          Format: company/gateway/tagname | unit
        </p>
        <input
          type="text"
          value={createTagname}
          onChange={handleTagnameChange}
          placeholder="Enter tagname (e.g., company/gateway/tagname)"
          className={`_futuristic_dashboard_search_input ${createTagnameValidationError}`}
        />
        <input
          type="text"
          value={createUnit}
          onChange={handleUnitChange}
          placeholder="Enter unit (e.g., m/s)"
          className={`_futuristic_dashboard_search_input ${createTagnameValidationError}`}
        />
        <input
          type="text"
          value={createLabel}
          onChange={handleLabelChange}
          placeholder="Enter label (e.g., Temperature)"
          className={`_futuristic_dashboard_search_input ${createTagnameValidationError}`}
        />
        <input
          type="text"
          value={createDevice}
          onChange={handleDeviceChange}
          placeholder="Enter device name (e.g., VMS8000)"
          className={`_futuristic_dashboard_search_input ${createTagnameValidationError}`}
        />
        <div className="_futuristic_dashboard_button_group">
          <button onClick={handleCreateTopic}>Create</button>
          <button onClick={handleCreateAndSubscribeTopic}>Create & Subscribe</button>
        </div>
        <div className="_futuristic_dashboard_divider"></div>
        <div className="_futuristic_dashboard_recent_section">
          <h3 className="_futuristic_dashboard_subtitle">Recent 5 Topics</h3>
          <div className="_futuristic_dashboard_list_container">
            {recetntFiveTopic?.map((item, index) => (
              <div key={index} className="_futuristic_dashboard_list_item">
                <span>{item.topic}</span>
                <span
                  className="_futuristic_dashboard_action_icon"
                  onClick={() => [
                    setTopicToDelete(item.topic),
                    setShowTopicDeleteModel(true),
                  ]}
                >
                  <MdDelete />
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className="_futuristic_dashboard_divider"></div>
        <div className="_futuristic_dashboard_subscribe_all">
          <IoIosWarning size={"20"} /> Subscribe to All TagNames
        </div>
      </aside>
      <main className="_futuristic_dashboard_main_content">
        <section className="_futuristic_dashboard_section">
          <h3 className="_futuristic_dashboard_subtitle">All Topics</h3>
          <div className="_futuristic_dashboard_searchbar_container">
            <input
              type="text"
              onChange={handleTopicSearchFilter}
              placeholder="Search by tagname"
              className="_futuristic_dashboard_search_input"
            />
            <button className="_futuristic_dashboard_search_button">
              <IoSearch />
            </button>
          </div>
          <div className="_futuristic_dashboard_list_container">
            <AllTopicsList
              topiCreated={topiCreated}
              setTopicToDelete={setTopicToDelete}
              topiListFilter={topiListFilter}
              topicList={topicList}
              storeSubscribedTopic={storeSubscribedTopic}
              setShowTopicDeleteModel={setShowTopicDeleteModel}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default TagCreation;