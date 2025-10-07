import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Mail, Phone, Shield, ArrowRight } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'

const AuthForm = ({ onOTPSent }) => {
  const [formData, setFormData] = useState({
    email: '',
    phone: ''
  })
  const [authType, setAuthType] = useState('email') // 'email' or 'phone'
  const [loading, setLoading] = useState(false)

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const payload = authType === 'email' 
        ? { email: formData.email }
        : { phone: formData.phone }

      const response = await axios.post('http://localhost:3001/api/auth/send-otp', payload)
      
      if (response.data.success) {
        toast.success('OTP sent successfully!')
        onOTPSent(authType === 'email' ? formData.email : formData.phone, authType)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Shield className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Smart Auth Hub</CardTitle>
          <CardDescription>
            Secure passwordless authentication with OTP
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="mb-6">
            <div className="flex rounded-lg bg-gray-100 p-1">
              <button
                type="button"
                onClick={() => setAuthType('email')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                  authType === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="h-4 w-4" />
                Email
              </button>
              <button
                type="button"
                onClick={() => setAuthType('phone')}
                className={`flex-1 flex items-center justify-center gap-2 rounded-md py-2 px-3 text-sm font-medium transition-colors ${
                  authType === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {authType === 'email' ? (
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            ) : (
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Sending OTP...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Send OTP
                  <ArrowRight className="h-4 w-4" />
                </div>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>We'll send you a secure 6-digit code</p>
            <p className="mt-1">No passwords required! 🔐</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AuthForm
