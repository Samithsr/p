import React, { useContext, useEffect, useState } from "react";
import DigitalViewOne from "./../graphs/digitalview/DigitalViewOne";
import { useDispatch, useSelector } from "react-redux";
import Loader from "../../loader/Loader";
import "../Body.css";
import { toast } from "react-toastify";
import { setUserDetails } from "../../../redux/slices/UserDetailsSlice";
import apiClient from "../../../api/apiClient";
import { VscGraph } from "react-icons/vsc";
import { BiSolidReport } from "react-icons/bi";
import Type2 from "./../../../admin/components/digitalmeters/Type2";
import Type3 from "./../../../admin/components/digitalmeters/Type3";
import Type4 from "../../../admin/components/digitalmeters/Type4";
import { useNavigate } from "react-router-dom";
import Type1 from "../../../admin/components/digitalmeters/Type1";
import Type5 from "../../../admin/components/digitalmeters/Type5";
import Type6 from "../../../admin/components/digitalmeters/Type6";
import Type7 from "../../../admin/components/digitalmeters/Type7";
import { navHeaderContaxt } from "../../../contaxts/navHeaderContaxt";
import ReactPaginate from "react-paginate";
import "bootstrap/dist/css/bootstrap.min.css";

const DigitalMeter = () => {
  const { user } = useSelector((state) => state.userSlice);
  const dispatch = useDispatch();
  const [loggedInUser, setLoggedInUser] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();
  const { navHeader } = useContext(navHeaderContaxt);
  const [assignedTopicList, setAssignedTopicList] = useState([]);
  const [topicBasedDigitalMeter, setTopicBasedDigitalMeter] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [allTopicsWithLabels, setAllTopicsWithLabels] = useState([]); // New state for fetched topics with labels
  const itemsPerPage = 8; // 8 topics per page

  useEffect(() => {
    fetchAllTopicsLabels();
  }, []);

  const fetchAllTopicsLabels = async () => {
    try {
      const res = await apiClient.get(`/mqtt/all-topics-labels`);
      setAllTopicsWithLabels(res.data.data); // Store the fetched topics with labels
    } catch (error) {
      console.log(error.message);
    }
  };

  useEffect(() => {
    if (user.id) {
      fetchUserDetails();
    }
  }, [user.id]);

  const fetchUserDetails = async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      setLoggedInUser(res?.data?.data);
      setAssignedTopicList(res?.data?.data?.topics);
      setTopicBasedDigitalMeter(res?.data?.data?.assignedDigitalMeters);
      dispatch(setUserDetails(res?.data?.data));
    } catch (error) {
      toast.error(error?.response?.data?.error);
    } finally {
      setLocalLoading(false);
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  // Determine the source of digital meters and topics based on role, filtering out backup topics
  const digitalMeters = user.role === "supervisor" ? navHeader?.assignedDigitalMeters || [] : topicBasedDigitalMeter;
  const topics = user.role === "supervisor" ? navHeader?.topics?.filter((topic) => !topic.endsWith("|backup")) || [] : assignedTopicList?.filter((topic) => !topic.endsWith("|backup")) || [];

  // Filter topics to only those with assigned digital meters
  const filteredTopics = topics.filter((topic) =>
    digitalMeters.some((meter) => meter.topic === topic)
  );

  // Pagination logic
  const pageCount = Math.ceil(filteredTopics.length / itemsPerPage);
  const currentTopics = filteredTopics.slice(
    currentPage * itemsPerPage,
    (currentPage + 1) * itemsPerPage
  );

  // Function to get the label for a topic
  const getTopicLabel = (topic) => {
    const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
    if (matchedTopic) {
      return matchedTopic.label;
    }
    // Fallback to sliced topic name if no label is found
    return topic.split("|")[0].split("/")[2];
  };

  if (localLoading) {
    return <Loader />;
  }

  if (digitalMeters.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginTop: "20px",
          color: "gray",
        }}
      >
        <h3>No Digital Meters Available!</h3>
      </div>
    );
  }

  const getMeterDetails = (topic) => {
    const meter = digitalMeters.find((meter) => meter.topic === topic);
    if (!meter) return null; // Don't render anything if no meter is assigned

    return (
      <div
        className="meter-details"
        style={{ display: "flex", height: "100%", alignItems: "center", justifyContent: "center" }}
      >
        {meter.meterType === "Type1" && (
          <Type1 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type2" && (
          <Type2 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type3" && (
          <Type3 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type4" && (
          <Type4 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type5" && (
          <Type5 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type6" && (
          <Type6 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
        {meter.meterType === "Type7" && (
          <Type7 {...meter} unit={topic.includes("|") ? topic.split("|")[1] : ""} />
        )}
      </div>
    );
  };

  return (
    <>
      <div className="allusers_digitalview_main_container">
        {currentTopics.map((topic, index) => (
          <div key={index} className="topic-container">
            <div className="allusers_digitalview_main_container_header_container">
              <p>{getTopicLabel(topic)}</p> {/* Use label instead of sliced topic */}
              <div>
                <div onClick={() => navigate(`/allusers/viewsinglegraph/${encodeURIComponent(topic)}`)}>
                  <VscGraph />
                </div>
                <div onClick={() => navigate(`/allusers/report/${encodeURIComponent(topic)}`)}>
                  <BiSolidReport />
                </div>
              </div>
            </div>
            {getMeterDetails(topic)}
          </div>
        ))}
      </div>
      {filteredTopics.length > itemsPerPage && (
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
    </>
  );
};

export default DigitalMeter;