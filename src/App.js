import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import AOS from "aos";
import "aos/dist/aos.css";
import "./App.css";
import { jwtDecode } from "jwt-decode";
import "react-toastify/dist/ReactToastify.css";
import RoutersDom from "./routers/RoutersDom";
import { useDispatch, useSelector } from "react-redux";
import { setUser } from "./redux/slices/UserSlice";
import WarningModel from "./common/WarningModel";
import Loading from "./common/Loading";
import { toast, ToastContainer } from "react-toastify";
import setAuthToken from "./setAuthToken";
import { setLoading } from "./redux/slices/UniversalLoader";
import { setUserDetails } from "./redux/slices/UserDetailsSlice";
import apiClient from "./api/apiClient";
import { navHeaderContaxt } from "./contaxts/navHeaderContaxt";

if (localStorage.getItem("token")) {
  setAuthToken(localStorage.getItem("token"));
}

const App = () => {
  const [userLocal, setUserLocal] = useState({});
  const { logoutToggle } = useSelector((state) => state.userSlice);
  const { loading } = useSelector((state) => state.UniversalLoader);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.userSlice);

  // Initialize navHeader from localStorage if it exists, otherwise empty object
  const [navHeader, setNavHeader] = useState(() => {
    const savedNavHeader = localStorage.getItem("navHeader");
    return savedNavHeader ? JSON.parse(savedNavHeader) : {};
  });

  // Save navHeader to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("navHeader", JSON.stringify(navHeader));
    console.log("App.js : Updated navHeader in localStorage:", navHeader);
  }, [navHeader]);

  // Handle JWT token decoding and user setup
  useEffect(() => {
    const jwt = localStorage.getItem("token");
    try {
      const jwtUser = jwtDecode(jwt);
      if (Date.now() >= jwtUser.exp * 1000) {
        localStorage.removeItem("token");
        localStorage.removeItem("navHeader"); // Clear navHeader on token expiry
        window.location.reload();
      } else {
        setUserLocal(jwtUser);
        dispatch(setUser(jwtUser));
      }
    } catch (error) {
      console.error("Error decoding JWT:", error);
    }
  }, []);

  // Initialize AOS
  useEffect(() => {
    AOS.init();
  }, []);

  return (
    <div className="App">
      <ToastContainer autoClose={1500} />
      {loading && <Loading />}
      {logoutToggle && <WarningModel />}
      <navHeaderContaxt.Provider value={{ navHeader, setNavHeader }}>
        <RoutersDom />
      </navHeaderContaxt.Provider>
    </div>
  );
};

export default App;