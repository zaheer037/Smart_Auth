const axios = require('axios');

/**
 * Get real public IP address for development testing
 * @returns {Promise<string>} Public IP address
 */
const getRealPublicIP = async () => {
  try {
    // Try multiple IP services for reliability
    const services = [
      'https://api.ipify.org?format=json',
      'https://ipapi.co/json/',
      'https://httpbin.org/ip'
    ];

    for (const service of services) {
      try {
        const response = await axios.get(service, { timeout: 3000 });
        
        if (service.includes('ipify')) {
          return response.data.ip;
        } else if (service.includes('ipapi')) {
          return response.data.ip;
        } else if (service.includes('httpbin')) {
          return response.data.origin;
        }
      } catch (error) {
        console.log(`Failed to get IP from ${service}:`, error.message);
        continue;
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting real IP:', error);
    return null;
  }
};

/**
 * Enhanced IP detection for development
 * @param {object} req - Express request object
 * @returns {Promise<string>} Best available IP address
 */
const getEnhancedClientIP = async (req) => {
  // Try to get IP from request headers first
  let ip = req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.headers['cf-connecting-ip'] ||
           req.headers['x-client-ip'] ||
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           req.ip;

  // Handle comma-separated IPs
  if (ip && ip.includes(',')) {
    ip = ip.split(',')[0].trim();
  }

  // Convert IPv6 localhost to IPv4
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    ip = '127.0.0.1';
  }

  // If it's localhost, try to get real public IP for better testing
  if (ip === '127.0.0.1' || ip === '::1' || !ip) {
    const realIP = await getRealPublicIP();
    if (realIP) {
      console.log(`🌐 Using real public IP for development: ${realIP}`);
      return realIP;
    }
    return 'dev-local';
  }

  return ip || '127.0.0.1';
};

/**
 * Get comprehensive location data with fallback
 * @param {string} ip - IP address
 * @returns {Promise<object>} Location information
 */
const getEnhancedLocation = async (ip) => {
  try {
    // If we have a real IP, try to get detailed location
    if (ip !== 'dev-local' && ip !== '127.0.0.1' && !ip.startsWith('192.168.')) {
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, { timeout: 5000 });
      
      if (response.data && response.data.city) {
        return {
          city: response.data.city || 'Unknown',
          country: response.data.country_name || 'Unknown',
          region: response.data.region || 'Unknown',
          timezone: response.data.timezone || 'Unknown',
          latitude: response.data.latitude || null,
          longitude: response.data.longitude || null,
          isp: response.data.org || 'Unknown',
          isReal: true
        };
      }
    }
  } catch (error) {
    console.log('Enhanced location lookup failed:', error.message);
  }

  // Fallback to geoip-lite or local
  const geoip = require('geoip-lite');
  
  if (ip === 'dev-local' || ip === '127.0.0.1' || ip.startsWith('192.168.')) {
    return {
      city: 'Development',
      country: 'Local',
      region: 'Local Environment',
      timezone: 'Local',
      latitude: null,
      longitude: null,
      isDevelopment: true
    };
  }

  const geo = geoip.lookup(ip);
  if (geo) {
    return {
      city: geo.city || 'Unknown',
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      timezone: geo.timezone || 'Unknown',
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null,
      isReal: true
    };
  }

  return {
    city: 'Unknown',
    country: 'Unknown',
    region: 'Unknown',
    timezone: 'Unknown',
    latitude: null,
    longitude: null
  };
};

module.exports = {
  getRealPublicIP,
  getEnhancedClientIP,
  getEnhancedLocation
};
