import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  ArrowRight, 
  Camera, 
  Search,
  Users,
  TrendingUp,
  Shield,
  Globe,
  CheckCircle,
  Play
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: Sprout,
      title: "Get a Plan Model",
      description: "Generate a complete agricultural plan using minimal land details, past crop history, and optional images. Receive detailed insights with audio explanations in regional languages, plus chat support for further discussion.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      icon: Search,
      title: "Crop Analysis Center",
      description: "Analyze crops through uploaded images or videos. Get instant feedback and insights with audio explanations in your local language.",
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-500"
    }
  ];

  const stats = [
    { number: "10K+", label: "Farmers Served" },
    { number: "50K+", label: "Crop Plans Generated" },
    { number: "95%", label: "Accuracy Rate" },
    { number: "24/7", label: "Support Available" }
  ];

  const benefits = [
    "AI-powered crop recommendations",
    "Multi-language audio explanations",
    "Real-time disease diagnosis",
    "Sustainable farming practices",
    "Expert chat support",
    "Mobile-friendly interface"
  ];

  return (
    <div className="min-h-screen bg-white">

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative bg-white py-20 lg:py-32"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 rounded-full text-sm font-medium">
                Simplify Your Farming Workflow
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6"
            >
              <span className="text-blue-600">
                CropGenesis
              </span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-gray-800 mb-12 max-w-4xl mx-auto leading-relaxed"
            >
              The intelligent agricultural planning platform designed for simplicity and precision. 
              Empower your farming decisions with just a few clicks.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="group bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <span>Try Dashboard</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  <Link
                    to="/crop-plan"
                    className="group border-2 border-gray-300 text-gray-800 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold text-lg flex items-center space-x-2"
                  >
                    <span>Plan a Crop</span>
                    <Sprout className="w-5 h-5" />
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="group bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-all duration-200 font-semibold text-lg flex items-center space-x-2 shadow-lg hover:shadow-xl"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
                  </Link>
                  <Link
                    to="/login"
                    className="group border-2 border-gray-300 text-gray-800 px-8 py-4 rounded-lg hover:bg-gray-50 transition-all duration-200 font-semibold text-lg flex items-center space-x-2"
                  >
                    <span>Sign In</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                </>
              )}
            </motion.div>
          </div>
        </div>

      </motion.section>

      {/* Features Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="py-20 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Powerful Features for Modern Farming
            </h2>
            <p className="text-xl text-gray-800 max-w-3xl mx-auto">
              Everything you need to optimize your agricultural operations and maximize your harvest
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 + index * 0.1 }}
                  className="group h-full"
                >
                  <div className="bg-white border border-gray-300 rounded-2xl p-8 hover:shadow-xl transition-all duration-300 group-hover:border-blue-200 h-full flex flex-col">
                    <div className="flex items-start space-x-4 flex-1">
                      <div className={`w-12 h-12 ${feature.bgColor} rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-200 flex-shrink-0`}>
                        <Icon className={`w-6 h-6 ${feature.iconColor}`} />
                      </div>
                      <div className="flex-1 flex flex-col">
                        <h3 className="text-xl font-semibold text-gray-800 mb-3">
                          {feature.title}
                        </h3>
                        <p className="text-gray-800 leading-relaxed flex-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>


      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="bg-gray-900 text-white py-12"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 CropGenesis. All rights reserved.
            </p>
          </div>
        </div>
      </motion.footer>
    </div>
  );
};

export default Home;
