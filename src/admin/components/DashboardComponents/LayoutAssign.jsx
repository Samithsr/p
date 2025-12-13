import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiClient from "./../../../api/apiClient";
import { IoCloseSharp } from "react-icons/io5";
import Layout1Img from "../../../utils/layout1.png";
import Layout2Img from "../../../utils/layout2.png";
import Layout3Img from "../../../utils/layout3.png";
import { toast } from "react-toastify";

const LayoutAssign = ({ id, role, setLayoutAssignModel }) => {
  console.log(id, role);
  const [fetchedUser, setFetchedUser] = useState({});
  const [loading, setLoading] = useState(false);
  const [activeLayout, setActivelayout] = useState("");

  useEffect(() => {
    if (id) {
      fetchSelectedUser();
    }
  }, [id]);

  const fetchSelectedUser = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/auth/${role}/${id}`);
      setFetchedUser(res.data.data);
      setActivelayout(res?.data?.data?.layout);
      setLoading(false);
    } catch (error) {
      console.log(error.message);
      setLoading(false);
    }
  };

  const handleAssignLaout = async () => {
    try {
      await apiClient.put(`/auth/layoutassign/${role}/${id}`, {
        layout: activeLayout,
      });
      toast.success("Layout assigned successfully");
      setLayoutAssignModel(false);
    } catch (error) {
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="admin_layout_assign_main_container">
      <div>
        <header>
          Select layout for {fetchedUser?.email}{" "}
          <div>
            <IoCloseSharp onClick={() => setLayoutAssignModel(false)} />
          </div>
        </header>
        <section>
          <div className="assignlaoyout_carousel">
            <div
              className={`assignlaoyout_carousel_item ${
                activeLayout === "layout1" &&
                "assignlaoyout_carousel_active_item"
              }`}
              onClick={() => setActivelayout("layout1")}
            >
              <img src={Layout1Img} alt="layout1" />
            </div>
            <div
              className={`assignlaoyout_carousel_item ${
                activeLayout === "layout2" &&
                "assignlaoyout_carousel_active_item"
              }`}
              onClick={() => setActivelayout("layout2")}
            >
              <img src={Layout2Img} alt="layout2" />
            </div>
            <div
              className={`assignlaoyout_carousel_item ${
                activeLayout === "layout3" &&
                "assignlaoyout_carousel_active_item"
              }`}
              onClick={() => setActivelayout("layout3")}
            >
              <img src={Layout3Img} alt="layout3" />
            </div>
          </div>
          <div className="assignlayout_button">
            <button onClick={handleAssignLaout}>Assign</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LayoutAssign;
