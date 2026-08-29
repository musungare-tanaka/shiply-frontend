import { useState } from "react";
import { Link } from "react-router-dom";
import shiplyLogo from "/transparent-logo.svg";

const NavBar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navLinks = [
    { href: "#product", label: "Product" },
    { href: "#pricing", label: "Pricing" },
    { href: "#docs", label: "Docs" },
    { href: "#use-cases", label: "Use Cases" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 w-full bg-white shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center">
            <a href="#product" aria-label="Go to top of page">
              <img src={shiplyLogo} alt="Shiply Logo" className="h-16 w-auto" />
            </a>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-gray-700 hover:text-blue-600 font-medium transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-6">
            <Link
              to="/login"
              className="text-sm font-medium text-gray-700 transition-colors duration-200 hover:text-blue-600"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="rounded-full bg-blue-600 px-5 py-2 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-700"
            >
              Sign up
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
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-3 text-gray-700 font-medium transition-colors hover:bg-gray-50 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="pt-2 border-t">
            <Link
              to="/login"
              className="block rounded-lg px-3 py-3 text-gray-700 font-medium transition-colors hover:bg-gray-50 hover:text-blue-600"
              onClick={() => setIsOpen(false)}
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="mt-3 block rounded-lg bg-blue-600 py-3 text-center font-medium text-white transition-colors hover:bg-blue-700"
              onClick={() => setIsOpen(false)}
            >
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavBar;
