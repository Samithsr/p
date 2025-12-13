import React, { useEffect, useState } from "react";
import "./style.css";
import apiClient from "../../../api/apiClient";
import { toast } from "react-toastify";

const SubscritionBtn = ({ topic, storeSubscribedTopic }) => {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    fetchSubscriptionStatus();
  }, [topic]);

  const fetchSubscriptionStatus = async () => {
    try {
      const res = await apiClient.get("/mqtt/get-all-subscribedtopics");
      setSubscribed(res.data.data.includes(topic));
    } catch (error) {
      console.error("Error fetching subscription status:", error.message);
    }
  };

  const handleSubscribe = async () => {
    try {
      await apiClient.post("/mqtt/subscribe", { topic });
      storeSubscribedTopic(topic);
      setSubscribed(true); // immediately update UI to "Unsubscribe"
      toast.success(`${topic} subscribed successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleUnsubscribe = async () => {
    try {
      await apiClient.post("/mqtt/unsubscribe", { topic });
      storeSubscribedTopic(topic);
      setSubscribed(false); // immediately update UI to "Subscribe"
      toast.warning(`${topic} unsubscribed successfully!`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div>
      {subscribed ? (
        <button
          onClick={handleUnsubscribe}
          className="admin_alltopicname_table_subscribed_button"
        >
          Unsubscribe
        </button>
      ) : (
        <button
          onClick={handleSubscribe}
          className="admin_alltopicname_table_subscribe_button"
        >
          Subscribe
        </button>
      )}
    </div>
  );
};

export default SubscritionBtn;
