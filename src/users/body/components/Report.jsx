import React, { useState, useEffect, useContext } from "react";
import "../../style.css";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";
import { navHeaderContaxt } from "../../../contaxts/navHeaderContaxt";
import ReactPaginate from "react-paginate";
import "bootstrap/dist/css/bootstrap.min.css";
import moment from "moment-timezone";
import { useSelector } from "react-redux";

const Report = () => {
  const navigate = useNavigate();
  const { navHeader } = useContext(navHeaderContaxt);
  const { user } = useSelector((state) => state.userSlice);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const [fromDate, setFromDate] = useState(yesterday); // Default remains
  const [toDate, setToDate] = useState(today); // Default remains
  const [minValue, setMinValue] = useState(""); // No default
  const [maxValue, setMaxValue] = useState(""); // No default
  const [reportData, setReportData] = useState([]);
  const [mergedReportData, setMergedReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [companyTagnames, setCompanyTagnames] = useState([]);
  const [selectedTagnames, setSelectedTagnames] = useState([]);
  const [filterType, setFilterType] = useState(""); // No default
  const [allTopicsWithLabels, setAllTopicsWithLabels] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(""); // No default
  const [aggregationMethod, setAggregationMethod] = useState(""); // No default
  const [startTimeOfDay, setStartTimeOfDay] = useState(null); // New filter, no default
  const [endTimeOfDay, setEndTimeOfDay] = useState(null); // New filter, no default
  const itemsPerPage = limit || 1000; // Fallback to 1000 if limit is not set

  useEffect(() => {
    fetchAllTopicsLabels();
    if (user.role !== "supervisor") {
      fetchPerticularUser();
    }
  }, [user.id, user.role]);

  const fetchPerticularUser = async () => {
    try {
      const res = await apiClient.get(`/auth/employee/${user?.id}`);
      const userTopics = res.data.data.topics || [];
      console.log("Non-supervisor topics:", userTopics);
      if (userTopics.length > 0) {
        setCompanyTagnames(userTopics);
      } else {
        toast.error("No topics assigned to this user.");
      }
    } catch (error) {
      console.error("Error fetching user topics:", error.message);
      toast.error("Failed to fetch user topics. Please try again.");
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

  useEffect(() => {
    if (user.role === "supervisor" && navHeader?.topics?.length > 0) {
      setCompanyTagnames(navHeader.topics);
    } else if (user.role === "supervisor" && (!navHeader?.topics || navHeader.topics.length === 0)) {
      toast.error("No topics available in navHeader for supervisor");
    }
  }, [navHeader, user.role]);

  const normalizeTimestamp = (timestamp) => {
    return moment(timestamp).tz("Asia/Kolkata").startOf("second").toISOString();
  };

  useEffect(() => {
    if (reportData.length > 0) {
      const mergedData = [];
      const timestampMap = new Map();

      reportData.forEach((row) => {
        const normalizedTimestamp = normalizeTimestamp(row.timestamp);
        let existingRow = timestampMap.get(normalizedTimestamp);

        if (!existingRow) {
          existingRow = { timestamp: row.timestamp };
          selectedTagnames.forEach((tag) => {
            existingRow[tag] = "N/A";
          });
          timestampMap.set(normalizedTimestamp, existingRow);
          mergedData.push(existingRow);
        }

        Object.keys(row).forEach((key) => {
          if (key !== "timestamp" && selectedTagnames.includes(key) && row[key] !== undefined && row[key] !== null) {
            existingRow[key] = row[key];
          }
        });
      });

      // Default sorting by timestamp descending (no user option)
      mergedData.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMergedReportData(mergedData);
    } else {
      setMergedReportData([]);
    }
  }, [reportData, selectedTagnames]);

  const handleTagnameToggle = (tagname) => {
    setSelectedTagnames((prev) => {
      const newSelection = prev.includes(tagname)
        ? prev.filter((t) => t !== tagname)
        : [...prev, tagname];
      setReportData([]);
      return newSelection;
    });
  };

  const handleSubmit = async (page = 1) => {
    if (!fromDate || !toDate || selectedTagnames.length === 0) {
      toast.warning("Please select date range and at least one tagname");
      return;
    }

    setLoading(true);
    setLoadingProgress(0);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => Math.min(prev + 10, 90));
    }, 500);

    try {
      const payload = {
        topics: selectedTagnames,
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        filterType: filterType || undefined,
        minValue: minValue ? Number(minValue) : undefined,
        maxValue: maxValue ? Number(maxValue) : undefined,
        page,
        limit: limit ? Number(limit) : undefined,
        aggregationMethod: aggregationMethod || undefined,
        startTimeOfDay: startTimeOfDay ? startTimeOfDay.toISOString() : undefined,
        endTimeOfDay: endTimeOfDay ? endTimeOfDay.toISOString() : undefined,
      };
      console.log("Submitting report request with:", payload);

      const response = await apiClient.post("/mqtt/report-filter", payload);

      clearInterval(progressInterval);
      setLoadingProgress(100);

      if (response?.data?.report) {
        setReportData(response.data.report);
        setTotalRecords(response.data.totalRecords || 0);
        setTotalPages(response.data.totalPages || 0);
        setCurrentPage(page - 1);
      } else {
        toast.error("No report data returned from the server.");
        setReportData([]);
        setTotalRecords(0);
        setTotalPages(0);
      }
    } catch (err) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      console.error("Error in handleSubmit:", err);
      toast.error(
        err.response?.data?.error || "Failed to fetch report data. Please try again."
      );
      setReportData([]);
      setTotalRecords(0);
      setTotalPages(0);
    } finally {
      setTimeout(() => setLoading(false), 500);
    }
  };

  const handlePageClick = ({ selected }) => {
    const newPage = selected + 1;
    handleSubmit(newPage);
  };

  const handleDownloadCSV = async () => {
    if (totalRecords === 0) {
      toast.warning("No data available to download. Submit the form first.");
      return;
    }

    try {
      toast.info("Generating CSV file, please wait...");
      const response = await apiClient.post(
        "/mqtt/report-filter-csv",
        {
          topics: selectedTagnames,
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          filterType: filterType || undefined,
          minValue: minValue ? Number(minValue) : undefined,
          maxValue: maxValue ? Number(maxValue) : undefined,
          aggregationMethod: aggregationMethod || undefined,
          startTimeOfDay: startTimeOfDay ? startTimeOfDay.toISOString() : undefined,
          endTimeOfDay: endTimeOfDay ? endTimeOfDay.toISOString() : undefined,
        },
        {
          responseType: "blob",
        }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      const currentTime = new Date()
        .toISOString()
        .slice(0, 19)
        .replace("T", "_")
        .replace(/:/g, "-");
      link.href = url;
      link.setAttribute("download", `report_${currentTime}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("CSV file downloaded successfully!");
    } catch (err) {
      console.error("Error downloading CSV:", err);
      toast.error("Failed to download CSV file. Please try again.");
    }
  };

  const getLabelWithUnit = (tag) => {
    const topic = typeof tag === "string" ? tag : tag.topic;
    const matchedTopic = allTopicsWithLabels.find((t) => t.topic === topic);
    const label = matchedTopic ? matchedTopic.label : topic.split("|")[0].split("/")[2] || topic;
    const unit = topic.split("|")[1] || "";
    return `${label}(${unit})`;
  };

  return (
    <div className="_allusers_topic_based_report_main_container mt-3">
      <div className="_allusers_topic_based_report_second_main_container">
        <div className="_report_controls_container">
          <div className="_report_date_filter_row">
            <div className="_report_datepicker_wrapper">
              <label className="_report_label">From Date</label>
              <DatePicker
                selected={fromDate}
                onChange={(date) => setFromDate(date)}
                dateFormat="yyyy-MM-dd"
                className="_report_datepicker"
                maxDate={toDate}
              />
            </div>
            <div className="_report_datepicker_wrapper">
              <label className="_report_label">To Date</label>
              <DatePicker
                selected={toDate}
                onChange={(date) => setToDate(date)}
                dateFormat="yyyy-MM-dd"
                className="_report_datepicker"
                maxDate={today}
                minDate={fromDate}
              />
            </div>
            <div className="_report_filter_selector">
              <label className="_report_label">Filter Type</label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="_report_dropdown"
              >
                <option value="">Select Filter Type</option>
                <option value="all">All Values</option>
                <option value="minPerDay">Min Value Per Day</option>
                <option value="maxPerDay">Max Value Per Day</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>
          </div>
          {filterType === "custom" && (
            <div className="_report_custom_range">
              <div className="_report_input_group">
                <label className="_report_label">Above</label>
                <input
                  type="number"
                  value={minValue}
                  onChange={(e) => setMinValue(e.target.value)}
                  placeholder="Min Value"
                  className="_report_number_input"
                />
              </div>
              <div className="_report_input_group">
                <label className="_report_label">Below</label>
                <input
                  type="number"
                  value={maxValue}
                  onChange={(e) => setMaxValue(e.target.value)}
                  placeholder="Max Value"
                  className="_report_number_input"
                />
              </div>
            </div>
          )}
          <div className="_report_additional_filters" style={{ display: "flex", gap: "20px", marginTop: "10px" }}>
            <div className="_report_datepicker_wrapper">
              <label className="_report_label">Start Time of Day</label>
              <DatePicker
                selected={startTimeOfDay}
                onChange={(date) => setStartTimeOfDay(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="_report_datepicker"
                placeholderText="Select Start Time"
              />
            </div>
            <div className="_report_datepicker_wrapper">
              <label className="_report_label">End Time of Day</label>
              <DatePicker
                selected={endTimeOfDay}
                onChange={(date) => setEndTimeOfDay(date)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={15}
                timeCaption="Time"
                dateFormat="HH:mm"
                className="_report_datepicker"
                placeholderText="Select End Time"
              />
            </div>
            <div className="_report_input_group">
              <label className="_report_label">Limit (Records)</label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Math.max(1, e.target.value))}
                placeholder="Limit"
                className="_report_number_input"
                min="1"
              />
            </div>
            <div className="_report_filter_selector">
              <label className="_report_label">Aggregation</label>
              <select
                value={aggregationMethod}
                onChange={(e) => setAggregationMethod(e.target.value)}
                className="_report_dropdown"
              >
                <option value="">Select Aggregation</option>
                <option value="average">Average</option>
                <option value="sum">Sum</option>
                <option value="min">Minimum</option>
                <option value="max">Maximum</option>
              </select>
            </div>
          </div>
          <div className="_report_tagname_selector mt-3">
            <label className="_report_label">Select Tagnames</label>
            {companyTagnames.length === 0 ? (
              <div className="_report_loading_indicator" style={{ textAlign: "center", padding: "10px" }}>
                <span>No tagnames available</span>
              </div>
            ) : (
              <div className="_report_tagname_list">
                {companyTagnames.map((tag) => {
                  const topic = typeof tag === "string" ? tag : tag.topic;
                  const label = getLabelWithUnit(tag);
                  return (
                    <div key={topic} className="_report_tagname_card">
                      <input
                        type="checkbox"
                        checked={selectedTagnames.includes(topic)}
                        onChange={() => handleTagnameToggle(topic)}
                        className="_report_checkbox"
                      />
                      <span className="_report_tagname_text">{label}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="_report_button_group">
            <button onClick={() => handleSubmit(1)} className="_report_submit_btn">
              Submit
            </button>
            <button onClick={handleDownloadCSV} className="_report_download_btn">
              Download CSV
            </button>
          </div>
        </div>
        {loading ? (
          <div className="_report_loading_indicator" style={{ width: "97.5vw" }}>
            <div className="_report_progress_bar">
              <div
                className="_report_progress_fill"
                style={{ width: `${loadingProgress}%` }}
              ></div>
            </div>
            <span>{loadingProgress}%</span>
          </div>
        ) : (
          <div className="alluser_alloperators_container">
            <div className="alluser_alloperators_scrollable-table">
              <table className="alluser_alloperators_table">
                <thead>
                  <tr>
                    <th>Row # [{totalRecords}]</th>
                    <th>Timestamp</th>
                    {selectedTagnames.map((tag) => (
                      <th key={tag}>{getLabelWithUnit(tag)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mergedReportData.length > 0 ? (
                    mergedReportData.map((row, index) => (
                      <tr key={row.timestamp}>
                        <td>{(currentPage * itemsPerPage) + index + 1}</td>
                        <td>{new Date(row.timestamp).toLocaleString()}</td>
                        {selectedTagnames.map((tag) => (
                          <td key={tag}>{row[tag] || "N/A"}</td>
                        ))}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={selectedTagnames.length + 2}
                        style={{ textAlign: "center", background: "#f1c404" }}
                      >
                        No data available. Select tagnames and submit.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4 mb-4">
                <ReactPaginate
                  previousLabel="Previous"
                  nextLabel="Next"
                  breakLabel="..."
                  pageCount={totalPages}
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
        )}
      </div>
    </div>
  );
};

export default Report;