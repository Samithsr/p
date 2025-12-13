import React, { useState } from "react";
import "../index.css";
import { toast } from "react-toastify";

const ConfigDevice = () => {
  const [data, setData] = useState({
    gateway: "",
    slaveid: "",
    address: "",
    functioncode: "",
    size: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = () => {
    if (validateForm(data)) {
      console.log(data);
    } else {
      toast.warning("Please fill in all fields.");
    }
  };

  const validateForm = (formData) => {
    return Object.values(formData).every((field) => field.trim() !== "");
  };

  return (
    <div className="admin_configdevice_main_container">
      <header>
        <div>
          <div>
            {["gateway", "slaveid", "address", "functioncode", "size"].map(
              (field) => (
                <div className="admin_configdevice_input_container" key={field}>
                  <label htmlFor={field}>
                    {field.charAt(0).toUpperCase() + field.slice(1)}
                  </label>
                  <input
                    type="text"
                    name={field}
                    id={field}
                    value={data[field]}
                    onChange={handleChange}
                    placeholder={`Enter ${field}...`}
                  />
                </div>
              )
            )}
          </div>

          <div className="admin_configdevice_submit_container">
            <button onClick={handleSubmit}>Submit</button>
          </div>
        </div>
      </header>

      <section>
        <div className="admin_configdevice_created_section">
          <div className="admin_configdevice_created_section_header">
            <input type="search" placeholder="Search..." />
            <select>
              <option value="">Search by...</option>
              <option value="slaveid">Slave ID</option>
              <option value="address">Address</option>
            </select>
          </div>

          <div className="admin_configdevice_created_section_body">
            {[...Array(8)].map((_, index) => (
              <div key={index}></div>
            ))}
          </div>
        </div>

        <div className="admin_configdevice_edit_section">
          <div className="admin_configdevice_edit_section_not_item_selected">
            <p>No item selected to edit...!</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ConfigDevice;
