import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import HistoryGraph from "../graphs/historygraph/HistoryGraph";
import { IoClose } from "react-icons/io5";
import "./HistoryGraphPage.css";
import apiClient from "../../../api/apiClient";

const HistoryGraphPage = () => {
  const { topicparams } = useParams();
  const navigate = useNavigate();
  const [topicLabel,setTopicLabel] = useState("")

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

  return (
    <div
      className="_historygraph_page_main_container"
      data-aos="fade-out"
      data-aos-duration="1000"
      data-aos-once="true"
    >
      <header className="_historygraph_page_header">
        <div className="_historygraph_page_title">
          {topicLabel} (History)
        </div>
        <div className="_historygraph_page_close" onClick={() => navigate(-1)}>
          <IoClose />
        </div>
      </header>
      <section className="_historygraph_page_content">
        <HistoryGraph topic={topicparams} topicLabel={topicLabel} height={"470"} />
      </section>
    </div>
  );
};

export default HistoryGraphPage;