// Import the axios library for making HTTP requests
import axios from "axios";

// Create an axios instance with a predefined configuration
const apiClient = axios.create({
  // Set the base URL for all requests made with this axios instance
  // Local development environment: http://localhost:5000/api/v1
  baseURL: "http://localhost:5000/api/v1",
  // Note: For deployment, the base URL can be updated to:
  // - Render.com: https://sarayu-node-backend-hti6.onrender.com/api/v1
  // - AWS: http://13.127.36.85:5000/api/v1
});

// Export the configured axios instance for use in other parts of the application
export default apiClient;