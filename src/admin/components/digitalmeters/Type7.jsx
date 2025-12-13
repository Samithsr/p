import React, { useEffect, useState } from "react";
import {
  CircularProgressbarWithChildren,
  buildStyles,
} from "react-circular-progressbar";
import io from "socket.io-client";
import "react-circular-progressbar/dist/styles.css";

const Type7 = ({ topic, minValue = -20, maxValue = 100 ,unit="c",label="n/a"}) => {
  const [value, setValue] = useState(20);

  useEffect(() => {
     const socket = io("http://13.233.73.61:4000", {
        //  path: "/socket.io/",
         transports: ["websocket"],
         secure: true,
         reconnection: true,
         reconnectionAttempts: 5,
         reconnectionDelay: 5000,
         upgrade: false, 
       });
    socket.emit("subscribeToTopic", topic);
    socket.on("liveMessage", (data) => {
      const rawValue = data?.message?.message?.message ?? 0;
      setValue(Math.min(Math.max(rawValue, minValue), maxValue));
    });
    return () => socket.disconnect();
  }, [topic]);

  return (
    <div
      style={{
        width: 160,
        padding: 20,
        background: "#ffffff",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
      }}
    >
      <CircularProgressbarWithChildren
        value={value}
        minValue={minValue}
        maxValue={maxValue}
        styles={buildStyles({
          pathColor: `rgb(${Math.floor((value / maxValue) * 255)}, ${Math.floor(
            255 - (value / maxValue) * 255
          )}, 0)`,
          trailColor: "#f0f0f0",
          pathTransitionDuration: 0.5,
        })}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 22, fontWeight: 600, color: "#2d3748" }}>
            {value.toFixed(1)} {unit}
          </div>
        </div>
      </CircularProgressbarWithChildren>
          <div style={{ fontSize: 14, color: "black",textAlign:"center" ,marginTop:"10px"}}>{label}</div>
    </div>
  );
};

export default Type7;
