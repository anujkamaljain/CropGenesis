import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Image as ImageIcon,
  HelpCircle,
  MessageCircle,
  Building2,
  FileImage
} from 'lucide-react';

const Dashboard = () => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Main Content */}
      <div className="w-full">
        {/* Dashboard Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white min-h-screen p-8 flex flex-col items-center justify-center"
        >
          {/* Dashboard Tag */}
          <div className="mb-6 text-center">
            <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
              Dashboard
            </span>
          </div>

          {/* Title and Subtitle */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Crop Analysis Center
            </h1>
            <p className="text-gray-600 text-lg">
              Manage your crops, analyze using images and videos in one place
            </p>
          </div>

          {/* Plant Village Model Button */}
          <div className="mb-8 text-center">
            <button className="flex items-center space-x-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 mx-auto">
              <Building2 className="w-4 h-4" />
              <span className="font-medium">Plant Village Model</span>
            </button>
          </div>

          {/* Image Manager Section */}
          <div className="mb-6 text-center w-full max-w-2xl">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <h2 className="text-xl font-bold text-gray-800">Image Manager</h2>
              <HelpCircle className="w-5 h-5 text-gray-400 cursor-pointer hover:text-gray-600" />
            </div>

            {/* Upload Area */}
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors duration-200 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              {/* Upload Icon */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileImage className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              {/* Upload Text */}
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Upload Image or Video
              </h3>
              <p className="text-gray-600 mb-6">
                Drag and drop your image or video file here, or click to browse your files
              </p>

              {/* File Input */}
              <div className="mb-4">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center space-x-2 bg-white border border-blue-300 text-blue-600 px-6 py-2 rounded-lg hover:bg-blue-50 transition-colors duration-200 cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  <span className="font-medium">Choose File</span>
                </label>
              </div>

              {/* File Size Info */}
              <p className="text-sm text-gray-500">
                Maximum file size: 5MB
              </p>

              {/* Selected File Display */}
              {selectedFile && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    <span className="text-green-800 font-medium">{selectedFile.name}</span>
                    <span className="text-green-600 text-sm">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chat Button */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors duration-200 flex items-center justify-center"
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default Dashboard;