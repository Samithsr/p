import React, { useEffect, useState } from "react";
import "../index.css";
import { GrLogout } from "react-icons/gr";
import { useDispatch, useSelector } from "react-redux";
import { MdAdminPanelSettings } from "react-icons/md";
import { handleWarningModel } from "../../redux/slices/UserSlice";
import { useNavigate } from "react-router-dom";
import CompanyLogo from '../../users/navbar/sarayu_logo_1.jpg'

const Sidebar = () => {
  const { user } = useSelector((state) => state.userSlice);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const oldActiveBtn = sessionStorage.getItem("admin_active_btn");
  const [activeNavBtn, setActiveNavBtn] = useState(
    oldActiveBtn || "admin_dashboard"
  );

  useEffect(() => {
    sessionStorage.setItem("admin_active_btn", activeNavBtn);
  }, [activeNavBtn]);

  const handleLogout = () => {
    dispatch(handleWarningModel());
  };

  return (
    <div className="_professional_navbar_container">
      <div className="_professional_navbar_logo">
        <img src={CompanyLogo} alt="company logo" />
      </div>
      <div className="_professional_navbar_links">
        <p
          className={
            activeNavBtn === "admin_dashboard"
              ? "_professional_navbar_link _professional_navbar_link_active"
              : "_professional_navbar_link"
          }
          onClick={() => [
            navigate("/dashboard/dashboard"),
            setActiveNavBtn("admin_dashboard"),
          ]}
        >
          Dashboard
        </p>
        <p
          className={
            activeNavBtn === "admin_tagcreation"
              ? "_professional_navbar_link _professional_navbar_link_active"
              : "_professional_navbar_link"
          }
          onClick={() => [
            navigate("/dashboard/tagcreation"),
            setActiveNavBtn("admin_tagcreation"),
          ]}
        >
          Tag Creation
        </p>
        <p
          className={
            activeNavBtn === "admin_users"
              ? "_professional_navbar_link _professional_navbar_link_active"
              : "_professional_navbar_link"
          }
          onClick={() => [
            navigate("/dashboard/users"),
            setActiveNavBtn("admin_users"),
          ]}
        >
          Users
        </p>
        <p
          className={
            activeNavBtn === "admin_backupdb"
              ? "_professional_navbar_link _professional_navbar_link_active"
              : "_professional_navbar_link"
          }
          onClick={() => [
            navigate("/dashboard/backupdb"),
            setActiveNavBtn("admin_backupdb"),
          ]}
        >
          BackupDB
        </p>
      </div>
      <div className="_professional_navbar_logout">
        <button onClick={handleLogout}>
          <GrLogout />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;