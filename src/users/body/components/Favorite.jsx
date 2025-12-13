import React, { useEffect, useState, useCallback } from "react";
import "../../style.css";
import { useSelector, useDispatch } from "react-redux";
import apiClient from "../../../api/apiClient";
import { setUserDetails } from "../../../redux/slices/UserDetailsSlice";
import { toast } from "react-toastify";
import Loader from "../../loader/Loader";
import LiveDataTd from "../common/LiveDataTd";
import { IoMdRemoveCircle } from "react-icons/io";
import { BiSolidReport } from "react-icons/bi";
import WeekTd from "../common/WeekTd";
import YestardayTd from "../common/YestardayTd";
import TodayTd from "../common/TodayTd";
import { VscGraph } from "react-icons/vsc";
import { FaDigitalOcean } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { LuLayoutDashboard } from "react-icons/lu";
import { TbChartInfographic } from "react-icons/tb";
import { MdEdit } from "react-icons/md";
import ReactPaginate from "react-paginate";
import "bootstrap/dist/css/bootstrap.min.css";

const Favorites = () => {
  const [loggedInUser, setLoggedInUser] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userSlice);
  const [favoriteList, setFavoriteList] = useState([]);
  const navigate = useNavigate();
  const [rmFavModel, setRmFavModel] = useState(false);
  const [topicToRm, setTopicToRm] = useState(null);
  const [allTopicsWithLabels, setAllTopicsWithLabels] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [timestamps, setTimestamps] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const itemsPerPage = 10;

  useEffect(() => {
    if (user.id) {
      fetchUserDetails();
    }
    fetchAllTopicsLabels();
  }, [user.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchUserDetails = async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      const userData = res?.data?.data;
      setLoggedInUser(userData);
      dispatch(setUserDetails(userData));
      setFavoriteList(userData?.favorites || []);
      setLocalLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to fetch user details");
      setLocalLoading(false);
    }
  };

  const fetchAllTopicsLabels = async () => {
    try {
      const res = await apiClient.get(`/mqtt/all-topics-labels`);
      setAllTopicsWithLabels(res.data.data);
    } catch (error) {
      console.log("Error fetching topics with labels:", error.message);
    }
  };

  const parseFavorite = (fav) => {
    const topic = typeof fav === "string" ? fav : fav.topic;
    const [path, unit] = topic.split("|");
    const tagNameRaw = path.split("/")[2] || path;
    const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
    const tagName = matchedTopic ? matchedTopic.label : tagNameRaw;
    return {
      topic,
      tagName,
      unit: unit || "-",
      isFFT: unit === "fft",
    };
  };

  const handleRemoveFavorite = async (favorite) => {
    try {
      await apiClient.delete(`/auth/${user.role}/${user.id}/favorites`, {
        data: { topic: favorite.topic },
      });
      setFavoriteList((prev) =>
        prev.filter((fav) => parseFavorite(fav).topic !== favorite.topic)
      );
      toast.success("Topic removed from watchlist");
      fetchUserDetails(); // Refresh user details
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to remove topic from watchlist");
    }
  };

  const handleTimestampUpdate = useCallback((topic, timestamp) => {
    setTimestamps((prev) => ({
      ...prev,
      [topic]: timestamp,
    }));
  }, []);

  const getRelativeTime = (topic) => {
    const timestamp = timestamps[topic];
    if (!timestamp) return "-";

    const lastUpdateIST = new Date(timestamp);
    const currentTimeIST = new Date(currentTime.getTime());

    const diffSeconds = Math.floor((currentTimeIST - lastUpdateIST) / 1000);
    const displaySeconds = Math.max(0, diffSeconds);
    if (displaySeconds < 60) return `${displaySeconds}s ago`;
    const minutes = Math.floor(displaySeconds / 60);
    return `${minutes}m ago`;
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

  const parsedFavorites = favoriteList.map(parseFavorite);
  const pageCount = Math.ceil(parsedFavorites.length / itemsPerPage);
  const currentItems = parsedFavorites.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  if (localLoading) {
    return <Loader />;
  }

  return (
    <div className="allusers_dashboard_main_container">
      {rmFavModel && (
        <div className="watchlist_remove_model_container">
          <div>
            <p>
              Are you sure you want to remove{" "}
              <span style={{ color: "red", textDecoration: "underline", cursor: "pointer" }}>
                {topicToRm?.tagName}
              </span>{" "}
              from watchlist...!
            </p>
            <div>
              <button
                onClick={() => {
                  handleRemoveFavorite(topicToRm);
                  setRmFavModel(false);
                  setTopicToRm(null);
                }}
              >
                Remove
              </button>
              <button
                onClick={() => {
                  setRmFavModel(false);
                  setTopicToRm(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="alluser_alloperators_container">
        <div className="alluser_alloperators_scrollable-table">
          <table className="alluser_alloperators_table">
            <thead>
              <tr>
                <th style={{ background: "red" }}>Parameters</th>
                <th className="allusers_dashboard_live_data_th" style={{ background: "rgb(150, 2, 208)" }}>
                  Live
                </th>
                <th>Unit</th>
                <th>Relative</th>
                <th>LastUpdatedAt</th>
                <th>TodayMax</th>
                <th>YesterdayMax</th>
                <th>WeekMax</th>
                <th>LayoutView</th>
                <th>Edit/Graph/History</th>
                <th>Remove</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((parsed, index) => (
                <tr key={`${parsed.topic}-${index}`}>
                  <td style={{ background: "#34495e", color: "white" }}>{parsed.tagName}</td>
                  <LiveDataTd topic={parsed.topic} onTimestampUpdate={handleTimestampUpdate} />
                  <td>{parsed.unit}</td>
                  <td>{getRelativeTime(parsed.topic)}</td>
                  <td>{getLastUpdatedAt(parsed.topic)}</td>
                  <TodayTd topic={parsed.topic} />
                  <YestardayTd topic={parsed.topic} />
                  <WeekTd topic={parsed.topic} />
                  <td>
                    <LuLayoutDashboard
                      size={20}
                      style={{ cursor: "pointer", color: "gray" }}
                      className="icon"
                      onClick={() =>
                        navigate(`/allusers/layoutview/${encodeURIComponent(parsed.topic)}/${loggedInUser?.layout}`)
                      }
                    />
                  </td>
                  <td className="allusers_dashboard_graph_digital_td_">
                    <button onClick={() => navigate(`/allusers/editsinglegraph/${encodeURIComponent(parsed.topic)}`)}>
                      <MdEdit size={18} style={{ cursor: "pointer" }} className="icon" />
                    </button>
                    <button onClick={() => navigate(`/allusers/viewsinglegraph/${encodeURIComponent(parsed.topic)}`)}>
                      <VscGraph />
                    </button>
                    <button
                      onClick={() => navigate(`/allusers/singlehistorygraph/${encodeURIComponent(parsed.topic)}`)}
                    >
                      <TbChartInfographic style={{ cursor: "pointer" }} />
                    </button>
                  </td>
                  <td>
                    <IoMdRemoveCircle
                      color="red"
                      size={20}
                      style={{ cursor: "pointer" }}
                      onClick={() => {
                        setRmFavModel(true);
                        setTopicToRm(parsed);
                      }}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {parsedFavorites.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                fontSize: "18px",
                color: "#666",
                background: "#f9f9f9",
                borderRadius: "8px",
                marginTop: "20px",
                border: "1px solid #ddd",
              }}
            >
              Empty List
            </div>
          )}
          {parsedFavorites.length > 0 && (
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
          )}
        </div>
      </div>
    </div>
  );
};

export default Favorites;