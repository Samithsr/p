import React from "react";
import Type2 from "../../../admin/components/digitalmeters/Type2";
import SmallGraph from "../graphs/smallgraph/SmallGraph";
import BarChart from "../graphs/barchart/BarChart";

const LayoutStyle3 = ({ liveMessage, topic }) => {
  return (
    <section className="allusers_layoutview_section">
      <div className="allusers_layoutview_bar_graph_container">
        <BarChart topic={topic} />
      </div>
      <div className="allusers_layoutview_numaric_container">
        <div>
          <h3>{liveMessage ? liveMessage : "00"}</h3>
          <p>{topic?.split("|")[1] || "N/A"}</p>
        </div>
      </div>
      <div className="allusers_layoutview_digital_meter_container">
        {/* <DigitalViewOne /> */}
        <Type2 topic={topic} unit={topic?.split("|")[1]} darkColor={true} />
      </div>
      <section className="allusers_layoutview_live_graph_container">
        <SmallGraph topic={topic} height={"310"} />
      </section>
    </section>
  );
};

export default LayoutStyle3;
