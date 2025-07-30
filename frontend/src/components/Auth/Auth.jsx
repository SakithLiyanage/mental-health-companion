import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [touchedFields, setTouchedFields] = useState({});
  const { register } = useAuth(); // Removed unused 'login' import

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    confirmPassword: ''
  });

  // Validation rules
  const validateField = (name, value, allFormData = formData) => {
    const errors = {};

    switch (name) {
      case 'firstName':
        if (!value.trim()) {
          errors.firstName = 'First name is required';
        } else if (value.trim().length < 2) {
          errors.firstName = 'First name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.firstName = 'First name can only contain letters and spaces';
        }
        break;

      case 'lastName':
        if (!value.trim()) {
          errors.lastName = 'Last name is required';
        } else if (value.trim().length < 2) {
          errors.lastName = 'Last name must be at least 2 characters';
        } else if (!/^[a-zA-Z\s]+$/.test(value.trim())) {
          errors.lastName = 'Last name can only contain letters and spaces';
        }
        break;

      case 'username':
        if (!value.trim()) {
          errors.username = 'Username is required';
        } else if (value.trim().length < 3) {
          errors.username = 'Username must be at least 3 characters';
        } else if (value.trim().length > 20) {
          errors.username = 'Username must not exceed 20 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(value.trim())) {
          errors.username = 'Username can only contain letters, numbers, and underscores';
        } else if (/^\d/.test(value.trim())) {
          errors.username = 'Username cannot start with a number';
        }
        break;

      case 'email':
        if (!value.trim()) {
          errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          errors.email = 'Please enter a valid email address';
        }
        break;

      case 'password':
        if (!value) {
          errors.password = 'Password is required';
        } else if (value.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else if (value.length > 128) {
          errors.password = 'Password must not exceed 128 characters';
        } else if (!/(?=.*[a-z])/.test(value)) {
          errors.password = 'Password must contain at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(value)) {
          errors.password = 'Password must contain at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(value)) {
          errors.password = 'Password must contain at least one number';
        }
        break;

      case 'confirmPassword':
        if (!value) {
          errors.confirmPassword = 'Please confirm your password';
        } else if (value !== allFormData.password) {
          errors.confirmPassword = 'Passwords do not match';
        }
        break;

      default:
        break;
    }

    return errors;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData({
      ...formData,
      [name]: value
    });

    // Mark field as touched
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field in real-time if it's been touched
    if (touchedFields[name] || value.length > 0) {
      const fieldError = validateField(name, value, { ...formData, [name]: value });
      setFieldErrors(prev => ({
        ...prev,
        ...fieldError,
        // Clear error if field is now valid
        ...(Object.keys(fieldError).length === 0 ? { [name]: undefined } : {})
      }));
    }

    setError(''); // Clear general error when user starts typing
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    
    // Mark field as touched on blur
    setTouchedFields(prev => ({
      ...prev,
      [name]: true
    }));

    // Validate field on blur
    const fieldError = validateField(name, value);
    setFieldErrors(prev => ({
      ...prev,
      ...fieldError,
      // Clear error if field is now valid
      ...(Object.keys(fieldError).length === 0 ? { [name]: undefined } : {})
    }));
  };

  const validateForm = () => {
    // Validate all fields if in signup mode
    const fieldsToValidate = isLogin 
      ? ['email', 'password'] 
      : ['firstName', 'lastName', 'username', 'email', 'password', 'confirmPassword'];

    let allErrors = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      const fieldError = validateField(field, formData[field]);
      allErrors = { ...allErrors, ...fieldError };
      if (Object.keys(fieldError).length > 0) {
        isValid = false;
      }
    });

    // Mark all fields as touched to show errors
    const allTouched = {};
    fieldsToValidate.forEach(field => {
      allTouched[field] = true;
    });
    setTouchedFields(allTouched);
    setFieldErrors(allErrors);

    if (!isValid) {
      setError('Please fix the errors above to continue');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        console.log('Attempting login with:', formData.email);
        
        // EMERGENCY: Bypass AuthContext and make direct API call
        const emergencyLoginUrl = 'https://mental-health-companion-nine.vercel.app/api/auth/login';
        console.log('🆘 EMERGENCY LOGIN - Direct API call to:', emergencyLoginUrl);
        
        const response = await fetch(emergencyLoginUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email: formData.email, 
            password: formData.password 
          }),
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: 'Login failed' }));
          throw new Error(errorData.message || 'Login failed');
        }
        
        const { token } = await response.json(); // Removed unused 'user' variable
        
        // Store token and redirect manually
        localStorage.setItem('token', token);
        console.log('Emergency login successful, redirecting...');
        window.location.href = '/dashboard';
        
      } else {
        console.log('Attempting registration with:', formData);
        await register(formData);
      }
    } catch (error) {
      console.error('Auth error:', error);
      
      // Handle specific field errors from backend
      if (error.response?.data?.field) {
        const fieldError = error.response.data.field;
        setFieldErrors(prev => ({
          ...prev,
          [fieldError]: error.response.data.message
        }));
        setTouchedFields(prev => ({
          ...prev,
          [fieldError]: true
        }));
      } else if (error.response?.data?.errors) {
        // Handle multiple validation errors
        setError('Please fix the following issues: ' + error.response.data.errors.join(', '));
      } else {
        // Handle general errors
        setError(error.response?.data?.message || error.message || 'Authentication failed');
      }
    } finally {
      setLoading(false);
    }
  };



  const features = [
    {
      icon: '🤖',
      title: 'AI Companion',
      description: 'Chat with Luna, your empathetic AI friend who understands and supports you 24/7'
    },
    {
      icon: '📖',
      title: 'Digital Journal',
      description: 'Express your thoughts and feelings in a safe, private space with mood tracking'
    },
    {
      icon: '💙',
      title: 'Emotion Analytics',
      description: 'Visualize your emotional patterns and discover insights about your mental health'
    },
    {
      icon: '🎯',
      title: 'Progress Tracking',
      description: 'Monitor your wellbeing journey with detailed statistics and achievements'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah M.',
      text: 'This app has been a game-changer for my mental health. Luna always knows what to say.',
      rating: 5
    },
    {
      name: 'Alex K.',
      text: 'The journaling feature helps me process my emotions better than I ever could before.',
      rating: 5
    },
    {
      name: 'Jordan P.',
      text: 'I love being able to track my mood patterns and see my progress over time.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-blue-50 to-purple-100 flex">
      {/* Left Side - Features & Testimonials */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 flex-col justify-center p-12 bg-gradient-to-br from-primary-600 via-purple-600 to-pink-600 text-white relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 bg-white rounded-full"></div>
          <div className="absolute bottom-32 right-16 w-32 h-32 bg-white rounded-full"></div>
          <div className="absolute top-1/2 left-10 w-24 h-24 bg-white rounded-full"></div>
        </div>

        <div className="relative z-10">
          <div className="mb-12">
            <h1 className="text-5xl font-display font-bold mb-6">
              Welcome to Your Mental Health Journey 🌱
            </h1>
            <p className="text-xl text-primary-100 leading-relaxed">
              Join thousands of people who are taking control of their mental wellbeing with our comprehensive support platform.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-primary-100 text-sm">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="space-y-4">
            <h3 className="text-2xl font-display font-bold mb-4">What our users say</h3>
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="flex items-center mb-2">
                  <div className="flex text-yellow-400 mr-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <span key={i}>⭐</span>
                    ))}
                  </div>
                  <span className="font-medium">{testimonial.name}</span>
                </div>
                <p className="text-primary-100 text-sm">"{testimonial.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-3xl font-display font-bold text-primary-600 mb-2">
              Mental Health Companion
            </h1>
            <p className="text-calm-600">Your journey to better mental health starts here</p>
          </div>

          {/* Auth Card */}
          <div className="bg-white/95 backdrop-blur-lg rounded-3xl shadow-2xl border border-calm-200/50 p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                <span className="text-white text-2xl">🧠</span>
              </div>
              <h2 className="text-3xl font-display font-bold text-calm-900 mb-2">
                {isLogin ? 'Welcome Back!' : 'Join Our Community'}
              </h2>
              <p className="text-calm-600">
                {isLogin 
                  ? 'Sign in to continue your mental health journey'
                  : 'Create your account and start your wellness journey'
                }
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6 text-sm">
                <div className="flex items-center">
                  <span className="mr-2">⚠️</span>
                  {error}
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {!isLogin && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                        fieldErrors.firstName && touchedFields.firstName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-calm-200 focus:border-primary-500'
                      }`}
                      placeholder="John"
                      required={!isLogin}
                    />
                    {fieldErrors.firstName && touchedFields.firstName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-calm-700 mb-2">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                        fieldErrors.lastName && touchedFields.lastName
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-calm-200 focus:border-primary-500'
                      }`}
                      placeholder="Doe"
                      required={!isLogin}
                    />
                    {fieldErrors.lastName && touchedFields.lastName && (
                      <p className="mt-1 text-sm text-red-600 flex items-center">
                        <span className="mr-1">⚠️</span>
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-calm-700 mb-2">
                    Username *
                  </label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                      fieldErrors.username && touchedFields.username
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-calm-200 focus:border-primary-500'
                    }`}
                    placeholder="johndoe"
                    required={!isLogin}
                  />
                  {fieldErrors.username && touchedFields.username && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.username}
                    </p>
                  )}
                  {!fieldErrors.username && formData.username && touchedFields.username && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Username looks good!
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  className={`w-full px-4 py-3 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                    fieldErrors.email && touchedFields.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                      : 'border-calm-200 focus:border-primary-500'
                  }`}
                  placeholder="john@example.com"
                  required
                />
                {fieldErrors.email && touchedFields.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-calm-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`w-full px-4 py-3 pr-12 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                      fieldErrors.password && touchedFields.password
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                        : 'border-calm-200 focus:border-primary-500'
                    }`}
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-calm-500 hover:text-calm-700"
                  >
                    {showPassword ? '👁️' : '👁️‍🗨️'}
                  </button>
                </div>
                {fieldErrors.password && touchedFields.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <span className="mr-1">⚠️</span>
                    {fieldErrors.password}
                  </p>
                )}
                {!isLogin && !fieldErrors.password && formData.password && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-xs">
                      <span className={`mr-2 ${formData.password.length >= 6 ? 'text-green-600' : 'text-gray-400'}`}>
                        {formData.password.length >= 6 ? '✅' : '⭕'}
                      </span>
                      <span className={formData.password.length >= 6 ? 'text-green-600' : 'text-gray-500'}>
                        At least 6 characters
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={`mr-2 ${/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        {/(?=.*[a-z])/.test(formData.password) ? '✅' : '⭕'}
                      </span>
                      <span className={/(?=.*[a-z])/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        One lowercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={`mr-2 ${/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        {/(?=.*[A-Z])/.test(formData.password) ? '✅' : '⭕'}
                      </span>
                      <span className={/(?=.*[A-Z])/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        One uppercase letter
                      </span>
                    </div>
                    <div className="flex items-center text-xs">
                      <span className={`mr-2 ${/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-400'}`}>
                        {/(?=.*\d)/.test(formData.password) ? '✅' : '⭕'}
                      </span>
                      <span className={/(?=.*\d)/.test(formData.password) ? 'text-green-600' : 'text-gray-500'}>
                        One number
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-calm-700 mb-2">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className={`w-full px-4 py-3 pr-12 border rounded-2xl focus:ring-2 focus:ring-primary-500 text-calm-900 placeholder-calm-500 bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 ${
                        fieldErrors.confirmPassword && touchedFields.confirmPassword
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200'
                          : 'border-calm-200 focus:border-primary-500'
                      }`}
                      placeholder="••••••••"
                      required={!isLogin}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-calm-500 hover:text-calm-700"
                    >
                      {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && touchedFields.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <span className="mr-1">⚠️</span>
                      {fieldErrors.confirmPassword}
                    </p>
                  )}
                  {!fieldErrors.confirmPassword && formData.confirmPassword && formData.password && formData.confirmPassword === formData.password && (
                    <p className="mt-1 text-sm text-green-600 flex items-center">
                      <span className="mr-1">✅</span>
                      Passwords match!
                    </p>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-primary-500 to-purple-500 text-white font-medium rounded-2xl hover:from-primary-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-[1.02] shadow-lg"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    {isLogin ? 'Signing In...' : 'Creating Account...'}
                  </div>
                ) : (
                  isLogin ? 'Sign In 🚀' : 'Create Account ✨'
                )}
              </button>
            </form>

            {/* Switch Mode */}
            <div className="mt-8 text-center">
              <p className="text-calm-600">
                {isLogin ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => {
                    setIsLogin(!isLogin);
                    setError('');
                    setFieldErrors({});
                    setTouchedFields({});
                    setFormData({
                      email: '',
                      password: '',
                      username: '',
                      firstName: '',
                      lastName: '',
                      confirmPassword: ''
                    });
                  }}
                  className="ml-2 font-medium text-primary-600 hover:text-primary-700 transition-colors duration-200"
                >
                  {isLogin ? 'Sign up here' : 'Sign in here'}
                </button>
              </p>
            </div>

            {/* Privacy Notice */}
            <div className="mt-6 text-center">
              <p className="text-xs text-calm-500">
                By continuing, you agree to our privacy-first approach to mental health support. 
                Your data is encrypted and never shared.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
