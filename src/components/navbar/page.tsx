import { useState } from "react";
import { Link } from "react-router-dom";
import shiplyLogo from "/transparent-logo.svg";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <img src={shiplyLogo} alt="Shiply Logo" className="h-16 w-auto" />
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Product
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Pricing
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Docs
            </a>
            <a 
              href="#" 
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
            >
              Use Cases
            </a>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/login"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-blue-600 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                {isOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div 
        className={`md:hidden bg-white shadow-lg transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 overflow-hidden'
        }`}
      >
        <div className="px-4 pt-2 pb-4 space-y-4 border-t">
          <a 
            href="#" 
            className="block py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-gray-50 rounded-lg px-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Product
          </a>
          <a 
            href="#" 
            className="block py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-gray-50 rounded-lg px-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Pricing
          </a>
          <a 
            href="#" 
            className="block py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-gray-50 rounded-lg px-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Docs
          </a>
          <a 
            href="#" 
            className="block py-3 text-gray-700 hover:text-blue-600 font-medium hover:bg-gray-50 rounded-lg px-3 transition-colors"
            onClick={() => setIsOpen(false)}
          >
            Use Cases
          </a>
          <div className="pt-2 border-t">
            <Link
              to="/login"
              className="block bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center"
              onClick={() => setIsOpen(false)}
            >
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;