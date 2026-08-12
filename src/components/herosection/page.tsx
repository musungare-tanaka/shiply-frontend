import { CheckCircle, Cloud, Code, Zap } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="product" className="bg-white pt-20 pb-16 md:pt-32 md:pb-24 scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
          {/* Left Content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Zap className="h-4 w-4" />
              No setup required
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
              You Push,
              <span className="block text-slate-600">We Build and Deploy</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Deploy applications with zero infrastructure headache. Focus on writing code while we manage deployments, scaling, and global distribution.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-12">
              <div className="bg-black px-8 py-3 rounded-lg font-medium text-base text-white text-center">
                Launching soon
              </div>
              <div className="border border-gray-300 px-8 py-3 rounded-lg font-medium text-base text-gray-500 text-center">
                Landing page preview
              </div>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-col sm:flex-row items-center gap-6 text-gray-600 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-gray-400" />
                <span>Free tier available</span>
              </div>
            </div>
          </div>

          {/* Right Content - Visual/Code Block */}
          <div className="mt-12 lg:mt-0">
            {/* Code Deployment Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-1 shadow-2xl">
              <div className="bg-gray-900 rounded-xl p-6">
                {/* Terminal Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                    <span className="text-gray-400 text-sm ml-4 font-mono">terminal</span>
                  </div>
                  <Code className="h-5 w-5 text-gray-400" />
                </div>

                {/* Terminal Content */}
                <div className="font-mono text-sm space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">$</span>
                    <span className="text-white">git push origin main</span>
                  </div>
                  <div className="text-blue-400">
                    ✓ Shiply detected new push...
                  </div>
                  <div className="text-blue-400">
                    ✓ Building your application...
                  </div>
                  <div className="text-yellow-400">
                    ⚡ Running optimizations...
                  </div>
                  <div className="text-green-400">
                    ✅ Deployment successful!
                  </div>
                  <div className="text-white mt-4">
                    Your app is live at:{" "}
                    <span className="text-blue-300 underline">https://your-app.shiply.dev</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-2 gap-4 mt-8">
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors duration-200">
                <Cloud className="h-6 w-6 text-slate-700 mb-3" />
                <h3 className="font-semibold text-gray-900 text-sm">Auto Scaling</h3>
                <p className="text-xs text-gray-600 mt-1">Scales with your traffic</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors duration-200">
                <div className="h-6 w-6 bg-slate-700 rounded flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-xs">SSL</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Free SSL</h3>
                <p className="text-xs text-gray-600 mt-1">Automatic HTTPS</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors duration-200">
                <div className="h-6 w-6 bg-slate-700 rounded flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-xs">CDN</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Global CDN</h3>
                <p className="text-xs text-gray-600 mt-1">Lightning fast delivery</p>
              </div>
              <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-100 transition-colors duration-200">
                <div className="h-6 w-6 bg-slate-700 rounded flex items-center justify-center mb-3">
                  <span className="text-white font-bold text-xs">CI/CD</span>
                </div>
                <h3 className="font-semibold text-gray-900 text-sm">Built-in CI/CD</h3>
                <p className="text-xs text-gray-600 mt-1">Automated deployments</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
