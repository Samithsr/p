import React, { useEffect, useState } from "react";
import "../../style.css";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import SmallGraph from "../graphs/smallgraph/SmallGraph";
import { IoClose } from "react-icons/io5";
import StaticPlotGraph from "../graphs/rechartsgraph/StaticPlotGraph";
import apiClient from "../../../api/apiClient";

// Convert time frame string to seconds
const getTimeFrameInSeconds = (tf) => {
  const unit = tf.slice(-1);
  const value = parseInt(tf.slice(0, -1));
  
  switch(unit) {
    case 'H': return value * 60 * 60; // hours to seconds
    case 'h': return value * 60 * 60; // hours to seconds
    case 'D': return value * 24 * 60 * 60; // days to seconds
    case 'W': return value * 7 * 24 * 60 * 60; // weeks to seconds
    case 'M': return value * 30 * 24 * 60 * 60; // months to seconds (approximate)
    default: return 2 * 60 * 60; // default 2 hours
  }
};

const ViewGraph = () => {
  const { topicparams } = useParams();
  const [topicLabel, setTopicLabel] = useState("");
  const [timeFrame, setTimeFrame] = useState('2h');
  const navigate = useNavigate();

  useEffect(()=>{
    fetchLabelApi()
  },[topicparams])

  const fetchLabelApi = async () =>{
      try {
        const res = await apiClient.post('/mqtt/get-single-topic-label',{
          topic : topicparams
        })
        setTopicLabel(res?.data?.data[0]?.label);
      } catch (error) {
        console.log(error.message);
      }
    }

  const handleTimeFrameChange = (newTimeFrame) => {
    setTimeFrame(newTimeFrame);
  };

  const timeFrameButtons = ['1h', '2h', '1D', '1W', '1M'];

  return (
    <div
      className="_viewgraph_main_container"
      data-aos="fade-out"
      data-aos-duration="1000"
      data-aos-once="true"
    >
      <header>
        <div style={{ flex: 1 }}>{topicLabel}</div>
        {/* Time frame buttons commented out
        <div style={{ display: 'flex', gap: '5px', marginRight: '10px' }}>
          {timeFrameButtons.map((tf) => (
            <button
              key={tf}
              onClick={() => handleTimeFrameChange(tf)}
              style={{
                padding: '2px 8px',
                border: '1px solid #ddd',
                borderRadius: '3px',
                background: timeFrame === tf ? '#1890ff' : 'white',
                color: timeFrame === tf ? 'white' : '#333',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {tf}
            </button>
          ))}
        </div>
        */}
        <div onClick={() => navigate(-1)} style={{ cursor: 'pointer' }}>
          <IoClose />
        </div>
      </header>
      <div>
        {topicparams.split("|")[1] === "fft" ? (
          <StaticPlotGraph
            topic={topicparams}
            height={"75dvh"}
            dy={65}
            hidesteps={false}
            timeFrame={timeFrame}
          />
        ) : (
          <SmallGraph 
            topic={topicparams} 
            height={window.innerWidth < 800 ? window.innerHeight - 160 : window.innerHeight - 230} 
            viewgraph={true}
            timeFrame={timeFrame}
            onTimeFrameChange={handleTimeFrameChange}
          />
        )}
      </div>
    </div>
  );
};

export default ViewGraph;