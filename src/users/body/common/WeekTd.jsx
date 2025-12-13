import React, { useEffect, useState } from "react";
import { fetchData } from "../../../utils/apiHelper";

const WeekTd = ({ topic , setLoadingWYTMaxData }) => {
  const [data, setData] = useState("");

  useEffect(() => {
    fetchData(`/mqtt/last-7-days-highest?topic=${encodeURIComponent(topic)}`, setData);
  }, [topic]);

  return <td>{data || "-"}</td>;
};

export default React.memo(WeekTd);
