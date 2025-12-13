import React, { useEffect, useState } from "react";
import "../../style.css";
import { useNavigate, useParams } from "react-router-dom";
import { IoMdArrowBack } from "react-icons/io";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";
import Loader from "../../loader/Loader";
import { FaRegBookmark, FaDigitalOcean } from "react-icons/fa";
import { VscGraph } from "react-icons/vsc";
import WeekTd from "../common/WeekTd";
import YestardayTd from "../common/YestardayTd";
import TodayTd from "../common/TodayTd";
import LiveDataTd from "../common/LiveDataTd";
import { BiSolidReport } from "react-icons/bi";
import { BsBookmarkStarFill } from "react-icons/bs";
import { useSelector } from "react-redux";
import { LuLayoutDashboard } from "react-icons/lu";
import { MdOutlineClose } from "react-icons/md";
import { MdEdit } from "react-icons/md";
import ReactPaginate from "react-paginate";

const SingleUserDashBoard = () => {
  const { user } = useSelector((state) => state.userSlice);
  const [localLoading, setLocalLoading] = useState(false);
  const [singleUserData, setSingleUserData] = useState({});
  const { id } = useParams();
  const [favoriteList, setFavoriteList] = useState([]);
  const [supervisorId, setSupervisorId] = useState();
  const [managerId, setManagerId] = useState();
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 20;
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchSingleUser();
    }
  }, [id]);

  const fetchSingleUser = async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(`/auth/employee/${id}`);
      const data = res?.data?.data;
      setSingleUserData(data);
      setFavoriteList(
        (data.role === "supervisor"
          ? data?.manager?.favorites
          : data?.supervisor?.favorites) || []
      );
      setSupervisorId(data?.supervisor?._id);
      setManagerId(data?.manager?._id);
    } catch (error) {
      if(error?.response.status === 404){
        const res = await apiClient.get(`/auth/supervisor/${id}`);
        const data = res?.data?.data;
        setSingleUserData(data);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleAddFavorite = async (topic) => {
    try {
      await apiClient.post(`/auth/${user.role}/${user.id}/favorites`, { topic });
      setFavoriteList((prev) => [...prev, topic]);
      toast.success("Tagname added to watchlist");
    } catch (error) {
      toast.error(
        error?.response?.data?.error || "Failed to add topic to watchlist"
      );
    }
  };

  const handleRemoveFavorite = async (topic) => {
    try {
      await apiClient.delete(`/auth/${user.role}/${user.id}/favorites`, {
        data: { topic },
      });
      setFavoriteList((prev) => prev.filter((fav) => fav !== topic));
      toast.success("Topic removed from watchlist");
    } catch (error) {
      toast.error(
        error?.response?.data?.error || "Failed to remove topic from watchlist"
      );
    }
  };

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
  };

  // Pagination logic for topics
  const topics = singleUserData?.topics || [];
  const pageCount = Math.ceil(topics.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentItems = topics.slice(offset, offset + itemsPerPage);

  if (localLoading) {
    return <Loader />;
  }

  return (
    <div className="singleuserdashboard_main_container">
      <div>
        {singleUserData?.name} dashboard{" "}
        <span
          className="singleuserdashboard_close_icon"
          onClick={() => navigate(-1)}
        >
          <MdOutlineClose color="red" size={"25"} />
        </span>
      </div>

      <div className="allusers_dashboard_main_container">
        <div className="alluser_alloperators_container">
          <div className="alluser_alloperators_scrollable-table">
            <table className="alluser_alloperators_table">
              <thead>
                <tr>
                  <th style={{ background: "red" }}>Tag name</th>
                  <th
                    className="allusers_dashboard_live_data_th"
                    style={{ background: "rgb(150, 2, 208)" }}
                  >
                    Live
                  </th>
                  <th>Unit</th>
                  <th>WeekMax</th>
                  <th>YesterdayMax</th>
                  <th>TodayMax</th>
                  <th>Report</th>
                  <th>LayoutView</th>
                  <th>Graph/Digital</th>
                  <th>WatchList</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.map((item, index) => (
                  <tr key={index}>
                    <td style={{ background: "#34495e", color: "white" }}>
                      {item?.split("|")[0].split("/")[2]}
                    </td>
                    <LiveDataTd topic={item} />
                    <td style={{ background: "#34495e", color: "white" }}>
                      {item.split("|")[1] || "N/A"}
                    </td>
                    <WeekTd topic={item} />
                    <YestardayTd topic={item} />
                    <TodayTd topic={item} />
                    <td>
                      <BiSolidReport
                        onClick={() => {
                          const encodedTopic = encodeURIComponent(item);
                          navigate(`/allusers/report/${encodedTopic}`);
                        }}
                        size={"20"}
                        style={{ cursor: "pointer" }}
                        color="gray"
                      />
                    </td>
                    <td>
                      <LuLayoutDashboard
                        size={"20"}
                        color="gray"
                        style={{ cursor: "pointer" }}
                        onClick={() => {
                          const encodedTopic = encodeURIComponent(item);
                          navigate(
                            `/allusers/layoutview/${encodedTopic}/${singleUserData?.layout}`
                          );
                        }}
                      />
                    </td>
                    <td className="allusers_dashboard_graph_digital_td">
                      <button>
                        <MdEdit
                          size={18}
                          style={{ cursor: "pointer" }}
                          className="icon"
                          onClick={() =>
                            navigate(`/allusers/editsinglegraph/${encodeURIComponent(item)}`)
                          }
                        />
                      </button>
                      <button
                        onClick={() => {
                          const encodedTopic = encodeURIComponent(item);
                          navigate(`/allusers/viewsinglegraph/${encodedTopic}`);
                        }}
                      >
                        <VscGraph />
                      </button>
                      <button
                        onClick={() =>
                          navigate(
                            `/allusers/singledigitalmeter/${encodeURIComponent(
                              item
                            )}/${user.role}/${user.id}`
                          )
                        }
                      >
                        <FaDigitalOcean style={{ cursor: "pointer" }} />
                      </button>
                    </td>
                    <td>
                      {favoriteList?.includes(item) ? (
                        <BsBookmarkStarFill
                          color="green"
                          size={"20"}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleRemoveFavorite(item)}
                        />
                      ) : (
                        <FaRegBookmark
                          color="green"
                          size={"18"}
                          style={{ cursor: "pointer" }}
                          onClick={() => handleAddFavorite(item)}
                        />
                      )}
                    </td>
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
      </div>
    </div>
  );
};

export default SingleUserDashBoard;
