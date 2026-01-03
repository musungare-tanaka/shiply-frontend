import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const navigate = useNavigate();

  const email = localStorage.getItem("userEmail");
  const role = localStorage.getItem("userRole");

  const handleLogout = () => {
    // Clear auth data
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userRole");

    // Redirect to login
    navigate("/login");
  };

  return (
    <div className="p-8 min-h-screen bg-gray-100">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-[#474b4f]">
          Shiply Dashboard
        </h1>

        <button
          onClick={handleLogout}
          className="bg-red-500 text-white px-4 py-2 rounded-md font-medium hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Account Information</h2>
        <p>
          <span className="font-medium">Email:</span>{" "}
          {email ?? "user@shiply.dev"}
        </p>
        <p>
          <span className="font-medium">Role:</span>{" "}
          {role ?? "USER"}
        </p>
      </div>

      {/* Fake Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500 text-sm">Active Projects</h3>
          <p className="text-3xl font-bold mt-2">3</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500 text-sm">Running Containers</h3>
          <p className="text-3xl font-bold mt-2">5</p>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h3 className="text-gray-500 text-sm">Monthly Usage</h3>
          <p className="text-3xl font-bold mt-2">72%</p>
        </div>
      </div>

      {/* Fake Activity */}
      <div className="bg-white rounded-xl shadow p-6 mt-6">
        <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
        <ul className="space-y-2 text-sm">
          <li>🚀 Deployed <strong>api-service</strong></li>
          <li>🔄 Restarted <strong>auth-service</strong></li>
          <li>📦 Created project <strong>shiply-backend</strong></li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;
