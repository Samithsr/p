import React, { useEffect, useState } from "react";
import { fetchData } from "../../../utils/apiHelper";

const TodayTd = ({ topic }) => {
  const [data, setData] = useState("");

  useEffect(() => {
    fetchData(`/mqtt/todays-highest?topic=${encodeURIComponent(topic)}`, setData);
  }, [topic]);

  return <td>{data || "-"}</td>;
};

export default React.memo(TodayTd);
