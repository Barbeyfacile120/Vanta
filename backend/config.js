require('dotenv').config();

const config = {
  PORT: parseInt(process.env.PORT, 10) || 3000,
  SESSION_TIMEOUT_MINUTES: parseInt(process.env.SESSION_TIMEOUT_MINUTES, 10) || 10,
  CLEANUP_INTERVAL_MINUTES: parseInt(process.env.CLEANUP_INTERVAL_MINUTES, 10) || 5,
};

// Validate that all values are positive numbers
Object.entries(config).forEach(([key, value]) => {
  if (typeof value !== 'number' || isNaN(value) || value <= 0) {
    console.warn(`[Config] Warning: ${key} is invalid (${value}), using default fallback.`);
  }
});

module.exports = config;