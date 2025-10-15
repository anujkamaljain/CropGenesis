import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  History, 
  ArrowLeft, 
  Filter, 
  Search,
  Trash2,
  Eye,
  Calendar,
  Sprout,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { historyAPI } from '../utils/api';
import { handleApiSuccess, handleApiError } from '../utils/api';
import LoadingSpinner from '../components/LoadingSpinner';
import CropPlanCard from '../components/CropPlanCard';
import DiagnosisCard from '../components/DiagnosisCard';

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all'); // 'all', 'crop-plans', 'diagnoses'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState([]);

  useEffect(() => {
    fetchHistory();
  }, [currentPage, filter]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const params = {
        page: currentPage,
        limit: 12,
        ...(filter !== 'all' && { type: filter })
      };

      const response = await historyAPI.getHistory(params);
      
      if (response.data.success) {
        setHistory(response.data.data.history);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteItem = async (type, id) => {
    try {
      await historyAPI.deleteItem(type, id);
      handleApiSuccess('Item deleted successfully');
      fetchHistory();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleViewItem = (item) => {
    // This would open a modal or navigate to detail view
    console.log('View item:', item);
  };

  const handleSelectItem = (itemId, type) => {
    setSelectedItems(prev => {
      const itemKey = `${type}-${itemId}`;
      if (prev.includes(itemKey)) {
        return prev.filter(id => id !== itemKey);
      } else {
        return [...prev, itemKey];
      }
    });
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;

    try {
      for (const itemKey of selectedItems) {
        const [type, id] = itemKey.split('-');
        await historyAPI.deleteItem(type, id);
      }
      
      handleApiSuccess(`${selectedItems.length} items deleted successfully`);
      setSelectedItems([]);
      fetchHistory();
    } catch (error) {
      handleApiError(error);
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      try {
        await historyAPI.clearHistory(filter !== 'all' ? filter : undefined);
        handleApiSuccess('History cleared successfully');
        fetchHistory();
      } catch (error) {
        handleApiError(error);
      }
    }
  };

  const filteredHistory = history.filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    if (item.type === 'crop-plan') {
      return item.data.planText.toLowerCase().includes(searchLower) ||
             item.data.inputs.season.toLowerCase().includes(searchLower) ||
             item.data.inputs.soilType.toLowerCase().includes(searchLower);
    } else {
      return item.data.diagnosisText.toLowerCase().includes(searchLower) ||
             (item.data.diseaseName && item.data.diseaseName.toLowerCase().includes(searchLower));
    }
  });

  const getFilterCounts = () => {
    const counts = { all: 0, 'crop-plans': 0, diagnoses: 0 };
    history.forEach(item => {
      counts.all++;
      counts[item.type === 'crop-plan' ? 'crop-plans' : 'diagnoses']++;
    });
    return counts;
  };

  const filterCounts = getFilterCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Link
            to="/dashboard"
            className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                <History className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">History</h1>
                <p className="text-gray-600">View and manage your crop plans and diagnoses</p>
              </div>
            </div>

            {selectedItems.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">
                  {selectedItems.length} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="btn-secondary flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Selected
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Filters and Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            {/* Filter Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {[
                { key: 'all', label: 'All', icon: History },
                { key: 'crop-plans', label: 'Crop Plans', icon: Sprout },
                { key: 'diagnoses', label: 'Diagnoses', icon: Camera }
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => {
                    setFilter(key);
                    setCurrentPage(1);
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    filter === key
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-2" />
                  {label}
                  <span className="ml-2 text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">
                    {filterCounts[key]}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search history..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Showing {filteredHistory.length} of {history.length} items
            </div>
            <button
              onClick={handleClearAll}
              className="text-sm text-red-600 hover:text-red-700 transition-colors duration-200"
            >
              Clear All History
            </button>
          </div>
        </motion.div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredHistory.length > 0 ? (
          <>
            {/* History Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mb-8"
            >
              {filteredHistory.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="relative"
                >
                  {/* Selection Checkbox */}
                  <div className="absolute top-4 left-4 z-10">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(`${item.type === 'crop-plan' ? 'crop-plans' : 'diagnoses'}-${item.id}`)}
                      onChange={() => handleSelectItem(item.id, item.type === 'crop-plan' ? 'crop-plans' : 'diagnoses')}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </div>

                  {item.type === 'crop-plan' ? (
                    <CropPlanCard
                      plan={item.data}
                      onDelete={(id) => handleDeleteItem('crop-plans', id)}
                      onView={handleViewItem}
                    />
                  ) : (
                    <DiagnosisCard
                      diagnosis={item.data}
                      onDelete={(id) => handleDeleteItem('diagnoses', id)}
                      onView={handleViewItem}
                    />
                  )}
                </motion.div>
              ))}
            </motion.div>

            {/* Pagination */}
            {totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-center space-x-2"
              >
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                
                <div className="flex space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium ${
                          currentPage === page
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </motion.div>
            )}
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No history found</h3>
            <p className="text-gray-600 mb-6">
              {searchTerm 
                ? 'No items match your search criteria'
                : 'You haven\'t created any crop plans or diagnoses yet'
              }
            </p>
            {!searchTerm && (
              <div className="flex justify-center space-x-4">
                <Link to="/crop-plan" className="btn-primary">
                  <Sprout className="w-4 h-4 mr-2" />
                  Create Crop Plan
                </Link>
                <Link to="/diagnosis" className="btn-outline">
                  <Camera className="w-4 h-4 mr-2" />
                  Upload Diagnosis
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
