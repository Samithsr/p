import React from "react";
import "./LoginLeft.css";
import LoginSideImg from './signup_left_1.jpg'

const loginLeft = () => {
  return (
    <div className="col-6 d-md-block d-none col-left">
      <div className="left_img_banner_container">
        <img style={{width:"100%",height:"100%"}} src={LoginSideImg} alt="login left img" />
      </div>
    </div>
  );
};

export default loginLeft;
