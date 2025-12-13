
import React from "react"; // Imports React library for building the component
import "../index.css"; // Imports global CSS styles for the component
import { FaUsersCog } from "react-icons/fa"; // Imports users settings icon from react-icons library
import DashboardCTitle from "../common/DashboardCTitle"; // Imports custom DashboardCTitle component for displaying the title
import { Outlet } from "react-router-dom"; // Imports Outlet from react-router-dom for rendering nested routes

// Users component: Acts as a layout wrapper for user-related routes, displaying a title and rendering child routes
const Users = () => {
  return (
    // Main container with dashboard styling
    <div
      className="dashboard_main_section_container" // Applies dashboard container styles from index.css
    >
      {/* // Renders the title "Users" with a users settings icon using the DashboardCTitle component */}
      <DashboardCTitle title={"Users"} icon={<FaUsersCog />} />
      {/* // Outlet renders the child route components defined in the router configuration */}
      <Outlet />
    </div>
  );
};

export default Users; // Exports the Users component for use in the app
