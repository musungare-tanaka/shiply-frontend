import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const serviceOptions = [
  { value: "database", label: "Database" },
  { value: "github", label: "GitHub Repository" },
];

const databaseEngines = [
  { 
    value: "postgres", 
    label: "PostgreSQL",
    image: "https://www.postgresql.org/media/img/about/press/elephant.png"
  },
  { 
    value: "mysql", 
    label: "MySQL",
    image: "https://www.mysql.com/common/logos/mysql-logo.svg"
  },
  { 
    value: "mongodb", 
    label: "MongoDB",
    image: "https://www.mongodb.com/community/logos/mongodb-community-logo.svg"
  },
  { 
    value: "redis", 
    label: "Redis",
    image: "https://redis.io/images/redis-logo.svg"
  },
];

export default function NewServicePage() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [serviceType, setServiceType] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [dbType, setDbType] = useState("");
  const [dbConfig, setDbConfig] = useState({
    username: "",
    password: "",
    database: "",
    port: "",
  });
  const [githubConfig, setGithubConfig] = useState({
    repository: "",
    branch: "main",
    deploymentPath: "/",
  });

  const handleDbChange = (e) => {
    const { name, value } = e.target;
    setDbConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleGithubChange = (e) => {
    const { name, value } = e.target;
    setGithubConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const payload = {
      name: serviceName,
      type: serviceType,
      config:
        serviceType === "database"
          ? {
              engine: dbType,
              ...dbConfig,
            }
          : serviceType === "github"
          ? { ...githubConfig }
          : {},
    };

    console.log("Creating service payload:", payload);

    // TODO: backend integration
    alert("Service config created (frontend only for now)");
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(`/dashboard/projects/${projectId}`)}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft size={20} />
          <span>Back to Project</span>
        </button>
      </div>

      <div className="max-w-xl mx-auto p-6 bg-slate-900 border border-slate-800 rounded-xl">
        <h1 className="text-2xl font-bold text-white mb-6">
          Create New Service
        </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Service Name */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Service Name
          </label>
          <input
            type="text"
            required
            value={serviceName}
            onChange={(e) => setServiceName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            placeholder="e.g. production-db"
          />
        </div>

        {/* Service Type */}
        <div>
          <label className="block text-sm text-slate-400 mb-1">
            Service Type
          </label>
          <select
            required
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          >
            <option value="">Select service type</option>
            {serviceOptions.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* DATABASE CONFIG */}
        {serviceType === "database" && (
          <div className="space-y-4 border border-slate-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white">
              Database Configuration
            </h3>

            {/* DB Engine Selection with Images */}
            <div>
              <label className="block text-sm text-slate-400 mb-3">
                Database Engine
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {databaseEngines.map((db) => (
                  <button
                    key={db.value}
                    type="button"
                    onClick={() => setDbType(db.value)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition ${
                      dbType === db.value
                        ? "border-indigo-500 bg-indigo-500/10"
                        : "border-slate-700 bg-slate-950 hover:border-slate-600"
                    }`}
                  >
                    <img
                      src={db.image}
                      alt={db.label}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                    <span className="text-sm text-white text-center">{db.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* DB Name */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Database Name
              </label>
              <input
                type="text"
                name="database"
                required
                value={dbConfig.database}
                onChange={handleDbChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="dbname"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Username
              </label>
              <input
                type="text"
                name="username"
                required
                value={dbConfig.username}
                onChange={handleDbChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="admin"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                name="password"
                required
                value={dbConfig.password}
                onChange={handleDbChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            {/* Port */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Port
              </label>
              <input
                type="number"
                name="port"
                required
                value={dbConfig.port}
                onChange={handleDbChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="5432"
              />
            </div>
          </div>
        )}

        {/* GITHUB CONFIG */}
        {serviceType === "github" && (
          <div className="space-y-4 border border-slate-800 rounded-xl p-4">
            <h3 className="text-lg font-semibold text-white">
              GitHub Configuration
            </h3>

            {/* GitHub Repository */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Repository URL
              </label>
              <input
                type="text"
                name="repository"
                required
                value={githubConfig.repository}
                onChange={handleGithubChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="https://github.com/username/repo"
              />
            </div>

            {/* Branch */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Branch
              </label>
              <input
                type="text"
                name="branch"
                required
                value={githubConfig.branch}
                onChange={handleGithubChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="main"
              />
            </div>

            {/* Deployment Path */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Deployment Path
              </label>
              <input
                type="text"
                name="deploymentPath"
                required
                value={githubConfig.deploymentPath}
                onChange={handleGithubChange}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                placeholder="/"
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 rounded-lg transition font-medium"
        >
          Create Service
        </button>
      </form>
      </div>
    </div>
  );
}