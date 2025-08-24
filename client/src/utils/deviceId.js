// 设备ID管理工具
class DeviceIdManager {
  constructor() {
    this.STORAGE_KEY = 'texas-holdem-device-id';
  }

  // 生成唯一设备ID
  generateDeviceId() {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const browserInfo = this.getBrowserFingerprint();
    return `device_${timestamp}_${randomStr}_${browserInfo}`;
  }

  // 获取浏览器指纹（简化版）
  getBrowserFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [navigator.userAgent, navigator.language, screen.width + 'x' + screen.height, new Date().getTimezoneOffset(), canvas.toDataURL()].join('|');

    // 简单哈希
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36).substring(0, 6);
  }

  // 获取或创建设备ID
  getDeviceId() {
    let deviceId = localStorage.getItem(this.STORAGE_KEY);

    if (!deviceId) {
      deviceId = this.generateDeviceId();
      localStorage.setItem(this.STORAGE_KEY, deviceId);
      console.log('生成新的设备ID:', deviceId);
    } else {
      console.log('使用已存在的设备ID:', deviceId);
    }

    return deviceId;
  }

  // 清除设备ID（调试用）
  clearDeviceId() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('设备ID已清除');
  }

  // 验证设备ID格式
  isValidDeviceId(deviceId) {
    return deviceId && typeof deviceId === 'string' && deviceId.startsWith('device_');
  }
}

export default new DeviceIdManager();
