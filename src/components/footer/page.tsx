
const Footer = () => {
  return (
    <footer className="bg-[#474b4f] text-white py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
        
        {/* Left Side */}
        <p className="text-sm">
          &copy; {new Date().getFullYear()} Shiply. All rights reserved.
        </p>

        {/* Center / Middle */}
        <div className="flex space-x-6 mt-4 md:mt-0">
          <a
            href="#"
            className="hover:underline text-sm"
            aria-label="Privacy Policy"
          >
            Privacy Policy
          </a>
          <a
            href="#"
            className="hover:underline text-sm"
            aria-label="Terms of Service"
          >
            Terms of Service
          </a>
          <a
            href="#"
            className="hover:underline text-sm"
            aria-label="Contact"
          >
            Contact
          </a>
        </div>

        {/* Right Side */}
        <p className="text-sm mt-4 md:mt-0">
          Built by an independent developer in Zimbabwe 🇿🇼
        </p>
      </div>
    </footer>
  );
};

export default Footer;
