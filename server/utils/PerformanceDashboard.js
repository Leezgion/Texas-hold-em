class PerformanceDashboard {
  constructor() {
    this.responseTimes = [];
    this.maxSamples = 200;
  }

  recordResponseTime(responseTime) {
    this.responseTimes.push({
      responseTime,
      timestamp: Date.now(),
    });

    if (this.responseTimes.length > this.maxSamples) {
      this.responseTimes.shift();
    }
  }

  getStats() {
    if (!this.responseTimes.length) {
      return {
        sampleCount: 0,
        averageResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
      };
    }

    const values = this.responseTimes.map((entry) => entry.responseTime);
    const total = values.reduce((sum, value) => sum + value, 0);

    return {
      sampleCount: values.length,
      averageResponseTime: Number((total / values.length).toFixed(2)),
      maxResponseTime: Math.max(...values),
      minResponseTime: Math.min(...values),
    };
  }
}

function createPerformanceMiddleware(dashboard = performanceDashboard) {
  return (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      dashboard.recordResponseTime(Date.now() - start);
    });
    next();
  };
}

const performanceDashboard = new PerformanceDashboard();

module.exports = {
  PerformanceDashboard,
  performanceDashboard,
  createPerformanceMiddleware,
};
