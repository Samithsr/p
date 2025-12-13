import React, { useEffect } from "react";

const Logout = () => {
  useEffect(() => {
    localStorage.removeItem("navHeader");
    localStorage.removeItem("token");
    window.location = "/";
  }, []);
  return null;
};

export default Logout;
