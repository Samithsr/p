import React, { useEffect, useState } from "react";
import "../index.css";
import apiClient from "../../api/apiClient";
import Loader from "../../users/loader/Loader";
import { useNavigate } from "react-router-dom";
import MapTopic from "./DashboardComponents/MapTopic";
import { IoCloseSharp } from "react-icons/io5";
import { FiLayout } from "react-icons/fi";
import LayoutAssign from "./DashboardComponents/LayoutAssign";

const Dashboard = () => {
  const navigate = useNavigate();

  const [companyList, setCompanyList] = useState([]);
  const [supervisorList, setSupervisorList] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [selectedSupervisorEmployees, setSelectedSupervisorEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);

  const [filteredCompanyList, setFilteredCompanyList] = useState([]);
  const [filteredSupervisorList, setFilteredSupervisorList] = useState([]);
  const [filteredManagerList, setFilteredManagerList] = useState([]);

  const [companyLoading, setCompanyLoading] = useState(false);
  const [managerLoading, setManagerLoading] = useState(false);
  const [supervisorLoading, setSupervisorLoading] = useState(false);

  const [queryInput, setQueryInput] = useState({
    company: "",
    manager: "",
    supervisor: "",
    employee: "",
  });

  const [activeCompany, setActiveCompany] = useState("");
  const [activeSupervisor, setActiveSupervisor] = useState("");
  const [layoutAssignModel, setLayoutAssignModel] = useState(false);
  const [laoutAssignuserId, setlayoutAssignUserId] = useState("");
  const [laoutAssignuserRole, setlayoutAssignUserRole] = useState("");

  useEffect(() => {
    fetchCompanyList();
  }, []);

  const fetchCompanyList = async () => {
    setCompanyLoading(true);
    try {
      const res = await apiClient.get("/auth/companies");
      setCompanyList(res.data);
      setFilteredCompanyList(res.data);
      setCompanyLoading(false);
    } catch (error) {
      console.log(error.message);
      setCompanyLoading(false);
    }
  };

  const handleSetActiveCompany = (companyName, id) => {
    setActiveCompany(companyName);
    setActiveSupervisor("");
    setSelectedSupervisorEmployees([]);
    setFilteredEmployees([]);
    setQueryInput({ ...queryInput, supervisor: "", employee: "" });
    fetchAllManagers(id);
    fetchAllSupervisors(id);
  };

  const fetchAllManagers = async (id) => {
    setManagerLoading(true);
    try {
      const res = await apiClient(`/auth/getallmanager/${id}`);
      setManagerList(res.data.data);
      setFilteredManagerList(res.data.data);
      setManagerLoading(false);
    } catch (error) {
      console.log(error.message);
      setManagerLoading(false);
    }
  };

  const fetchAllSupervisors = async (id) => {
    setSupervisorLoading(true);
    try {
      const res = await apiClient(
        `/auth/supervisor/getAllSupervisorOfSameCompany/${id}`
      );
      setSupervisorList(res?.data?.data);
      setFilteredSupervisorList(res.data.data);
      setSupervisorLoading(false);
    } catch (error) {
      console.log(error.message);
      setSupervisorLoading(false);
    }
  };

  const handleSetActiveSupervisor = (supervisorName, employees) => {
    setActiveSupervisor(supervisorName);
    setSelectedSupervisorEmployees(employees || []);
    setFilteredEmployees(employees || []);
    setQueryInput({ ...queryInput, employee: "" });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setQueryInput({ ...queryInput, [name]: value });

    if (name === "company") {
      const filter = companyList.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCompanyList(filter);
    }

    if (name === "manager") {
      const filter = managerList.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredManagerList(filter);
    }

    if (name === "supervisor") {
      const filter = supervisorList.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredSupervisorList(filter);
    }

    if (name === "employee") {
      const filter = selectedSupervisorEmployees.filter((item) =>
        item.name.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredEmployees(filter);
    }
  };

  const handleLaoutModel = (id, role) => {
    setlayoutAssignUserId(id);
    setlayoutAssignUserRole(role);
    setLayoutAssignModel(true);
  };

  return (
    <>
      {layoutAssignModel && (
        <LayoutAssign
          id={laoutAssignuserId}
          role={laoutAssignuserRole}
          setLayoutAssignModel={setLayoutAssignModel}
        />
      )}
      <div className="_futuristic_dashboard_main_container">
        <aside className="_futuristic_dashboard_sidebar">
          <h2 className="_futuristic_dashboard_title mb-3">Companies</h2>
          <input
            type="text"
            placeholder="Search company..."
            value={queryInput.company}
            name="company"
            onChange={handleInputChange}
            className="_futuristic_dashboard_search_input"
          />
          <div className="_futuristic_dashboard_list_container">
            {!companyLoading ? (
              <>
                {filteredCompanyList?.map((item) => (
                  <div
                    key={item?._id}
                    className={
                      activeCompany === item?.name
                        ? "_futuristic_dashboard_list_item _futuristic_dashboard_list_item_active"
                        : "_futuristic_dashboard_list_item"
                    }
                    onClick={() => handleSetActiveCompany(item?.name, item?._id)}
                  >
                    {item?.name}
                  </div>
                ))}
              </>
            ) : (
              <Loader />
            )}
          </div>
        </aside>
        <main className="_futuristic_dashboard_main_content">
          <section className="_futuristic_dashboard_section _futuristic_dashboard_supervisor_section">
            <div className="_futuristic_dashboard_section_header">
              <h3 className="_futuristic_dashboard_subtitle">Managers</h3>
              <span className="_futuristic_dashboard_count">
                {filteredSupervisorList.length} Manager{filteredSupervisorList.length !== 1 ? "s" : ""}
              </span>
            </div>
            <input
              type="text"
              value={queryInput.supervisor}
              name="supervisor"
              placeholder="Search manager..."
              onChange={handleInputChange}
              className="_futuristic_dashboard_search_input"
            />
            <div className="_futuristic_dashboard_list_container">
              {!supervisorLoading ? (
                <>
                  {filteredSupervisorList?.map((item) => (
                    <div
                      key={item?._id}
                      className={
                        activeSupervisor === item?.name
                          ? "_futuristic_dashboard_list_item _futuristic_dashboard_list_item_active"
                          : "_futuristic_dashboard_list_item"
                      }
                      onClick={() =>
                        handleSetActiveSupervisor(item?.name, item?.employees)
                      }
                    >
                      <span>{item?.name}</span>
                      <span
                        className="_futuristic_dashboard_action_icon py-0"
                        onClick={() => handleLaoutModel(item?._id, item?.role)}
                      >
                        <FiLayout />
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <Loader />
              )}
            </div>
          </section>
          <section className="_futuristic_dashboard_section _futuristic_dashboard_employee_section">
            <div className="_futuristic_dashboard_section_header">
              <h3 className="_futuristic_dashboard_subtitle">Users</h3>
              <span className="_futuristic_dashboard_count">
                {filteredEmployees.length} User{filteredEmployees.length !== 1 ? "s" : ""}
              </span>
            </div>
            <input
              type="text"
              value={queryInput.employee}
              name="employee"
              placeholder="Search user..."
              onChange={handleInputChange}
              className="_futuristic_dashboard_search_input"
            />
            <div className="_futuristic_dashboard_list_container">
              {filteredEmployees.length > 0 ? (
                <>
                  {filteredEmployees.map((item) => (
                    <div
                      key={item?._id}
                      className="_futuristic_dashboard_list_item py-0"
                    >
                      <span
                        onClick={() =>
                          window.open(
                            `/_dashboard/maptopic/${item?._id}/${item.role}`,
                            "_blank"
                          )
                        }
                      >
                        {item?.name}
                      </span>
                      <span
                        className="_futuristic_dashboard_action_icon"
                        onClick={() => handleLaoutModel(item?._id, item?.role)}
                      >
                        <FiLayout />
                      </span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="_futuristic_dashboard_no_data">
                  {queryInput.employee
                    ? "No users match your search."
                    : "No users available for this supervisor."}
                </p>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default Dashboard;