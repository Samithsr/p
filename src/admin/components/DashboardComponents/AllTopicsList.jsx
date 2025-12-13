import React from "react";
import "./style.css";
import { MdDelete } from "react-icons/md";
import SubscritionBtn from "./SubscritionBtn";

const AllTopicsList = ({
  topiCreated,
  setTopicToDelete,
  setShowTopicDeleteModel,
  topiListFilter,
  topicList,
  storeSubscribedTopic,
}) => {
  return (
    <div className="_futuristic_dashboard_table_container">
      <div className="_futuristic_dashboard_table_wrapper">
        <table className="_futuristic_dashboard_table">
          <thead>
            <tr>
              <th>
                TagName <span className="_futuristic_dashboard_count">[{topicList.length}]</span>
              </th>
              <th>Status</th>
              <th>Delete</th>
            </tr>
          </thead>
          <tbody>
            {topiListFilter?.map((item, index) => (
              <tr key={index}>
                <td>{item.topic}</td>
                <td>
                  <SubscritionBtn
                    storeSubscribedTopic={storeSubscribedTopic}
                    topic={item.topic}
                  />
                </td>
                <td>
                  {item?.isEmpty ? (
                    <MdDelete
                      size={"22"}
                      className="_futuristic_dashboard_action_icon"
                      onClick={() => [
                        setTopicToDelete(item?.topic),
                        setShowTopicDeleteModel(true),
                      ]}
                    />
                  ) : (
                    <MdDelete
                      size={"22"}
                      className="_futuristic_dashboard_action_icon _futuristic_dashboard_action_icon_disabled"
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AllTopicsList;