import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Shield, ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'react-toastify'
import axios from 'axios'

const OTPVerification = ({ identifier, authType, onBack, onSuccess }) => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState(120) // 2 minutes
  const [resendCount, setResendCount] = useState(0)
  const inputRefs = useRef([])

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleOTPChange = (index, value) => {
    if (value.length > 1) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter complete OTP')
      return
    }

    setLoading(true)

    try {
      const payload = {
        [authType]: identifier,
        otp: otpString
      }

      const response = await axios.post('http://localhost:3001/api/auth/verify-otp', payload)
      
      if (response.data.success) {
        toast.success('Login successful!')
        localStorage.setItem('token', response.data.token)
        onSuccess(response.data.user)
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid OTP')
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (resendCount >= 3) {
      toast.error('Maximum resend attempts reached')
      return
    }

    setResendLoading(true)

    try {
      const payload = { [authType]: identifier }
      const response = await axios.post('http://localhost:3001/api/auth/send-otp', payload)
      
      if (response.data.success) {
        toast.success('OTP resent successfully!')
        setResendCount(prev => prev + 1)
        setTimeLeft(120)
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP')
    } finally {
      setResendLoading(false)
    }
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
          <CardDescription>
            Enter the 6-digit code sent to{' '}
            <span className="font-medium text-gray-900">
              {authType === 'email' ? identifier : `${identifier.slice(0, 3)}****${identifier.slice(-4)}`}
            </span>
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOTPChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-12 h-12 text-center text-lg font-semibold"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                Time remaining: <span className="font-medium text-red-600">{formatTime(timeLeft)}</span>
              </p>
              
              {timeLeft > 0 ? (
                <p className="text-xs text-gray-500">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendLoading || resendCount >= 3}
                    className="text-blue-600 hover:text-blue-800 font-medium disabled:text-gray-400"
                  >
                    {resendLoading ? (
                      <span className="flex items-center gap-1">
                        <RefreshCw className="h-3 w-3 animate-spin" />
                        Resending...
                      </span>
                    ) : (
                      `Resend (${3 - resendCount} left)`
                    )}
                  </button>
                </p>
              ) : (
                <p className="text-sm text-red-600 font-medium">
                  OTP expired. Please request a new one.
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Verifying...
                  </div>
                ) : (
                  'Verify & Login'
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export default OTPVerification
