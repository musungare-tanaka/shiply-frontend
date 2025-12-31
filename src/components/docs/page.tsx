
const Docs = () => {
  return (
    <section className="w-full bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <aside className="md:col-span-1 border-r border-gray-200 pr-4">
            <h2 className="text-lg font-semibold text-[#474b4f] mb-4">
              Documentation
            </h2>
            <nav className="space-y-3 text-gray-600">
              <a href="#" className="block hover:text-[#474b4f] font-medium">
                Getting Started
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                Deploying Your First App
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                Supported Languages
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                Environment Variables
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                Docker Builds
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                Scaling & Resources
              </a>
              <a href="#" className="block hover:text-[#474b4f]">
                CLI & API
              </a>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="md:col-span-3">
            <h1 className="text-3xl font-bold text-[#474b4f] mb-6">
              Getting Started with Shiply
            </h1>

            <p className="text-gray-600 mb-6">
              Shiply is a developer-first hosting platform that lets you deploy
              backend applications directly from Git. No infrastructure setup,
              no YAML files, just push and deploy.
            </p>

            {/* Step 1 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#474b4f] mb-2">
                1. Connect Your Repository
              </h3>
              <p className="text-gray-600">
                Paste your GitHub repository URL into Shiply. We automatically
                detect your project type and build configuration.
              </p>
            </div>

            {/* Step 2 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#474b4f] mb-2">
                2. Automatic Build & Deploy
              </h3>
              <p className="text-gray-600">
                Shiply builds your app using Docker under the hood. Java
                projects use Maven or Gradle by default, while Node.js and Go
                are auto-detected.
              </p>

              <div className="mt-4 bg-gray-100 rounded-md p-4 text-sm font-mono text-gray-800">
                git push origin main <br />
                → Build started <br />
                → Container created <br />
                → App deployed
              </div>
            </div>

            {/* Step 3 */}
            <div className="mb-8">
              <h3 className="text-xl font-semibold text-[#474b4f] mb-2">
                3. Access Your Service
              </h3>
              <p className="text-gray-600">
                Once deployed, Shiply provides you with a secure public URL.
                Custom domains can be added from the dashboard.
              </p>
            </div>

            {/* Callout */}
            <div className="mt-10 p-6 border-l-4 border-[#474b4f] bg-gray-50">
              <p className="text-gray-700">
                💡 <strong>Tip:</strong> Shiply works best with stateless
                services. Use managed databases or external storage for
                persistence.
              </p>
            </div>
          </main>
        </div>
      </div>
    </section>
  );
};

export default Docs;
