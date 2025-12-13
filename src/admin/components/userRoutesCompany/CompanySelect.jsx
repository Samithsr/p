import React, { useEffect, useState } from "react";
import "../Users.css";
import apiClient from "../../../api/apiClient";
import { IoMdAddCircleOutline } from "react-icons/io";
import { toast } from "react-toastify";
import { useDispatch } from "react-redux";
import { setLoading } from "../../../redux/slices/UniversalLoader";
import { useNavigate } from "react-router-dom";

const CompanySelect = () => {
  const [companiesList, setCompaniesList] = useState([]);
  const [filteredCompaniesList, setCompaniesFilteredList] = useState([]);
  const [query, setQuery] = useState("");
  const [createCompany, setCreateCompany] = useState({
    name: "",
    email: "",
    phonenumber: "",
    address: "",
  });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    dispatch(setLoading(true));
    try {
      const res = await apiClient.get("/auth/companies");
      setCompaniesList(res?.data);
      setCompaniesFilteredList(res?.data);
      dispatch(setLoading(false));
    } catch (error) {
      dispatch(setLoading(false));
      toast.error("Something went wrong!");
    }
  };

  const handleSearch = (e) => {
    setQuery(e.target.value);
    if (e.target.value.length > 0) {
      const filteredCompanies = companiesList?.filter((item) =>
        item.name.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setCompaniesFilteredList(filteredCompanies);
    } else {
      setCompaniesFilteredList(companiesList);
    }
  };

  const handleCreateCompanyChange = (e) => {
    setCreateCompany({ ...createCompany, [e.target.name]: e.target.value });
  };

  const handleCreateCompany = async () => {
    dispatch(setLoading(true));
    try {
      const res = await apiClient.post("/auth/companies", createCompany);
      toast.success("Company created successfully!");
      setCreateCompany({
        name: "",
        email: "",
        phonenumber: "",
        address: "",
      });
      navigate(`/dashboard/users/supervisoremployee/${res?.data?.data?._id}`);
      dispatch(setLoading(false));
      await fetchCompanies();
    } catch (error) {
      dispatch(setLoading(false));
      toast.error(error?.response?.data?.error);
    }
  };

  const handleCompanyLink = (id) => {
    navigate(`/dashboard/users/supervisoremployee/${id}`);
  };

  return (
    <div className="_professional_company_container">
      <div className="_professional_company_create">
        <h3>Create New Company</h3>
        <div className="_professional_company_create_inputs">
          <input
            type="text"
            name="name"
            value={createCompany.name}
            onChange={handleCreateCompanyChange}
            placeholder="Enter company name..."
          />
          <input
            type="email"
            name="email"
            value={createCompany.email}
            onChange={handleCreateCompanyChange}
            placeholder="Enter company email..."
          />
          <input
            type="number"
            name="phonenumber"
            value={createCompany.phonenumber}
            onChange={handleCreateCompanyChange}
            placeholder="Enter company phone no..."
          />
          <textarea
            name="address"
            value={createCompany.address}
            onChange={handleCreateCompanyChange}
            placeholder="Enter company address..."
            rows={5}
          />
          <button onClick={handleCreateCompany}>
            Create <IoMdAddCircleOutline />
          </button>
        </div>
      </div>
      <div className="_professional_company_select">
        <h3>Select a Company</h3>
        <div className="_professional_company_search">
          <input
            placeholder="Search..."
            type="text"
            value={query}
            onChange={handleSearch}
          />
          <button type="submit">Search</button>
        </div>
        <div className="_professional_company_list">
          {filteredCompaniesList?.map((item) => (
            <p
              key={item?._id}
              onClick={() => handleCompanyLink(item._id)}
            >
              {item?.name}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanySelect;