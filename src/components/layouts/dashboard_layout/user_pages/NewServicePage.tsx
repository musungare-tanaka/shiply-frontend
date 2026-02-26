import React, { useState } from "react";

const serviceOptions = [
  { value: "database", label: "Database" },
  { value: "github", label: "GitHub Repository (Coming Soon)", disabled: true },
];

const databaseEngines = [
  { value: "postgres", label: "PostgreSQL" },
  { value: "mysql", label: "MySQL" },
  { value: "mongodb", label: "MongoDB" },
  { value: "redis", label: "Redis" },
];

export default function NewServicePage() {
  const [serviceType, setServiceType] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [dbType, setDbType] = useState("");
  const [dbConfig, setDbConfig] = useState({
    username: "",
    password: "",
    database: "",
    port: "",
  });

  const handleDbChange = (e) => {
    const { name, value } = e.target;
    setDbConfig((prev) => ({ ...prev, [name]: value }));
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
          : {},
    };

    console.log("Creating service payload:", payload);

    // TODO: backend integration
    alert("Service config created (frontend only for now)");
  };

  return (
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

            {/* DB Engine */}
            <div>
              <label className="block text-sm text-slate-400 mb-1">
                Database Engine
              </label>
              <select
                required
                value={dbType}
                onChange={(e) => setDbType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                <option value="">Select database</option>
                {databaseEngines.map((db) => (
                  <option key={db.value} value={db.value}>
                    {db.label}
                  </option>
                ))}
              </select>
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

        {/* GITHUB PLACEHOLDER */}
        {serviceType === "github" && (
          <div className="border border-dashed border-slate-700 rounded-xl p-4 text-slate-400 text-sm">
            GitHub service creation is coming soon.
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
  );
}