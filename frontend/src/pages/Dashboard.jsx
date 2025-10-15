import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sprout, 
  Camera, 
  TrendingUp, 
  Calendar,
  MapPin,
  Droplets,
  AlertTriangle,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { cropPlanAPI, diagnosisAPI, historyAPI } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CropPlanCard from '../components/CropPlanCard';
import DiagnosisCard from '../components/DiagnosisCard';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    cropPlans: { totalPlans: 0, totalFollowUps: 0 },
    diagnoses: { totalDiagnoses: 0, highSeverity: 0, criticalSeverity: 0 }
  });
  const [recentHistory, setRecentHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      const [cropPlanStats, diagnosisStats, historyData] = await Promise.all([
        cropPlanAPI.getStats(),
        diagnosisAPI.getStats(),
        historyAPI.getHistory({ limit: 6 })
      ]);

      setStats({
        cropPlans: cropPlanStats.data.data.stats,
        diagnoses: diagnosisStats.data.data.stats
      });

      setRecentHistory(historyData.data.data.history);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCropPlan = async (planId) => {
    try {
      await cropPlanAPI.deletePlan(planId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting crop plan:', error);
    }
  };

  const handleDeleteDiagnosis = async (diagnosisId) => {
    try {
      await diagnosisAPI.deleteDiagnosis(diagnosisId);
      fetchDashboardData(); // Refresh data
    } catch (error) {
      console.error('Error deleting diagnosis:', error);
    }
  };

  const handleViewItem = (item) => {
    // This would open a modal or navigate to detail view
    console.log('View item:', item);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your crops today
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Sprout className="w-6 h-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Crop Plans</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.cropPlans.totalPlans}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Camera className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Diagnoses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.diagnoses.totalDiagnoses}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Severity</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.diagnoses.highSeverity + stats.diagnoses.criticalSeverity}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Follow-ups</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.cropPlans.totalFollowUps}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8"
        >
          <Link
            to="/crop-plan"
            className="card-hover group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center group-hover:bg-primary-200 transition-colors duration-200">
                  <Sprout className="w-6 h-6 text-primary-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Create Crop Plan</h3>
                  <p className="text-sm text-gray-600">Get AI-powered crop recommendations</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors duration-200" />
            </div>
          </Link>

          <Link
            to="/diagnosis"
            className="card-hover group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center group-hover:bg-red-200 transition-colors duration-200">
                  <Camera className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-gray-900">Disease Diagnosis</h3>
                  <p className="text-sm text-gray-600">Upload images for AI analysis</p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-red-600 transition-colors duration-200" />
            </div>
          </Link>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <Link
              to="/history"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium transition-colors duration-200"
            >
              View All
            </Link>
          </div>

          {recentHistory.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {recentHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                >
                  {item.type === 'crop-plan' ? (
                    <CropPlanCard
                      plan={item.data}
                      onDelete={handleDeleteCropPlan}
                      onView={handleViewItem}
                    />
                  ) : (
                    <DiagnosisCard
                      diagnosis={item.data}
                      onDelete={handleDeleteDiagnosis}
                      onView={handleViewItem}
                    />
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No activity yet</h3>
              <p className="text-gray-600 mb-6">Start by creating your first crop plan or uploading a diagnosis</p>
              <div className="flex justify-center space-x-4">
                <Link to="/crop-plan" className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Crop Plan
                </Link>
                <Link to="/diagnosis" className="btn-outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Diagnosis
                </Link>
              </div>
            </div>
          )}
        </motion.div>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">{user?.name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="w-4 h-4 mr-1" />
                  {user?.location}
                </div>
              </div>
            </div>
            <Link
              to="/profile"
              className="btn-outline"
            >
              Edit Profile
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
