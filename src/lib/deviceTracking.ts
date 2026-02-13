// src/lib/deviceTracking.ts
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { notifySuspiciousActivity, notifyAdmin } from '@/lib/adminNotifications';

// ============================================
// DEVICE & LOGIN HISTORY MODEL
// ============================================
const DeviceSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, required: true },
  deviceName: { type: String, default: 'Unknown Device' },
  deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet', 'unknown'], default: 'unknown' },
  browser: { type: String, default: 'Unknown' },
  browserVersion: { type: String },
  os: { type: String, default: 'Unknown' },
  osVersion: { type: String },
  ip: { type: String, required: true },
  location: {
    country: String,
    countryCode: String,
    city: String,
    region: String,
    timezone: String,
    lat: Number,
    lon: Number,
  },
  isTrusted: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false },
  firstSeen: { type: Date, default: Date.now },
  lastSeen: { type: Date, default: Date.now },
  loginCount: { type: Number, default: 1 },
}, { timestamps: true });

DeviceSchema.index({ userId: 1, deviceId: 1 }, { unique: true });

const LoginHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  deviceId: { type: String, required: true },
  ip: { type: String, required: true },
  location: {
    country: String,
    countryCode: String,
    city: String,
    region: String,
  },
  status: { type: String, enum: ['success', 'failed', 'blocked', 'suspicious'], required: true },
  failReason: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
}, { timestamps: true });

LoginHistorySchema.index({ userId: 1, timestamp: -1 });
LoginHistorySchema.index({ timestamp: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 }); // 90 days

const Device = mongoose.models.Device || mongoose.model('Device', DeviceSchema);
const LoginHistory = mongoose.models.LoginHistory || mongoose.model('LoginHistory', LoginHistorySchema);

// ============================================
// PARSE USER AGENT
// ============================================
export function parseUserAgent(userAgent: string): {
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown';
  deviceName: string;
} {
  const ua = userAgent.toLowerCase();
  
  // Detect Browser
  let browser = 'Unknown';
  let browserVersion = '';
  
  if (ua.includes('edg/')) {
    browser = 'Microsoft Edge';
    browserVersion = ua.match(/edg\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('chrome') && !ua.includes('chromium')) {
    browser = 'Google Chrome';
    browserVersion = ua.match(/chrome\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('firefox')) {
    browser = 'Mozilla Firefox';
    browserVersion = ua.match(/firefox\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('safari') && !ua.includes('chrome')) {
    browser = 'Apple Safari';
    browserVersion = ua.match(/version\/([\d.]+)/)?.[1] || '';
  } else if (ua.includes('opera') || ua.includes('opr')) {
    browser = 'Opera';
    browserVersion = ua.match(/(?:opera|opr)\/([\d.]+)/)?.[1] || '';
  }

  // Detect OS
  let os = 'Unknown';
  let osVersion = '';
  
  if (ua.includes('windows nt 10')) {
    os = 'Windows';
    osVersion = '10/11';
  } else if (ua.includes('windows nt 6.3')) {
    os = 'Windows';
    osVersion = '8.1';
  } else if (ua.includes('windows nt 6.2')) {
    os = 'Windows';
    osVersion = '8';
  } else if (ua.includes('windows nt 6.1')) {
    os = 'Windows';
    osVersion = '7';
  } else if (ua.includes('mac os x')) {
    os = 'macOS';
    osVersion = ua.match(/mac os x ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('android')) {
    os = 'Android';
    osVersion = ua.match(/android ([\d.]+)/)?.[1] || '';
  } else if (ua.includes('iphone') || ua.includes('ipad')) {
    os = 'iOS';
    osVersion = ua.match(/os ([\d_]+)/)?.[1]?.replace(/_/g, '.') || '';
  } else if (ua.includes('linux')) {
    os = 'Linux';
  }

  // Detect Device Type
  let deviceType: 'desktop' | 'mobile' | 'tablet' | 'unknown' = 'unknown';
  
  if (ua.includes('mobile') || ua.includes('android') && !ua.includes('tablet')) {
    deviceType = 'mobile';
  } else if (ua.includes('tablet') || ua.includes('ipad')) {
    deviceType = 'tablet';
  } else if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
    deviceType = 'desktop';
  }

  const deviceName = `${browser} on ${os}`;

  return { browser, browserVersion, os, osVersion, deviceType, deviceName };
}

// ============================================
// GENERATE DEVICE ID
// ============================================
export function generateDeviceId(ip: string, userAgent: string): string {
  const crypto = require('crypto');
  const data = `${ip}-${userAgent}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// ============================================
// GET IP LOCATION
// ============================================
export async function getIPLocation(ip: string): Promise<{
  country: string;
  countryCode: string;
  city: string;
  region: string;
  timezone: string;
  lat: number;
  lon: number;
} | null> {
  // Skip for localhost/private IPs
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'unknown') {
    return {
      country: 'Local',
      countryCode: 'LO',
      city: 'Localhost',
      region: 'Local',
      timezone: 'UTC',
      lat: 0,
      lon: 0,
    };
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,countryCode,region,city,timezone,lat,lon`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country,
        countryCode: data.countryCode,
        city: data.city,
        region: data.region,
        timezone: data.timezone,
        lat: data.lat,
        lon: data.lon,
      };
    }
  } catch (error) {
    console.error('[DeviceTracking] Failed to get IP location:', error);
  }
  
  return null;
}

// ============================================
// TRACK LOGIN
// ============================================
export async function trackLogin(
  userId: string,
  userEmail: string,
  userName: string,
  ip: string,
  userAgent: string,
  status: 'success' | 'failed' | 'blocked' = 'success',
  failReason?: string
): Promise<{ isNewDevice: boolean; isSuspicious: boolean; device: any }> {
  await connectDB();

  const deviceId = generateDeviceId(ip, userAgent);
  const parsed = parseUserAgent(userAgent);
  const location = await getIPLocation(ip);

  // Check if device exists
  let device = await Device.findOne({ userId, deviceId });
  let isNewDevice = false;
  let isSuspicious = false;

  if (!device) {
    // New device
    isNewDevice = true;
    device = await Device.create({
      userId,
      deviceId,
      deviceName: parsed.deviceName,
      deviceType: parsed.deviceType,
      browser: parsed.browser,
      browserVersion: parsed.browserVersion,
      os: parsed.os,
      osVersion: parsed.osVersion,
      ip,
      location,
    });

    // Notify admin about new device
    await notifyAdmin({
      type: 'suspicious_activity',
      userId,
      userEmail,
      userName,
      description: `New device login detected: ${parsed.deviceName}`,
      metadata: {
        device: parsed.deviceName,
        ip,
        location: location ? `${location.city}, ${location.country}` : 'Unknown',
      },
    });
  } else {
    // Update existing device
    const previousIP = device.ip;
    const previousCountry = device.location?.country;

    device.lastSeen = new Date();
    device.loginCount += 1;
    device.ip = ip;
    device.location = location;
    await device.save();

    // Check for suspicious activity (different country)
    if (location && previousCountry && location.country !== previousCountry) {
      isSuspicious = true;
      await notifySuspiciousActivity({
        userId,
        userEmail,
        userName,
        description: `Login from different country detected`,
        metadata: {
          previousCountry,
          newCountry: location.country,
          previousIP,
          newIP: ip,
          device: parsed.deviceName,
        },
      });
    }
  }

  // Check if device is blocked
  if (device.isBlocked) {
    status = 'blocked';
    failReason = 'Device is blocked';
  }

  // Record login history
  await LoginHistory.create({
    userId,
    deviceId,
    ip,
    location: location ? {
      country: location.country,
      countryCode: location.countryCode,
      city: location.city,
      region: location.region,
    } : undefined,
    status,
    failReason,
    userAgent,
  });

  return { isNewDevice, isSuspicious, device };
}

// ============================================
// GET USER DEVICES
// ============================================
export async function getUserDevices(userId: string): Promise<any[]> {
  await connectDB();
  return Device.find({ userId }).sort({ lastSeen: -1 });
}

// ============================================
// GET LOGIN HISTORY
// ============================================
export async function getLoginHistory(userId: string, limit = 20): Promise<any[]> {
  await connectDB();
  return LoginHistory.find({ userId }).sort({ timestamp: -1 }).limit(limit);
}

// ============================================
// TRUST / BLOCK DEVICE
// ============================================
export async function trustDevice(userId: string, deviceId: string): Promise<boolean> {
  await connectDB();
  const result = await Device.updateOne({ userId, deviceId }, { isTrusted: true, isBlocked: false });
  return result.modifiedCount > 0;
}

export async function blockDevice(userId: string, deviceId: string): Promise<boolean> {
  await connectDB();
  const result = await Device.updateOne({ userId, deviceId }, { isBlocked: true, isTrusted: false });
  return result.modifiedCount > 0;
}

export async function removeDevice(userId: string, deviceId: string): Promise<boolean> {
  await connectDB();
  const result = await Device.deleteOne({ userId, deviceId });
  return result.deletedCount > 0;
}
