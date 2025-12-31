
const Pricing = () => {
  return (
    <section className="w-full bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#474b4f]">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Only pay for what you deploy. No hidden fees. Scale when your app grows.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          
          {/* Free Tier */}
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-[#474b4f]">Free</h3>
            <p className="mt-2 text-gray-500">
              Perfect for learning and experiments
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-[#474b4f]">$0</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-gray-600">
              <li>✔ 1 Service</li>
              <li>✔ 512MB RAM</li>
              <li>✔ Shared CPU</li>
              <li>✔ Community Support</li>
              <li>✔ Auto-sleep on inactivity</li>
            </ul>

            <button className="mt-8 w-full border border-[#474b4f] text-white py-2 rounded-md font-medium hover:bg-[#474b4f] hover:text-white transition">
              Get Started
            </button>
          </div>

          {/* Starter Tier */}
          <div className="border-2 border-[#474b4f] rounded-xl p-8 flex flex-col shadow-md">
            <h3 className="text-xl font-semibold text-[#474b4f]">Starter</h3>
            <p className="mt-2 text-gray-500">
              For production-ready side projects
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-[#474b4f]">$10</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-gray-600">
              <li>✔ Up to 3 Services</li>
              <li>✔ 1GB RAM per service</li>
              <li>✔ Dedicated CPU</li>
              <li>✔ Custom Domains</li>
              <li>✔ Email Support</li>
            </ul>

            <button className="mt-8 w-full bg-black text-white py-2 rounded-md font-medium hover:opacity-90 transition">
              Deploy Now
            </button>
          </div>

          {/* Pro Tier */}
          <div className="border border-gray-200 rounded-xl p-8 flex flex-col">
            <h3 className="text-xl font-semibold text-[#474b4f]">Pro</h3>
            <p className="mt-2 text-gray-500">
              Built for growing teams and startups
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-[#474b4f]">$30</span>
              <span className="text-gray-500">/month</span>
            </div>

            <ul className="mt-6 space-y-3 text-gray-600">
              <li>✔ Unlimited Services</li>
              <li>✔ Up to 4GB RAM</li>
              <li>✔ Priority CPU</li>
              <li>✔ Zero-downtime deploys</li>
              <li>✔ Priority Support</li>
            </ul>

            <button className="mt-8 w-full border border-[#474b4f] text-white py-2 rounded-md font-medium hover:bg-[#474b4f] hover:text-white transition">
              Upgrade
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Pricing;
