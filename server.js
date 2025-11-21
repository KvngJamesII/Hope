const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Your API configuration
const API_URL = 'http://51.77.216.195/crapi/dgroup/viewstats';
const API_TOKEN = 'hYaAhYSOjTxCTlI=';

// Middleware - More permissive CORS
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    status: 'OTP Backend Server Running', 
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Get OTPs endpoint
app.get('/api/otps', async (req, res) => {
  try {
    const { dt1, dt2, records, filternum, filtercli } = req.query;

    // Build query parameters
    const params = {
      token: API_TOKEN,
      records: records || '50'
    };

    if (dt1) params.dt1 = dt1;
    if (dt2) params.dt2 = dt2;
    if (filternum) params.filternum = filternum;
    if (filtercli) params.filtercli = filtercli;

    console.log('📡 Fetching OTPs with params:', params);

    // Make request to the panel API
    const response = await axios.get(API_URL, { 
      params,
      timeout: 10000 // 10 second timeout
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Data received:', Array.isArray(response.data) ? response.data.length + ' records' : 'Object response');

    res.json({
      success: true,
      data: response.data,
      count: Array.isArray(response.data) ? response.data.length : 0
    });

  } catch (error) {
    console.error('❌ Error fetching OTPs:', error.message);
    
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Response error:', error.response.status, error.response.data);
      res.status(error.response.status).json({
        success: false,
        error: 'API Error',
        message: error.response.data || error.message,
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API');
      res.status(503).json({
        success: false,
        error: 'No Response',
        message: 'Could not reach the OTP panel API'
      });
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        message: error.message
      });
    }
  }
});

// Test API connection endpoint
app.get('/api/test', async (req, res) => {
  console.log('🧪 Testing API connection...');
  try {
    const response = await axios.get(API_URL, {
      params: { token: API_TOKEN, records: '1' },
      timeout: 5000
    });
    
    console.log('✅ Test successful:', response.status);
    res.json({
      success: true,
      message: 'API connection successful',
      status: response.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'API connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Start server
app.listen(PORT, HOST, () => {
  console.log('========================================');
  console.log('🚀 OTP Backend Server Started');
  console.log('========================================');
  console.log(`📍 Port: ${PORT}`);
  console.log(`🌐 Host: ${HOST}`);
  console.log(`🔗 Local: http://${HOST}:${PORT}`);
  console.log(`📡 API URL: ${API_URL}`);
  console.log('');
  console.log('📋 Available Endpoints:');
  console.log(`   GET  /              - Health check`);
  console.log(`   GET  /api/test      - Test API connection`);
  console.log(`   GET  /api/otps      - Fetch OTPs`);
  console.log('========================================');
  
  if (process.env.RAILWAY_ENVIRONMENT) {
    console.log('🚂 Running on Railway!');
  }
});
