import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import AuthForm from './components/AuthForm'
import OTPVerification from './components/OTPVerification'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [user, setUser] = useState(null)
  const [authStep, setAuthStep] = useState('loading') // 'loading', 'login', 'otp', 'dashboard'
  const [authData, setAuthData] = useState({ identifier: '', type: '' })

  useEffect(() => {
    // Check for existing token
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token with backend
      verifyToken(token)
    } else {
      // No token, set to login
      setAuthStep('login')
    }
  }, [])

  const verifyToken = async (token) => {
    try {
      console.log('Verifying token...')
      // Verify token with backend and get user data
      const response = await fetch('http://localhost:3001/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        console.log('Token verified, user data:', userData)
        setUser(userData.user)
        setAuthStep('dashboard')
      } else {
        console.log('Token verification failed:', response.status)
        throw new Error('Invalid token')
      }
    } catch (error) {
      console.log('Token verification error:', error)
      localStorage.removeItem('token')
      setUser(null)
      setAuthStep('login')
    }
  }

  const handleOTPSent = (identifier, type) => {
    setAuthData({ identifier, type })
    setAuthStep('otp')
  }

  const handleLoginSuccess = (userData) => {
    console.log('Login success - User data:', userData)
    setUser(userData)
    setAuthStep('dashboard')
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setAuthStep('login')
    setAuthData({ identifier: '', type: '' })
  }

  const handleBackToLogin = () => {
    setAuthStep('login')
    setAuthData({ identifier: '', type: '' })
  }

  // Show loading while checking token
  if (authStep === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              authStep === 'login' ? (
                <AuthForm onOTPSent={handleOTPSent} />
              ) : authStep === 'otp' ? (
                <OTPVerification
                  identifier={authData.identifier}
                  authType={authData.type}
                  onBack={handleBackToLogin}
                  onSuccess={handleLoginSuccess}
                />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            } 
          />
          <Route 
            path="/dashboard" 
            element={
              authStep === 'dashboard' ? (
                <Dashboard user={user} onLogout={handleLogout} />
              ) : (
                <Navigate to="/" replace />
              )
            } 
          />
          <Route 
            path="/admin" 
            element={(() => {
              console.log('Admin route check:', { 
                authStep, 
                user: user, 
                userRole: user?.role,
                hasToken: !!localStorage.getItem('token')
              })
              
              if (authStep === 'dashboard' && user && user.role === 'admin') {
                console.log('✅ Admin access granted')
                return <AdminDashboard user={user} onLogout={handleLogout} />
              } else if (authStep === 'dashboard' && user && user.role !== 'admin') {
                console.log('❌ User is not admin, redirecting to dashboard')
                return <Navigate to="/dashboard" replace />
              } else {
                console.log('❌ Not authenticated, redirecting to login')
                return <Navigate to="/" replace />
              }
            })()}
          />
        </Routes>
        
        <ToastContainer
          position="top-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </div>
    </Router>
  )
}

export default App
