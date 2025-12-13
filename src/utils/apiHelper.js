import apiClient from "../api/apiClient";

export const fetchData = async (url, setData) => {
  try {
    const res = await apiClient.get(url);
    setData(res?.data?.message);
  } catch (error) {
    console.error("Error fetching data:", error?.message);
  }
};
