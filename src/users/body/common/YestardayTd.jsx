import React, { useEffect, useState } from "react";
import { fetchData } from "../../../utils/apiHelper";

const YestardayTd = ({ topic }) => {
  const [data, setData] = useState("");

  useEffect(() => {
    fetchData(`/mqtt/yesterdays-highest?topic=${encodeURIComponent(topic)}`, setData);
  }, [topic]);

  return <td>{data || "-"}</td>;
};

export default React.memo(YestardayTd);
