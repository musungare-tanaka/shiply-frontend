
const UseCases = () => {
  return (
    <section className="w-full bg-gray-50 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#474b4f]">
            Built for how developers deploy
          </h2>
          <p className="mt-4 text-gray-600 max-w-2xl mx-auto">
            Whether you're shipping an API, running microservices, or launching
            a startup, Shiply adapts to your workflow.
          </p>
        </div>

        {/* Use Case Cards */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">

          {/* Backend APIs */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Backend APIs
            </h3>
            <p className="text-gray-600 mb-4">
              Deploy REST or GraphQL APIs built with Spring Boot, Node.js, or Go
              without managing servers or cloud configs.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              Ideal for public and internal APIs
            </span>
          </div>

          {/* Microservices */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Microservices
            </h3>
            <p className="text-gray-600 mb-4">
              Run each service independently with its own resources, scaling,
              and deployment lifecycle.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              One repo, one service
            </span>
          </div>

          {/* Startups & MVPs */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Startups & MVPs
            </h3>
            <p className="text-gray-600 mb-4">
              Launch fast without hiring DevOps. Focus on product development
              while Shiply handles builds and deployments.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              From idea to production
            </span>
          </div>

          {/* Side Projects */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Side Projects & Learning
            </h3>
            <p className="text-gray-600 mb-4">
              Perfect for students and hobbyists who want real deployments
              without the complexity of cloud providers.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              Free tier friendly
            </span>
          </div>

          {/* Internal Tools */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Internal Tools
            </h3>
            <p className="text-gray-600 mb-4">
              Host admin dashboards, internal APIs, and automation services with
              predictable pricing and secure access.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              Reliable & private
            </span>
          </div>

          {/* Background Workers */}
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            <h3 className="text-xl font-semibold text-[#474b4f] mb-3">
              Background Workers
            </h3>
            <p className="text-gray-600 mb-4">
              Run schedulers, workers, and long-running jobs inside always-on
              containers with controlled resources.
            </p>
            <span className="text-sm font-medium text-[#474b4f]">
              Event-driven workloads
            </span>
          </div>

        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <a
            href="/login"
            className="inline-block bg-[#474b4f] text-white px-6 py-3 rounded-md font-medium hover:opacity-90 transition"
          >
            Deploy your first service
          </a>
        </div>

      </div>
    </section>
  );
};

export default UseCases;
