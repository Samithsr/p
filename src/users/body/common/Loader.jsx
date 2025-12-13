const Loader = ({ small }) => (
    <div className={`spinner-container ${small ? "small" : ""}`}>
      <div className="spinner"></div>
    </div>
  );
  
  export default Loader;