import React, { useEffect, useState } from "react";
import "./CreateSupervisorEmp.css";
import { useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { BsBuildings } from "react-icons/bs";
import { setLoading } from "../../../redux/slices/UniversalLoader";
import apiClient from "../../../api/apiClient";
import DeleteUserModel from "./common/DeleteUserModel";
import CircularProgressBar from "./common/CircularProgressBar";
import { BsFillInfoCircleFill } from "react-icons/bs";
import CreateMSE from "./common/CreateMSE";
import ShowNumberOfWorkers from "./common/ShowNumberOfWorkers";
import { MdClose } from "react-icons/md";
import {
  fetchAllEmployees,
  fetchAllTheSupervisor,
  fetchCompany,
  setDeleteUserPopup,
} from "../../../redux/slices/ManagerEmployeeSupervisorListSlice";

const CreateRooms = () => {
  const { companyId } = useParams();
  const [showEmployyesPopUp, setShowEmployeesPopUp] = useState(false);
  const [showSupervisorPopUp, setShowSupervisorPopUp] = useState(false);
  const [changeAllSupervisorModel, setChangeAllSupervisorModel] =
    useState(false);
  const [companyDetailPopup, setCompanyDeatailPopup] = useState(false);
  const [searchToggle, setSearchToggle] = useState(false);
  const [supervisorError, setSupervisorError] = useState({});
  const [employeeError, setEmployeeError] = useState({});
  const [selectedSupervisorId, setSelectedSupervisorId] = useState("");
  const [oldSupervisorId, setOldSupervisorId] = useState("");
  const [newSupervisorId, setNewSupervisorId] = useState("");
  const [deleteId, setDeleteId] = useState("");
  const [deletingUserEmail, setDeletingUserEmail] = useState("");
  const [createNavCount, setCreateNavCount] = useState(2);
  const [createSupervisor, setCreateSupervisor] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    phonenumber: "",
  });
  const [createEmployee, setCreateEmployee] = useState({
    name: "",
    email: "",
    password: "",
    confirmpassword: "",
    phonenumber: "",
    headerOne: "",
    headerTwo: "",
  });

  const dispatch = useDispatch();
  const {
    company,
    supervisorList,
    employeesList,
    deleteUserPopup,
    editSingleSUpervisorModel,
  } = useSelector((state) => state.MESSlice);

  const [fetchFunctionNames, setFetchFunctionNames] = useState([
    fetchCompany,
    fetchAllTheSupervisor,
    fetchAllEmployees,
  ]);
  
  useEffect(() => {
    fetchFunctionNames.forEach((fetchFunction) => {
      dispatch(fetchFunction(companyId));
    });
  }, [companyId, fetchFunctionNames, dispatch]);

  const handleSupervisorChange = (e) => {
    setSupervisorError({});
    setCreateSupervisor({
      ...createSupervisor,
      [e.target.name]: e.target.value,
    });
  };

  const handleCreateEmployeeChange = (e) => {
    setEmployeeError({});
    setCreateEmployee({ ...createEmployee, [e.target.name]: e.target.value });
  };

  const validateUserData = (data, userType) => {
    const errors = {};
    if (data.name === "") {
      errors.name = "Name is required";
    }
    if (!data.email.endsWith("@gmail.com")) {
      errors.email = "Invalid email format";
    }
    if (data.password.length < 8) {
      errors.password = "Password must contain min 8 char";
    }
    if (data.confirmpassword === "") {
      errors.confirmpassword = "Confirm Password is required";
    }
    if (data.password !== data.confirmpassword) {
      errors.confirmpassword = "Password didn't match";
    }
    if (userType === "employee" && data.headerOne === "") {
      errors.headerOne = "Header One is required";
    }
    return errors;
  };

  const handleUserAction = async (
    endpoint,
    data,
    setError,
    successCallback
  ) => {
    const errors = validateUserData(data, data.userType);
    setError(errors);
    if (Object.keys(errors).length === 0) {
      dispatch(setLoading(true));
      try {
        const res = await apiClient.post(endpoint, data);
        successCallback(res);
        toast.success("Successfully created!");
      } catch (error) {
        toast.error(error?.response?.data?.error);
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  const handleCreateSupervisor = async () => {
    await handleUserAction(
      `/auth/supervisor/create/${companyId}`,
      {
        name: createSupervisor.name,
        email: createSupervisor.email,
        password: createSupervisor.password,
        confirmpassword: createSupervisor.confirmpassword,
        phonenumber: createSupervisor.phonenumber,
        userType: "supervisor",
      },
      setSupervisorError,
      (res) => {
        setSelectedSupervisorId(res?.data?.data?._id);
        setCreateSupervisor({
          name: "",
          email: "",
          password: "",
          phonenumber: "",
          confirmpassword: "",
        });
        dispatch(fetchAllTheSupervisor(company?._id));
      }
    );
  };

  const handleSwapSupervisors = async () => {
    dispatch(setLoading(true));
    try {
      await apiClient.post(
        `/auth/employee/changeSupervisorforAllEmployees/${oldSupervisorId}/${newSupervisorId}`
      );
      setChangeAllSupervisorModel(false);
      dispatch(fetchAllEmployees(companyId));
      setOldSupervisorId("");
      setNewSupervisorId("");
      toast.success("Successfully changed!");
    } catch (error) {
      toast.error(error?.response?.data?.error);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleCreateEmployee = async () => {
    await handleUserAction(
      `/auth/employee/create/${companyId}/${selectedSupervisorId}`,
      {
        name: createEmployee.name,
        email: createEmployee.email,
        password: createEmployee.password,
        phonenumber: createEmployee.phonenumber,
        confirmpassword: createEmployee.confirmpassword,
        headerOne: createEmployee.headerOne,
        headerTwo: createEmployee.headerTwo,
        supervisor: selectedSupervisorId || undefined,
        userType: "employee",
      },
      setEmployeeError,
      () => {
        setCreateEmployee({
          name: "",
          email: "",
          password: "",
          phonenumber: "",
          confirmpassword: "",
          headerOne: "",
          headerTwo: "",
        });
        dispatch(fetchAllEmployees(companyId));
      }
    );
  };

  return (
    <div className="admin_create_supervisor_container mt-2">
      <div>
        <section className="admin_create_supervisor_container_section">
          <h3 className="text-center">
            <BsBuildings /> {company?.name}{" "}
            <BsFillInfoCircleFill
              onClick={() => [
                setSearchToggle(false),
                setShowSupervisorPopUp(false),
                setShowEmployeesPopUp(false),
                setCompanyDeatailPopup(true),
              ]}
              size={20}
              className={`admin_users_view_workers_icon ${
                companyDetailPopup && "admin_users_view_workers_icon_active"
              }`}
            />
          </h3>
          {companyDetailPopup && (
            <div
              data-aos="fade-left"
              data-aos-duration="300"
              data-aos-once="true"
              className="admin_users_company_details_model_container"
            >
              <div className="admin_users_company_details_model_second_container">
                <div className="admin_users_company_details_model_second_container_peice"></div>
                <div className="admin_users_company_details_model_colse_container">
                  <MdClose onClick={() => setCompanyDeatailPopup(false)} />
                </div>
                <table>
                  <tr>
                    <td>Email</td>
                    <td>{company?.email}</td>
                  </tr>
                  <tr>
                    <td>Phone no</td>
                    {company?.phonenumber ? (
                      <td>+91 {company?.phonenumber}</td>
                    ) : (
                      <td>+xx xxxxxxxxxx</td>
                    )}
                  </tr>
                  <tr>
                    <td>Address</td>
                    <td>{company?.address}</td>
                  </tr>
                </table>
              </div>
            </div>
          )}
        </section>
        <div>
          <section>
            <CircularProgressBar
              percent={supervisorList.length}
              role="supervisor"
            />
            <span>
              Managers{" "}
              <BsFillInfoCircleFill
                className="admin_users_view_workers_icon"
                onClick={() => [
                  setSearchToggle(false),
                  setCompanyDeatailPopup(false),
                  setShowEmployeesPopUp(false),
                  setShowSupervisorPopUp(true),
                ]}
              />
            </span>
          </section>
          <section>
            <CircularProgressBar
              percent={employeesList.length}
              role="operator"
            />
            <span>
              Employees{" "}
              <BsFillInfoCircleFill
                className="admin_users_view_workers_icon"
                onClick={() => [
                  setSearchToggle(false),
                  setCompanyDeatailPopup(false),
                  setShowSupervisorPopUp(false),
                  setShowEmployeesPopUp(true),
                ]}
              />
            </span>
          </section>
        </div>
      </div>
      <DeleteUserModel
        id={deleteId}
        email={deletingUserEmail}
        company={company}
        fetchAllEmployees={fetchAllEmployees}
        deleteUserPopup={deleteUserPopup}
      />

      <ShowNumberOfWorkers
        showPopup={showSupervisorPopUp}
        setShowPopup={setShowSupervisorPopUp}
        userList={supervisorList}
        searchToggle={searchToggle}
        setSearchToggle={setSearchToggle}
        role="Supervisor"
        MdClose={MdClose}
        includeManager={false}
        handleDeleteUser={(item) => [
          dispatch(setDeleteUserPopup(true)),
          setDeleteId(item._id),
          setDeletingUserEmail(item.email),
        ]}
      />

      <ShowNumberOfWorkers
        showPopup={showEmployyesPopUp}
        setShowPopup={setShowEmployeesPopUp}
        userList={employeesList}
        searchToggle={searchToggle}
        setSearchToggle={setSearchToggle}
        role="Employee"
        editSingleSUpervisorModel={editSingleSUpervisorModel}
        changeAllSupervisorModel={changeAllSupervisorModel}
        setChangeAllSupervisorModel={setChangeAllSupervisorModel}
        MdClose={MdClose}
        includeSupervisor={true}
        oldSupervisorId={oldSupervisorId}
        setOldSupervisorId={setOldSupervisorId}
        newSupervisorId={newSupervisorId}
        setNewSupervisorId={setNewSupervisorId}
        supervisorList={supervisorList}
        handleSwapSupervisors={handleSwapSupervisors}
        company={company}
        handleDeleteUser={(item) => [
          dispatch(setDeleteUserPopup(true)),
          setDeleteId(item._id),
          setDeletingUserEmail(item.email),
        ]}
      />

      <div className="admin_users_switch_manager_supervisor_employee_container mt-5 mb-5">
        <div className="admin_users_switch_manager_supervisor_employee_container_div">
          <div>
            <button onClick={() => setCreateNavCount(2)}>
              Create Manager
            </button>
            {createNavCount === 2 && (
              <span className="admin_user_create_nav_active"></span>
            )}
          </div>
          <div>
            <button onClick={() => setCreateNavCount(3)}>
              Create Employee
            </button>
            {createNavCount === 3 && (
              <span className="admin_user_create_nav_active"></span>
            )}
          </div>
        </div>
      </div>

      {createNavCount === 2 && (
        <CreateMSE
          title="Create Supervisor"
          userData={createSupervisor}
          userError={supervisorError}
          handleChange={handleSupervisorChange}
          handleSubmit={handleCreateSupervisor}
          showSupervisorDropdown={false}
        />
      )}

      {createNavCount === 3 && (
        <CreateMSE
          title="Create Employee"
          userData={createEmployee}
          userError={employeeError}
          handleChange={handleCreateEmployeeChange}
          handleSubmit={handleCreateEmployee}
          showSupervisorDropdown={true}
          supervisorList={supervisorList}
          selectedSupervisorId={selectedSupervisorId}
          setSelectedSupervisorId={setSelectedSupervisorId}
        />
      )}
    </div>
  );
};

export default CreateRooms;