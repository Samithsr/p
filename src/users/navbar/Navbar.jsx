 import React, { useContext, useEffect, useState } from "react";
import "./Navbar.css";
import "../style.css";
import { handleWarningModel } from "../../redux/slices/UserSlice";
import { useDispatch, useSelector } from "react-redux";
import { IoSearch } from "react-icons/io5";
import { FaUserCheck } from "react-icons/fa";
import { IoMdMenu } from "react-icons/io";
import { IoIosLogOut } from "react-icons/io";
import { IoClose } from "react-icons/io5";
import { handlToggleMenu } from "../../redux/slices/NavbarSlice";
import apiClient from "../../api/apiClient";
import { toast } from "react-toastify";
import { PiBuildingOfficeBold } from "react-icons/pi";
import ChangePassword from "./../body/components/ChangePassword";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { HiMiniBuildingOffice } from "react-icons/hi2";
import { FaUser } from "react-icons/fa";
import { navHeaderContaxt } from "../../contaxts/navHeaderContaxt";
import { BsFillInfoCircleFill } from "react-icons/bs";
import CompanyLogo from './sarayu_logo_1.jpg';

const Navbar = () => {
  const { user } = useSelector((state) => state.userSlice);
  const dispatch = useDispatch();
  const { showMenu } = useSelector((state) => state.NavBarSlice);
  const navigate = useNavigate();

  const [loggedInUser, setLoggedInUser] = useState({});
  const [localLoading, setLocalLoading] = useState(false);
  const [changePasswordModel, setChangePasswordModel] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [toggleDetails, setToggleDetails] = useState(false);
  const { navHeader } = useContext(navHeaderContaxt);

  useEffect(() => {
    if (user.id) {
      fetchUserDetails();
    }
  }, [user.id]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).replace(/ /g, "-");

  const formattedTime = currentDateTime.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const fetchUserDetails = async () => {
    setLocalLoading(true);
    try {
      const res = await apiClient.get(`/auth/${user.role}/${user.id}`);
      setLoggedInUser(res?.data?.data);
      setLocalLoading(false);
    } catch (error) {
      toast.error(error?.response?.data?.error);
      setLocalLoading(false);
    }
  };

  // Function to truncate text if longer than 15 characters
  const truncateText = (text) => {
    if (!text) return "";
    return text.length > 15 ? `${text.slice(0, 15)}...` : text;
  };

  return (
    <>
      <div className="users_navbar_separate_container">
        <div className="users_navbar_separate_first_div">
          <div>
            <img src={CompanyLogo} alt="company logo" />
          </div>
        </div>
        <div className="users_navbar_separate_second_div">
          <p>{navHeader?.headerOne}</p>
          <p style={{ height: "25px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {navHeader?.headerTwo?.length > 75 ? navHeader?.headerTwo.slice(0, 75) + "...." : navHeader?.headerTwo}
          </p>
          <p>
            <span>{formattedDate}</span>
            <span>{formattedTime}</span>
          </p>
        </div>
        <div className="users_navbar_separate_thrid_div">
          <BsFillInfoCircleFill
            size={"20"}
            style={{ cursor: "pointer" }}
            onMouseEnter={() => setToggleDetails(true)}
            onMouseLeave={() => setToggleDetails(false)}
          />
          {toggleDetails && (
            <div
              className="users_navbar_separate_thrid_div_child"
              onMouseEnter={() => setToggleDetails(true)}
              onMouseLeave={() => setToggleDetails(false)}
            >
              <p>
                <HiMiniBuildingOffice /> Company : {loggedInUser?.company?.name}
              </p>
              <p>
                <FaUser /> Logged in as : {loggedInUser?.name}
              </p>
            </div>
          )}
        </div>
      </div>
      <div className="users_navbar_container">
        <div>
          <NavLink className={"users_navbar_link"} to={"/allusers/dashboard"}>
            Dashboard
          </NavLink>
          <div className="users_navbar_link_separator"></div>
          <NavLink className={"users_navbar_link"} to={"/allusers/graphs"}>
            Graphs
          </NavLink>
          {user?.role !== "supervisor" && (
            <>
              <div className="users_navbar_link_separator"></div>
              <NavLink className={"users_navbar_link"} to={"/allusers/favorites"}>
                Watch list
              </NavLink>
            </>
          )}
          <div className="users_navbar_link_separator"></div>
          <NavLink className={"users_navbar_link"} to={"/allusers/digitalmeter"}>
            Digital meter
          </NavLink>
          <div className="users_navbar_link_separator"></div>
          <NavLink className={"users_navbar_link"} to={"/allusers/report"}>
            Report
          </NavLink>
          {user?.role === "supervisor" && (
            <>
            <div className="users_navbar_link_separator"></div>
          <NavLink className={"users_navbar_link"} to={"/allusers/gatewaystat"}>
            Gateway
          </NavLink>
          <div className="users_navbar_link_separator"></div>
          <NavLink className={"users_navbar_link"} to={"/allusers/prediction"}>
            Prediction
          </NavLink>
            </>
            )}
          {user.role === "supervisor" && (
            <>
              <div className="users_navbar_link_separator"></div>
              <NavLink className={"users_navbar_link"} to={"/allusers/users"}>
                Users
              </NavLink>
            </>
          )}
          <div className="users_navbar_link_separator"></div>
          <Link
            className={"users_navbar_link"}
            onClick={() => setChangePasswordModel(true)}
          >
            Change password
          </Link>
          <div className="users_navbar_link_separator"></div>
          <Link
            className="users_navbar_link"
            style={{ background: "red" }}
            onClick={() => dispatch(handleWarningModel())}
          >
            Logout
          </Link>
        </div>
      </div>
      <div className="users_mobile_navbar_container">
        <div className="users_mobile_navbar_left">
          <PiBuildingOfficeBold />{" "}
          {truncateText(
            loggedInUser?.role === "supervisor" 
              ? loggedInUser?.company?.name 
              : navHeader?.headerOne
          )}
        </div>
        <div
          className="users_mobile_navbar_right"
          onClick={() => dispatch(handlToggleMenu())}
        >
          {showMenu ? <IoClose /> : <IoMdMenu />}
        </div>
        {showMenu && (
          <div
            className="users_mobile_navbar_show_menu"
            data-aos="fade-up"
            data-aos-duration="300"
            data-aos-once="true"
          >
            <NavLink
              className={"users_mobile_navbar_show_menu_navlink"}
              to={"/allusers/dashboard"}
              onClick={() => dispatch(handlToggleMenu(false))}
            >
              Dashboard
            </NavLink>
            <NavLink
              className={"users_mobile_navbar_show_menu_navlink"}
              to={"/allusers/graphs"}
              onClick={() => dispatch(handlToggleMenu(false))}
            >
              Graphs
            </NavLink>
            {user?.role !== "supervisor" && (
              <NavLink
                className={"users_mobile_navbar_show_menu_navlink"}
                to={"/allusers/favorites"}
                onClick={() => dispatch(handlToggleMenu(false))}
              >
                Watch list
              </NavLink>
            )}
            <NavLink
              className={"users_mobile_navbar_show_menu_navlink"}
              to={"/allusers/digitalmeter"}
              onClick={() => dispatch(handlToggleMenu(false))}
            >
              Digital meter
            </NavLink>
            <NavLink
              className={"users_mobile_navbar_show_menu_navlink"}
              to={"/allusers/report"}
              onClick={() => dispatch(handlToggleMenu(false))}
            >
              Report
            </NavLink>
            {user.role === "supervisor" && (
              <NavLink
                className={"users_mobile_navbar_show_menu_navlink"}
                to={"/allusers/users"}
                onClick={() => dispatch(handlToggleMenu(false))}
              >
                Users
              </NavLink>
            )}
            <Link
              className={"users_mobile_navbar_show_menu_navlink"}
              onClick={() => {
                setChangePasswordModel(true);
                dispatch(handlToggleMenu(false));
              }}
            >
              Change password
            </Link>
            <div
              className="users_mobile_navbar_show_menu_logout_container"
              onClick={() => {
                dispatch(handleWarningModel());
                dispatch(handlToggleMenu(false));
              }}
            >
              <button>
                <IoIosLogOut /> Logout
              </button>
            </div>
          </div>
        )}
      </div>
      {changePasswordModel && (
        <ChangePassword
          user={user}
          setChangePasswordModel={setChangePasswordModel}
        />
      )}
    </>
  );
};

export default Navbar;