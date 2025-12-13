import React, { useEffect, useState, useCallback, useMemo, useContext } from "react";
import "../../style.css";
import { useSelector, useDispatch } from "react-redux";
import apiClient from "../../../api/apiClient";
import { setUserDetails } from "../../../redux/slices/UserDetailsSlice";
import { toast } from "react-toastify";
import Loader from "../../loader/Loader";
import LiveDataTd from "../common/LiveDataTd";
import { FaRegBookmark, FaDigitalOcean } from "react-icons/fa";
import { TbChartInfographic } from "react-icons/tb";
import { BsBookmarkStarFill } from "react-icons/bs";
import { BiSolidReport } from "react-icons/bi";
import WeekTd from "../common/WeekTd";
import YestardayTd from "../common/YestardayTd";
import TodayTd from "../common/TodayTd";
import { VscGraph } from "react-icons/vsc";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import ReactPaginate from "react-paginate";
import "bootstrap/dist/css/bootstrap.min.css";
import { IoMdArrowDropup, IoMdArrowDropdown } from "react-icons/io";
import { IoSearchSharp } from "react-icons/io5";
import { navHeaderContaxt } from "../../../contaxts/navHeaderContaxt";

const customStyles = `
  .custom-edit-label-modal-overlay {
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

  .custom-edit-label-modal {
    background: #fff;
    border-radius: 8px;
    padding: 20px;
    width: 400px;
    max-width: 90%;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    position: relative;
  }

  .custom-edit-label-modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }

  .custom-edit-label-modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #333;
  }

  .custom-edit-label-modal-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
  }

  .custom-edit-label-modal-body {
    margin-bottom: 20px;
  }

  .custom-edit-label-modal-label {
    display: block;
    font-size: 14px;
    font-weight: 500;
    color: #555;
    margin-bottom: 8px;
  }

  .custom-edit-label-modal-input {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
    color: #333;
    outline: none;
    transition: border-color 0.2s;
  }

  .custom-edit-label-modal-input:focus {
    border-color: #007bff;
  }

  .custom-edit-label-modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  .custom-edit-label-modal-button {
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  .custom-edit-label-modal-button-ok {
    background: #007bff;
    color: #fff;
  }

  .custom-edit-label-modal-button-ok:hover {
    background: #0056b3;
  }

  .custom-edit-label-modal-button-cancel {
    background: #f1f1f1;
    color: #333;
  }

  .custom-edit-label-modal-button-cancel:hover {
    background: #e0e0e0;
  }

  .custom-tagname-cell {
    position: relative;
    padding: 8px;
  }

  .custom-edit-icon {
    position: absolute;
    top: 4px;
    right: 4px;
    cursor: pointer;
    color: #007bff;
    transition: color 0.2s;
  }

  .custom-edit-icon:hover {
    color: #0056b3;
  }
`;

const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = customStyles;
document.head.appendChild(styleSheet);

const Dashboard = () => {
  const [loggedInUser, setLoggedInUser] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userSlice);
  const [favoriteList, setFavoriteList] = useState([]);
  const [graphwlList, setGraphwlList] = useState([]);
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "none" });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timestamps, setTimestamps] = useState({});
  const [employeesList, setEmployeesList] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [allTopicsWithLabels, setAllTopicsWithLabels] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState("all");
  const itemsPerPage = 9;
  const { setNavHeader } = useContext(navHeaderContaxt);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    fetchAllTopicsLabels();
  }, []);

  const fetchAllTopicsLabels = async () => {
    try {
      const res = await apiClient.get(`/mqtt/all-topics-labels`);
      console.log("Fetched all topics with labels and device:", res.data.data);
      setAllTopicsWithLabels(res.data.data);
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getRelativeTime = (topic) => {
    const timestamp = timestamps[topic];
    if (!timestamp) return "-";

    const lastUpdateIST = new Date(timestamp);
    const currentTimeIST = new Date(currentTime.getTime());

    const diffSeconds = Math.floor((currentTimeIST - lastUpdateIST) / 1000);
    const displaySeconds = Math.max(0, diffSeconds);

    const days = Math.floor(displaySeconds / (24 * 3600));
    const hours = Math.floor((displaySeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((displaySeconds % 3600) / 60);
    const seconds = displaySeconds % 60;

    let relativeTime = "";
    if (days > 0) relativeTime += `${days}d `;
    if (hours > 0 || days > 0) relativeTime += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) relativeTime += `${minutes}m `;
    if (days === 0 && hours === 0 && minutes === 0) relativeTime += `${seconds}s `;

    return relativeTime.trim() + "ago";
  };

  const getLastUpdatedAt = (topic) => {
    const timestamp = timestamps[topic];
    if (!timestamp) return "-";

    const lastUpdateIST = new Date(timestamp);

    const day = String(lastUpdateIST.getDate()).padStart(2, "0");
    const month = String(lastUpdateIST.getMonth() + 1).padStart(2, "0");
    const year = lastUpdateIST.getFullYear();
    const hours = String(lastUpdateIST.getHours()).padStart(2, "0");
    const minutes = String(lastUpdateIST.getMinutes()).padStart(2, "0");
    const seconds = String(lastUpdateIST.getSeconds()).padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}:${seconds} IST`;
  };

  const handleTimestampUpdate = useCallback((topic, timestamp) => {
    setTimestamps((prev) => ({
      ...prev,
      [topic]: timestamp,
    }));
  }, []);

  const fetchUserDetails = useCallback(async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      const userData = res?.data?.data;
      setLoggedInUser(userData);
      const employees = res?.data?.data?.employees || [];
      console.log("Fetched user data:", employees);
      setEmployeesList(employees);
      dispatch(setUserDetails(userData));
      setFavoriteList(userData?.favorites || []);
      setGraphwlList(userData?.graphwl || []);

      if (user.role === "supervisor" && employees.length > 0) {
        const savedHeaderOne = localStorage.getItem("selectedHeaderOne");
        const defaultEmployee = savedHeaderOne
          ? employees.find((emp) => emp.headerOne === savedHeaderOne) || employees[0]
          : employees[0];
        setSelectedEmployee(defaultEmployee);
        setNavHeader(defaultEmployee);
      } else {
        setNavHeader({
          headerOne: userData?.headerOne || userData?.name || "Default Header",
          headerTwo: userData?.headerTwo || userData?.address || "Default Address",
        });
      }
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to fetch user details");
    } finally {
      setLocalLoading(false);
    }
  }, [dispatch, user.role, user.id, setNavHeader]);

  useEffect(() => {
    if (user.id) fetchUserDetails();
  }, [user.id, fetchUserDetails]);

  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, selectedDevice]);

  const handleAddFavorite = useCallback(async (topic) => {
    try {
      await apiClient.post(`/auth/${user.role}/${user.id}/favorites`, { topic });
      setFavoriteList((prev) => [...prev, topic]);
      toast.success("Tagname added to watchlist");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add topic to favorites");
    }
  }, [user.role, user.id]);

  const handleRemoveFavorite = useCallback(async (topic) => {
    try {
      await apiClient.delete(`/auth/${user.role}/${user.id}/favorites`, { data: { topic } });
      setFavoriteList((prev) => prev.filter((fav) => fav !== topic));
      toast.success("Topic removed from watchlist");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to remove topic from watchlist");
    }
  }, [user.role, user.id]);

  const handleAddGraphwl = useCallback(async (topic) => {
    try {
      await apiClient.post(`/auth/${user.role}/${user.id}/graphwl`, { topic });
      setGraphwlList((prev) => [...prev, topic]);
      toast.success("Tagname added to graph watchlist");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to add topic to graph watchlist");
    }
  }, [user.role, user.id]);

  const handleRemoveGraphwl = useCallback(async (topic) => {
    try {
      await apiClient.delete(`/auth/${user.role}/${user.id}/graphwl`, { data: { topic } });
      setGraphwlList((prev) => prev.filter((fav) => fav !== topic));
      toast.success("Topic removed from graph watchlist");
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to remove topic from graph watchlist");
    }
  }, [user.role, user.id]);

  const handlePageClick = useCallback(({ selected }) => {
    setCurrentPage(selected);
  }, []);

  const handleSort = useCallback((key) => {
    setSortConfig((prevSortConfig) => {
      let direction = "asc";
      if (prevSortConfig.key === key) {
        if (prevSortConfig.direction === "asc") {
          direction = "desc";
        } else if (prevSortConfig.direction === "desc") {
          direction = "none";
        }
      }
      return direction === "none" ? { key: null, direction: "none" } : { key, direction };
    });
  }, []);

  const getSortSymbol = useCallback((key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === "asc" ? <IoMdArrowDropup /> : sortConfig.direction === "desc" ? <IoMdArrowDropdown /> : "↔";
    }
    return "↔";
  }, [sortConfig]);

  const handleEmployeeSelect = (employeeId) => {
    const selected = employeesList.find((emp) => emp._id === employeeId);
    setSelectedEmployee(selected);
    setNavHeader(selected);
    setLoggedInUser((prev) => ({ ...prev, topics: selected.topics || [] }));
    setSelectedDevice("all"); // Reset device filter when employee changes
    localStorage.setItem("selectedHeaderOne", selected.headerOne);
  };

  const handleDeviceSelect = (device) => {
    setSelectedDevice(device);
    setCurrentPage(0); // Reset to first page when device filter changes
  };

  const uniqueDevices = useMemo(() => {
    const topicsToParse = user.role === "supervisor" && selectedEmployee ? selectedEmployee.topics : loggedInUser?.topics;
    const devices = topicsToParse
      ?.map((topic) => {
        const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
        return matchedTopic?.device || null;
      })
      .filter((device) => device); // Remove null/undefined devices
    return ["all", ...new Set(devices)]; // Include "all" and unique devices
  }, [allTopicsWithLabels, selectedEmployee, loggedInUser?.topics, user.role]);

  const parsedTopics = useMemo(() => {
    const topicsToParse = user.role === "supervisor" && selectedEmployee ? selectedEmployee.topics : loggedInUser?.topics;
    return topicsToParse
      ?.filter((topic) => !topic.endsWith("|backup")) // Exclude topics ending with "|backup"
      .map((topic) => {
        const [path, unit] = topic.split("|");
        const tagName = path.split("/")[2];
        const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
        const label = matchedTopic ? matchedTopic.label : tagName;
        return {
          topic,
          tagName: label,
          unit: unit || "-",
          isFFT: unit === "fft",
          weekMax: Math.random() * 100,
          yesterdayMax: Math.random() * 100,
          todayMax: Math.random() * 100,
          device: matchedTopic?.device || "-",
        };
      }) || [];
  }, [loggedInUser?.topics, selectedEmployee, user.role, allTopicsWithLabels]);

  const filteredParsedTopics = useMemo(() => {
    let filtered = parsedTopics;
    
    // Apply device filter
    if (selectedDevice !== "all") {
      filtered = filtered.filter((topic) => topic.device === selectedDevice);
    }

    // Apply search query filter
    if (!searchQuery.trim()) return filtered;
    const query = searchQuery.trim().toLowerCase();
    return filtered.filter((topic) =>
      topic.tagName.toLowerCase().includes(query)
    );
  }, [parsedTopics, searchQuery, selectedDevice]);

  const sortedParsedTopics = useMemo(() => {
    let sortableItems = [...filteredParsedTopics];
    if (sortConfig.key && sortConfig.direction !== "none") {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredParsedTopics, sortConfig]);

  const currentItems = useMemo(() => {
    const offset = currentPage * itemsPerPage;
    return sortedParsedTopics.slice(offset, offset + itemsPerPage);
  }, [sortedParsedTopics, currentPage, itemsPerPage]);

  const pageCount = useMemo(() => Math.ceil(sortedParsedTopics.length / itemsPerPage), [sortedParsedTopics, itemsPerPage]);

  const openEditLabelModal = (topic) => {
    const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
    setSelectedTopic(matchedTopic);
    setNewLabel(matchedTopic ? matchedTopic.label : "");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTopic(null);
    setNewLabel("");
  };

  const handleButtonOkUpdateLabel = (e) => {
    if (e.key === "Enter") {
      handleUpdateLabel();
    }
  };

  const handleUpdateLabel = async () => {
    if (!newLabel.trim()) {
      toast.warning("Label cannot be empty");
      return;
    }

    if (newLabel.trim().length > 30) {
      toast.warning("Label cannot exceed 30 characters");
      return;
    }

    if (!selectedTopic) {
      toast.error("No topic selected for update");
      return;
    }

    try {
      await apiClient.put(`/mqtt/topic-label-update/${selectedTopic._id}`, {
        updatedLabel: newLabel.trim(),
      });

      setAllTopicsWithLabels((prev) =>
        prev.map((item) =>
          item._id === selectedTopic._id ? { ...item, label: newLabel.trim() } : item
        )
      );

      toast.success("Label updated successfully");
      closeModal();
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to update label");
    }
  };

  if (localLoading) return <Loader />;

  return (
    <div className="allusers_dashboard_main_container">
      <section className="alluser_dashboard_controles_container" style={{ marginTop: "15px", display: "flex", gap: "15px", flexWrap: "wrap", alignItems: "center" }}>
        <div
          style={{
            width: "350px",
            display: "flex",
            flexWrap: "nowrap",
            padding: "0 15px",
            borderRadius: "25px",
            overflow: "hidden",
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            border: "1px solid #ddd",
          }}
        >
          <input
            type="text"
            placeholder="Search by tag name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "85%",
              padding: "7px 17px",
              outline: "none",
              border: "none",
            }}
          />
          <button
            style={{
              border: "none",
              outline: "none",
              width: "15%",
              transform: "translateX(15px)",
              background: "red",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <IoSearchSharp />
          </button>
        </div>
        {user?.role === "supervisor" && (
          <>
            <div className="dropdown alluser_dropdown_companyswitch_">
              <select
                className="form-select"
                value={selectedEmployee?._id || ""}
                onChange={(e) => handleEmployeeSelect(e.target.value)}
                style={{ width: "200px", padding: "8px" }}
              >
                <option value="" disabled>Select an user</option>
                {employeesList?.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="dropdown alluser_dropdown_deviceswitch_">
              <select
                className="form-select"
                value={selectedDevice}
                onChange={(e) => handleDeviceSelect(e.target.value)}
                style={{ width: "200px", padding: "8px" }}
              >
                {uniqueDevices.map((device) => (
                  <option key={device} value={device}>
                    {device === "all" ? "All Devices" : device}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </section>

      <div className="alluser_alloperators_container">
        <div className="alluser_alloperators_scrollable-table">
          <table className="alluser_alloperators_table">
            <thead>
              <tr>
                <th style={{ background: "red" }}>
                  Parameters
                </th>
                <th className="allusers_dashboard_live_data_th" style={{ background: "rgb(150, 2, 208)", minWidth: "100px", transform: "translateY(1px)" }}>
                  Live
                </th>
                <th>Unit</th>
                <th>Relative</th>
                <th>LastUpdatedAt</th>
                <th style={{ minWidth: "100px" }}>TodayMax</th>
                <th>YesterdayMax</th>
                <th>WeekMax</th>
                <th>LayoutView</th>
                <th>Edit/Graph/History</th>
                {user?.role !== "supervisor" && <th>Graph[WL]</th>}
                {user?.role !== "supervisor" && <th>WatchList</th>}
              </tr>
            </thead>
            <tbody>
              {currentItems.map(({ topic, tagName, unit, isFFT }, index) => (
                <tr key={`${topic}-${index}`}>
                  <td className="custom-tagname-cell" style={{ background: "#34495e", color: "white" }}>
                    {tagName}
                    {user?.role === "supervisor" && (
                      <MdEdit
                        size={16}
                        className="custom-edit-icon"
                        onClick={() => openEditLabelModal(topic)}
                      />
                    )}
                  </td>
                  <LiveDataTd topic={topic} onTimestampUpdate={handleTimestampUpdate} />
                  <td>{unit}</td>
                  <td>{getRelativeTime(topic)}</td>
                  <td>{getLastUpdatedAt(topic)}</td>
                  <TodayTd topic={topic} />
                  <YestardayTd topic={topic} />
                  <WeekTd topic={topic} />
                  <td>
                    <LuLayoutDashboard
                      size={20}
                      style={{ cursor: "pointer", color: "gray" }}
                      className="icon"
                      onClick={() => navigate(`/allusers/layoutview/${encodeURIComponent(topic)}/${loggedInUser?.layout}`)}
                    />
                  </td>
                  <td className="allusers_dashboard_graph_digital_td_">
                    <button onClick={() => navigate(`/allusers/editsinglegraph/${encodeURIComponent(topic)}`)}>
                      {!isFFT && (
                        <MdEdit
                          size={18}
                          style={{ cursor: "pointer" }}
                          className="icon"
                        />
                      )}
                    </button>
                    <button onClick={() => navigate(`/allusers/viewsinglegraph/${encodeURIComponent(topic)}`)}>
                      <VscGraph />
                    </button>
                    {!isFFT && (
                      <button
                        onClick={() =>
                          navigate(`/allusers/singlehistorygraph/${encodeURIComponent(topic)}`)
                        }
                      >
                        <TbChartInfographic style={{ cursor: "pointer" }} />
                      </button>
                    )}
                  </td>
                  {user?.role !== "supervisor" && (
                    <td>
                      {graphwlList.includes(topic) ? (
                        <BsBookmarkStarFill
                          color="rgb(158, 32, 189)"
                          size={20}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleRemoveGraphwl(topic)}
                        />
                      ) : (
                        <FaRegBookmark
                          color="rgb(158, 32, 189)"
                          size={18}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleAddGraphwl(topic)}
                        />
                      )}
                    </td>
                  )}
                  {user?.role !== "supervisor" && (
                    <td>
                      {favoriteList.includes(topic) ? (
                        <BsBookmarkStarFill
                          color="green"
                          size={20}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleRemoveFavorite(topic)}
                        />
                      ) : (
                        <FaRegBookmark
                          color="green"
                          size={18}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleAddFavorite(topic)}
                        />
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="d-flex justify-content-center mt-4 mb-4">
            <ReactPaginate
              previousLabel="Previous"
              nextLabel="Next"
              breakLabel="..."
              pageCount={pageCount}
              marginPagesDisplayed={2}
              pageRangeDisplayed={2}
              onPageChange={handlePageClick}
              containerClassName="pagination"
              pageClassName="page-item"
              pageLinkClassName="page-link"
              previousClassName="page-item"
              previousLinkClassName="page-link"
              nextClassName="page-item"
              nextLinkClassName="page-link"
              breakClassName="page-item"
              breakLinkClassName="page-link"
              activeClassName="active"
              disabledClassName="disabled"
              forcePage={currentPage}
            />
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="custom-edit-label-modal-overlay">
          <div className="custom-edit-label-modal">
            <div className="custom-edit-label-modal-header">
              <h2 className="custom-edit-label-modal-title">Edit Label</h2>
              <button className="custom-edit-label-modal-close" onClick={closeModal}>
                ×
              </button>
            </div>
            <div className="custom-edit-label-modal-body">
              <label className="custom-edit-label-modal-label">Current Label:</label>
              <input
                type="text"
                value={selectedTopic?.label || ""}
                disabled
                className="custom-edit-label-modal-input"
              />
              <label className="custom-edit-label-modal-label" style={{ marginTop: "12px" }}>
                New Label (max 30 chars):
              </label>
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value.slice(0, 30))}
                className="custom-edit-label-modal-input"
                placeholder="Enter new label (max 30 chars)"
                maxLength={30}
                onKeyDown={handleButtonOkUpdateLabel}
              />
            </div>
            <div className="custom-edit-label-modal-footer">
              <button
                className="custom-edit-label-modal-button custom-edit-label-modal-button-cancel"
                onClick={closeModal}
              >
                Cancel
              </button>
              <button
                className="custom-edit-label-modal-button custom-edit-label-modal-button-ok"
                onClick={handleUpdateLabel}
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

export default Dashboard;