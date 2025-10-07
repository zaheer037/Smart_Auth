import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { 
  Shield, 
  LogOut, 
  Users, 
  MapPin, 
  Clock, 
  Search,
  AlertTriangle,
  CheckCircle,
  Filter
} from 'lucide-react'
import axios from 'axios'

const AdminDashboard = ({ user, onLogout }) => {
  const [users, setUsers] = useState([])
  const [allLogins, setAllLogins] = useState([])
  const [filteredLogins, setFilteredLogins] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    fetchAdminData()
  }, [])

  useEffect(() => {
    filterLogins()
  }, [searchTerm, statusFilter, allLogins])

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token')
      const [usersResponse, loginsResponse] = await Promise.all([
        axios.get('http://localhost:3001/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('http://localhost:3001/api/admin/logins', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ])
      
      setUsers(usersResponse.data.users || [])
      setAllLogins(loginsResponse.data.logins || [])
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterLogins = () => {
    let filtered = allLogins

    if (searchTerm) {
      filtered = filtered.filter(login => 
        login.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.user?.phone?.includes(searchTerm) ||
        login.location?.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.location?.country?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        login.ip?.includes(searchTerm)
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(login => login.status === statusFilter)
    }

    setFilteredLogins(filtered)
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

  const suspiciousLogins = allLogins.filter(login => login.status === 'suspicious').length
  const safeLogins = allLogins.filter(login => login.status === 'safe').length

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100">
                <Shield className="h-5 w-5 text-purple-600" />
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
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
            Admin Overview 🛡️
          </h2>
          <p className="text-gray-600">
            Monitor user authentication and security across the platform
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Logins</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allLogins.length}</div>
              <p className="text-xs text-muted-foreground">
                All login attempts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Safe Logins</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{safeLogins}</div>
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
              <div className="text-2xl font-bold text-red-600">{suspiciousLogins}</div>
              <p className="text-xs text-muted-foreground">
                Flagged attempts
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Login Activity Monitor</CardTitle>
            <CardDescription>
              Search and filter user login activities across the platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by email, phone, location, or IP..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Status</option>
                  <option value="safe">Safe Only</option>
                  <option value="suspicious">Suspicious Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Login History Table */}
        <Card>
          <CardHeader>
            <CardTitle>
              Login History ({filteredLogins.length} results)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
              </div>
            ) : filteredLogins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No login records found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogins.map((login, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-lg border bg-white hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-2 rounded-full ${getStatusColor(login.status)}`}>
                        {getStatusIcon(login.status)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">
                            {login.user?.email || login.user?.phone || 'Unknown User'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {login.location?.city || 'Unknown'}, {login.location?.country || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(login.time)}
                          </div>
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {login.ip}
                          </span>
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
      </div>
    </div>
  )
}

export default AdminDashboard
