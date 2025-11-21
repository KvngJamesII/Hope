const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Your API configuration
const API_URL = 'http://51.77.216.195/crapi/dgroup/viewstats';
const API_TOKEN = 'hYaAhYSOjTxCTlI=';
const API_USERNAME = 'thatspn'; // Your panel username

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

// Get OTPs endpoint - Support both GET and POST
app.get('/api/otps', async (req, res) => {
  await fetchOTPs(req, res);
});

app.post('/api/otps', async (req, res) => {
  await fetchOTPs(req, res);
});

async function fetchOTPs(req, res) {
  try {
    const { dt1, dt2, records, filternum, filtercli } = req.method === 'GET' ? req.query : req.body;

    // Build parameters
    const params = {
      token: API_TOKEN,
      records: records || '50'
    };

    if (dt1) params.dt1 = dt1;
    if (dt2) params.dt2 = dt2;
    if (filternum) params.filternum = filternum;
    if (filtercli) params.filtercli = filtercli;

    console.log('📡 Fetching OTPs with params:', params);
    console.log('🔗 API URL:', API_URL);
    console.log('🔑 Token:', API_TOKEN);

    // Try POST method first (as docs say it supports POST)
    const response = await axios({
      method: 'post',
      url: API_URL,
      data: new URLSearchParams(params).toString(),
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      }
    });

    console.log('✅ API Response Status:', response.status);
    console.log('📊 Full response data:', JSON.stringify(response.data, null, 2));
    
    // Check if response indicates an error
    if (response.data && response.data.status === 'error') {
      throw new Error(response.data.msg || 'API returned error status');
    }

    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('📊 First record sample:', JSON.stringify(response.data[0], null, 2));
    }

    res.json({
      success: true,
      data: response.data,
      count: Array.isArray(response.data) ? response.data.length : 0,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data)
    });

  } catch (error) {
    console.error('❌ Error fetching OTPs:', error.message);
    
    if (error.response) {
      console.error('Response error:', error.response.status, error.response.data);
      res.status(error.response.status).json({
        success: false,
        error: 'API Error',
        message: error.response.data || error.message,
        status: error.response.status
      });
    } else if (error.request) {
      console.error('No response received from API');
      res.status(503).json({
        success: false,
        error: 'No Response',
        message: 'Could not reach the OTP panel API'
      });
    } else {
      console.error('Request setup error:', error.message);
      res.status(500).json({
        success: false,
        error: 'Server Error',
        message: error.message
      });
    }
  }
}

// Test API connection endpoint - Try multiple methods
app.get('/api/test', async (req, res) => {
  console.log('🧪 Testing API connection with multiple methods...');
  const results = [];
  
  // Method 1: GET with token and username
  try {
    console.log('Method 1: GET with token and username');
    const response = await axios.get(`${API_URL}?token=${API_TOKEN}&username=${API_USERNAME}&records=1`, {
      timeout: 5000
    });
    results.push({ method: 'GET-token-username', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'GET-token-username', success: false, error: error.response?.data || error.message });
  }
  
  // Method 2: POST with token and username
  try {
    console.log('Method 2: POST with token and username');
    const response = await axios.post(API_URL, 
      new URLSearchParams({ token: API_TOKEN, username: API_USERNAME, records: '1' }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 5000
      }
    );
    results.push({ method: 'POST-token-username', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'POST-token-username', success: false, error: error.response?.data || error.message });
  }
  
  // Method 3: GET with user parameter
  try {
    console.log('Method 3: GET with user parameter');
    const response = await axios.get(`${API_URL}?token=${API_TOKEN}&user=${API_USERNAME}&records=1`, {
      timeout: 5000
    });
    results.push({ method: 'GET-token-user', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'GET-token-user', success: false, error: error.response?.data || error.message });
  }
  
  // Method 4: Basic Auth with username and token
  try {
    console.log('Method 4: Basic Auth');
    const response = await axios.get(`${API_URL}?records=1`, {
      auth: {
        username: API_USERNAME,
        password: API_TOKEN
      },
      timeout: 5000
    });
    results.push({ method: 'BasicAuth', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'BasicAuth', success: false, error: error.response?.data || error.message });
  }
  
  // Method 5: GET with authtype parameter
  try {
    console.log('Method 5: GET with authtype');
    const response = await axios.get(`${API_URL}?token=${API_TOKEN}&authtype=token&records=1`, {
      timeout: 5000
    });
    results.push({ method: 'GET-authtype', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'GET-authtype', success: false, error: error.response?.data || error.message });
  }
  
  // Method 6: GET with auth parameter
  try {
    console.log('Method 6: GET with auth parameter');
    const response = await axios.get(`${API_URL}?token=${API_TOKEN}&auth=api&records=1`, {
      timeout: 5000
    });
    results.push({ method: 'GET-auth-api', success: true, data: response.data });
  } catch (error) {
    results.push({ method: 'GET-auth-api', success: false, error: error.response?.data || error.message });
  }
  
  console.log('📊 Test results:', JSON.stringify(results, null, 2));
  
  res.json({
    message: 'Tested multiple authentication methods',
    results: results,
    timestamp: new Date().toISOString()
  });
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
