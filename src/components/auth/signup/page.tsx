import { Link } from "react-router-dom";

const Signup = () => {
  return (
    <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-[#474b4f]">
            Create your Shiply account
          </h1>
          <p className="text-gray-500 mt-2 text-sm">
            Start deploying your apps in minutes
          </p>
        </div>

        {/* Google Signup */}
        <button
          className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 hover:bg-gray-50 transition"
        >
          <svg
            className="w-5 h-5"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              fill="#EA4335"
              d="M24 9.5c3.1 0 5.9 1.1 8.1 3.1l6-6C34.4 2.7 29.5 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.3 5.7C12 13 17.6 9.5 24 9.5z"
            />
            <path
              fill="#34A853"
              d="M46.1 24.6c0-1.7-.2-3.4-.5-5H24v9.4h12.4c-.6 3-2.3 5.6-4.8 7.3l7.4 5.7c4.3-4 6.9-9.9 6.9-17.4z"
            />
            <path
              fill="#4A90E2"
              d="M9.9 28.6c-.5-1.4-.8-2.9-.8-4.6s.3-3.2.8-4.6l-7.3-5.7C.9 16.9 0 20.4 0 24s.9 7.1 2.6 10.3l7.3-5.7z"
            />
            <path
              fill="#FBBC05"
              d="M24 48c6.5 0 12-2.1 16-5.7l-7.4-5.7c-2 1.4-4.6 2.2-8.6 2.2-6.4 0-12-3.5-14.1-8.5l-7.3 5.7C6.5 42.6 14.6 48 24 48z"
            />
          </svg>
          <span className="text-sm font-medium text-gray-700">
            Continue with Google
          </span>
        </button>

        {/* Divider */}
        <div className="flex items-center my-6">
          <div className="flex-1 h-px bg-gray-300" />
          <span className="px-3 text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-300" />
        </div>

        {/* Signup Form */}
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-600">
              Email
            </label>
            <input
              type="email"
              placeholder="you@company.com"
              required
              className="mt-1 w-full rounded-md border text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="mt-1 w-full rounded-md  text-black bg-white border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600">
              Confirm Password
            </label>
            <input
              type="password"
              placeholder="••••••••"
              required
              className="mt-1 w-full rounded-md border  text-black bg-white border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#474b4f]"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#474b4f] text-white py-2 rounded-md font-medium hover:opacity-90 transition"
          >
            Sign Up
          </button>
        </form>

        {/* Login link */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link to="/login" className="text-[#474b4f] font-medium hover:underline">
            Log in
          </Link>
        </p>
    </div>
  );
};

export default Signup;
