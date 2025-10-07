import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { 
  Shield, 
  LogOut, 
  MapPin, 
  Clock, 
  Smartphone, 
  Mail,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import axios from 'axios'

const Dashboard = ({ user, onLogout }) => {
  const [loginHistory, setLoginHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLoginHistory()
  }, [])

  const fetchLoginHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('http://localhost:3001/api/user/login-history', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLoginHistory(response.data.history || [])
    } catch (error) {
      console.error('Failed to fetch login history:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString()
  }

  const getStatusIcon = (status) => {
    return status === 'suspicious' ? (
      <AlertTriangle className="h-4 w-4 text-red-500" />
    ) : (
      <CheckCircle className="h-4 w-4 text-green-500" />
    )
  }

  const getStatusColor = (status) => {
    return status === 'suspicious' 
      ? 'bg-red-50 border-red-200 text-red-800'
      : 'bg-green-50 border-green-200 text-green-800'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Smart Auth Hub</h1>
            </div>
            <Button variant="outline" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-gray-600">
            Your secure authentication dashboard
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loginHistory.length}</div>
              <p className="text-xs text-muted-foreground">
                All time login attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safe Logins</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {loginHistory.filter(login => login.status === 'safe').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Verified secure logins
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspicious</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {loginHistory.filter(login => login.status === 'suspicious').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Flagged login attempts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Login History */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Login Activity</CardTitle>
            <CardDescription>
              Your recent authentication history with location tracking
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
              </div>
            ) : loginHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No login history available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {loginHistory.slice(0, 10).map((login, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${getStatusColor(login.status)}`}>
                        {getStatusIcon(login.status)}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">
                            {login.location?.city || 'Unknown'}, {login.location?.country || 'Unknown'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(login.time)}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {login.ip}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(login.status)}`}>
                      {login.status === 'suspicious' ? 'Suspicious' : 'Safe'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Security Tips */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Security Tips</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <Smartphone className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Keep Your Device Secure</h4>
                  <p className="text-sm text-gray-600">
                    Always use OTP from your registered device and keep it secure.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <h4 className="font-medium mb-1">Verify Login Locations</h4>
                  <p className="text-sm text-gray-600">
                    Check your login history regularly for any suspicious activity.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Dashboard
