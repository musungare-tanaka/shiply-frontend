import { useState } from "react";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 mt-2">Sign in to your Shiply account</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-10">
          {/* Google Login */}
          <button
            className="w-full flex items-center justify-center gap-3 border border-gray-200 rounded-xl py-3.5 hover:bg-gray-50 transition-all duration-200 hover:border-gray-300 hover:shadow-sm active:scale-[0.98]"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 48 48"
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
            <span className="text-sm font-semibold text-black">
              Continue with Google
            </span>
          </button>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-400">or</span>
            </div>
          </div>

          {/* Login Form */}
          <form className="space-y-6">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  placeholder="you@company.com"
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <a
                  href="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder:text-gray-400"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me for 30 days
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3.5 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-200 hover:shadow-lg active:scale-[0.98]"
            >
              Sign in
            </button>
          </form>

          {/* Sign up link */}
          <div className="mt-8 pt-8 border-t border-gray-100">
            <p className="text-center text-gray-600">
              Don't have an account?{" "}
              <a
                href="/signup"
                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
              >
                Create account
              </a>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="text-sm text-blue-800">Your data is protected with enterprise-grade security</span>
            </div>
          </div>
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            By continuing, you agree to our{" "}
            <a href="/terms" className="text-gray-600 hover:underline">Terms</a>
            {" "}and{" "}
            <a href="/privacy" className="text-gray-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;