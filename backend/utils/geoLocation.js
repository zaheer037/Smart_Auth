const geoip = require('geoip-lite');

/**
 * Get location information from IP address
 * @param {string} ip - IP address
 * @returns {object} Location information
 */
const getLocationFromIP = (ip) => {
  try {
    // Handle localhost and private IPs
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'dev-local' || 
        ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
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
    
    if (!geo) {
      return {
        city: 'Unknown',
        country: 'Unknown',
        region: 'Unknown',
        timezone: 'Unknown',
        latitude: null,
        longitude: null
      };
    }

    return {
      city: geo.city || 'Unknown',
      country: geo.country || 'Unknown',
      region: geo.region || 'Unknown',
      timezone: geo.timezone || 'Unknown',
      latitude: geo.ll ? geo.ll[0] : null,
      longitude: geo.ll ? geo.ll[1] : null
    };
  } catch (error) {
    console.error('Error getting location from IP:', error);
    return {
      city: 'Unknown',
      country: 'Unknown',
      region: 'Unknown',
      timezone: 'Unknown',
      latitude: null,
      longitude: null
    };
  }
};

/**
 * Calculate distance between two coordinates in kilometers
 * @param {number} lat1 - Latitude 1
 * @param {number} lon1 - Longitude 1
 * @param {number} lat2 - Latitude 2
 * @param {number} lon2 - Longitude 2
 * @returns {number} Distance in kilometers
 */
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

/**
 * Check if location change is suspicious
 * @param {object} currentLocation - Current login location
 * @param {object} lastLocation - Last login location
 * @param {number} timeDiff - Time difference in hours
 * @returns {object} Suspicion analysis
 */
const analyzLocationChange = (currentLocation, lastLocation, timeDiff) => {
  if (!lastLocation || !currentLocation) {
    return { suspicious: false, reason: 'No previous location data' };
  }

  // If same country, likely safe
  if (currentLocation.country === lastLocation.country) {
    return { suspicious: false, reason: 'Same country' };
  }

  // Calculate distance if coordinates available
  if (currentLocation.latitude && lastLocation.latitude) {
    const distance = calculateDistance(
      lastLocation.latitude, lastLocation.longitude,
      currentLocation.latitude, currentLocation.longitude
    );

    if (distance) {
      // Impossible travel speed check (assuming max 1000 km/h for commercial flights)
      const maxPossibleDistance = timeDiff * 1000;
      
      if (distance > maxPossibleDistance && timeDiff < 12) {
        return {
          suspicious: true,
          reason: `Impossible travel: ${distance}km in ${timeDiff.toFixed(1)} hours`,
          distance,
          timeDiff
        };
      }
    }
  }

  // Different country within short time frame
  if (timeDiff < 6 && currentLocation.country !== lastLocation.country) {
    return {
      suspicious: true,
      reason: `Country change within ${timeDiff.toFixed(1)} hours`,
      timeDiff
    };
  }

  return { suspicious: false, reason: 'Normal location change' };
};

module.exports = {
  getLocationFromIP,
  calculateDistance,
  analyzLocationChange
};
