import React, { useEffect, useState } from "react";
import "../../style.css";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import apiClient from "../../../api/apiClient";
import SmallGraph from "../graphs/smallgraph/SmallGraph";
import Loader from "../../loader/Loader";
import { useNavigate } from "react-router-dom";
import { FaExternalLinkAlt } from "react-icons/fa";
import ReactPaginate from "react-paginate";
import "bootstrap/dist/css/bootstrap.min.css";

const AllOperators = () => {
  const { user } = useSelector((state) => state.userSlice);
  const [loggedInUser, setLoggedInUser] = useState({});
  const [selectedUser, setSelectedUser] = useState({});
  const [operatorsList, setOperatorsList] = useState([]);
  const [localLoading, setLocalLoading] = useState(false);
  const [employeesList, setEmployeeList] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user.id) {
      fetchUserDetails();
    }
  }, [user.id]);

  const fetchUserDetails = async () => {
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      setLoggedInUser(res?.data?.data);
      setEmployeeList(res?.data?.data?.employees || []);
      console.log("Manager details: ", res?.data?.data?.employees);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to fetch user details");
    }
  };

  useEffect(() => {
    if (loggedInUser?.company?._id) {
      fetchAllEmployees();
    }
  }, [loggedInUser]);

  const fetchAllEmployees = async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(
        `/auth/employee/getAllEmployeesOfSameCompany/${loggedInUser?.company?._id}`
      );
      setOperatorsList(res?.data?.data || []);
      setLocalLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to fetch employees");
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUser?.topics) {
      // Logic needed for selectedUser.topics if required
    }
  }, [selectedUser]);

  const navigate = useNavigate();

  const handleUserClick = (id) => {
    navigate(`/allusers/singleuserdashboard/${id}`);
  };

  const offset = currentPage * itemsPerPage;
  const currentItems = employeesList.slice(offset, offset + itemsPerPage);
  const pageCount = Math.ceil(employeesList.length / itemsPerPage);

  const handlePageClick = ({ selected }) => {
    setCurrentPage(selected);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (localLoading) {
    return <Loader />;
  }

  return (
    <div className="alluser_alloperators_container">
      <div className="alluser_alloperators_scrollable-table">
        <table
          className="alluser_alloperators_table"
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed", 
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  width: "10%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                Row
              </th>
              <th
                style={{
                  width: "15%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                User
              </th>
              <th
                style={{
                  width: "20%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                Email
              </th>
              <th
                style={{
                  width: "15%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                CompanyName
              </th>
              <th
                style={{
                  width: "30%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                Address
              </th>
              <th
                style={{
                  width: "10%",
                  padding: "10px",
                  backgroundColor: "#34495e",
                  color: "white",
                  border: "1px solid #ddd",
                  textAlign: "center",
                }}
              >
                Phone No
              </th>
            </tr>
          </thead>
          <tbody>
            {currentItems.map((employee, index) => (
              <tr key={employee._id}>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {offset + index + 1}
                </td>
                <td
                >
                  {employee.name}
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {employee.email}
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {employee.headerOne || "--"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "left",
                    whiteSpace: "normal", 
                    wordBreak: "break-all",
                    overflowWrap: "break-word", 
                    lineHeight: "1.5", 
                  }}
                >
                  {employee.headerTwo || "--"}
                </td>
                <td
                  style={{
                    padding: "10px",
                    border: "1px solid #ddd",
                    textAlign: "center",
                  }}
                >
                  {employee.phonenumber ? employee.phonenumber : "--"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {employeesList.length > itemsPerPage && (
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
  );
};

export default AllOperators;