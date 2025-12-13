import React, { Component, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../index.css";
import { BiSolidReport } from "react-icons/bi";
import DashboardCTitle from "../common/DashboardCTitle";
import { toast } from "react-toastify";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in Reports component:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          <h4>Something went wrong loading the report.</h4>
          <p>{this.state.error?.message}</p>
          <button 
            className="btn btn-primary mt-2"
            onClick={() => window.location.reload()}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const Reports = () => {
  const [ReportComponent, setReportComponent] = useState(null);
  const [error, setError] = useState(null);
  const { topic } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const loadReport = async () => {
      try {
        // Decode the URL parameter
        const decodedTopic = topic ? decodeURIComponent(topic) : null;
        
        // Dynamically import the Report component
        const module = await import("../../users/body/components/Report");
        
        // Create a wrapper component that passes the topic as a prop
        const WrappedReport = () => {
          return <module.default topic={decodedTopic} />;
        };
        
        setReportComponent(() => WrappedReport);
      } catch (err) {
        console.error("Failed to load Report component:", err);
        setError("Failed to load reports. Please try again later.");
      }
    };

    loadReport();
  }, [topic]);

  if (error) {
    return (
      <div className="alert alert-danger m-3">
        <h4>Error Loading Reports</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div
      className="dashboard_main_section_container"
      data-aos="zoom-in"
      data-aos-duration="300"
      data-aos-once="true"
    >
      <DashboardCTitle title={"Reports"} icon={<BiSolidReport />} />
      <div className="mt-4 p-3">
        <ErrorBoundary>
          {ReportComponent ? <ReportComponent /> : (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '50vh' }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading reports...</span>
              </div>
            </div>
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
};

export default Reports;