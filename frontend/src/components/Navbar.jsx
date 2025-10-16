import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  LayoutDashboard,
  Sprout, 
  User, 
  LogOut, 
  Menu, 
  X,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      
      console.log('Starting logout process...');
      
      // Clear local storage immediately
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Call the logout function from AuthContext (this will also clear state)
      try {
        await logout();
      } catch (logoutError) {
        console.log('AuthContext logout failed, but local storage already cleared:', logoutError);
      }
      
      console.log('Logout completed successfully');
      toast.success('Logged out successfully');
      
      // Navigate to home page
      navigate('/');
      
      // Force a page reload to ensure all state is reset
      setTimeout(() => {
        window.location.reload();
      }, 100);
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Force logout by clearing local storage manually
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      toast.success('Logged out successfully');
      navigate('/');
      
      // Reload the page to ensure state is reset
      window.location.reload();
    } finally {
      setIsLoggingOut(false);
    }
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 bg-blue-600 shadow-sm border-b border-blue-700 z-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">
              CropGenesis
            </span>
          </Link>

          {/* Right Side - All Navigation Items */}
          <div className="hidden md:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                {/* Navigation Links */}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'bg-blue-500 text-white'
                          : 'text-white hover:text-blue-100 hover:bg-blue-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Get a Plan Button */}
                <Link
                  to="/crop-plan"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-400 transition-all duration-200 font-medium"
                >
                  Get a Plan
                </Link>
                
                {/* User Profile */}
                <div className="relative">
                  <button
                    onClick={() => {
                      console.log('Profile button clicked, current state:', isProfileOpen);
                      setIsProfileOpen(!isProfileOpen);
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-blue-500 transition-colors duration-200 cursor-pointer"
                    type="button"
                  >
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <span className="text-white font-medium">{user?.name}</span>
                    <ChevronDown className={`w-4 h-4 text-white transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {isProfileOpen && (
                    <>
                      {/* Backdrop to close dropdown when clicking outside */}
                      <div
                        className="fixed inset-0 z-40"
                        onClick={() => {
                          console.log('Backdrop clicked, closing dropdown');
                          setIsProfileOpen(false);
                        }}
                      />
                      
                      {/* Dropdown menu */}
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                      >
                        <Link
                          to="/profile"
                          className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                          onClick={() => {
                            console.log('Profile link clicked');
                            setIsProfileOpen(false);
                          }}
                        >
                          <User className="w-4 h-4" />
                          <span>Profile</span>
                        </Link>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            console.log('Logout button clicked');
                            handleLogout();
                          }}
                          disabled={isLoggingOut}
                          className="flex items-center space-x-2 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                          type="button"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                        </button>
                      </motion.div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Navigation Links for non-authenticated users */}
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors duration-200 ${
                        isActive(item.path)
                          ? 'bg-blue-500 text-white'
                          : 'text-white hover:text-blue-100 hover:bg-blue-500'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
                
                {/* Login and Get a Plan for non-authenticated users */}
                <Link
                  to="/login"
                  className="text-white hover:text-blue-100 transition-colors duration-200 font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/crop-plan"
                  className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-400 transition-all duration-200 font-medium"
                >
                  Get a Plan
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-blue-500 transition-colors duration-200"
          >
            {isMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-blue-700 py-4 bg-blue-600"
          >
            <div className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors duration-200 ${
                      isActive(item.path)
                        ? 'bg-blue-500 text-white'
                        : 'text-white hover:text-blue-100 hover:bg-blue-500'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
              
              {isAuthenticated ? (
                <div className="border-t border-blue-700 pt-2 mt-2 space-y-2">
                  <Link
                    to="/crop-plan"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition-colors duration-200"
                  >
                    <Sprout className="w-5 h-5" />
                    <span className="font-medium">Get a Plan</span>
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white hover:text-blue-100 hover:bg-blue-500 transition-colors duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Profile</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    disabled={isLoggingOut}
                    className="flex items-center space-x-3 w-full px-3 py-2 rounded-lg text-white hover:text-blue-100 hover:bg-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{isLoggingOut ? 'Logging out...' : 'Logout'}</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-blue-700 pt-2 mt-2 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg text-white hover:text-blue-100 hover:bg-blue-500 transition-colors duration-200"
                  >
                    <User className="w-5 h-5" />
                    <span className="font-medium">Login</span>
                  </Link>
                  <Link
                    to="/crop-plan"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center space-x-3 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-400 transition-colors duration-200"
                  >
                    <Sprout className="w-5 h-5" />
                    <span className="font-medium">Get a Plan</span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

    </motion.nav>
  );
};

export default Navbar;