const express = require('express');
const axios = require('axios');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Judge0 API configuration
const JUDGE0_API_URL = process.env.JUDGE0_API_URL || 'https://judge0-ce.p.rapidapi.com';
const JUDGE0_API_KEY = process.env.JUDGE0_API_KEY;
const JUDGE0_API_HOST = process.env.JUDGE0_API_HOST || 'judge0-ce.p.rapidapi.com';

console.log('Judge0 Config:', {
  url: JUDGE0_API_URL,
  key: JUDGE0_API_KEY ? '***' + JUDGE0_API_KEY.slice(-4) : 'NOT SET',
  host: JUDGE0_API_HOST
});

// Alternative: Use Judge0 Extra CE (free tier)
const JUDGE0_EXTRA_API_URL = 'https://api.judge0.com';
const USE_JUDGE0_EXTRA = !JUDGE0_API_KEY || JUDGE0_API_KEY.includes('YOUR_JUDGE0_API_KEY');

if (USE_JUDGE0_EXTRA) {
  console.log('Using Judge0 Extra CE (free tier) as fallback');
}

// Execute code using Judge0 API
router.post('/execute', auth, async (req, res) => {
  try {
    const { source_code, language_id, stdin } = req.body;

    console.log('Execute request received:', { source_code: source_code?.substring(0, 50) + '...', language_id, stdin });

    if (!source_code) {
      return res.status(400).json({ message: 'Source code is required' });
    }

    if (!JUDGE0_API_KEY) {
      console.error('JUDGE0_API_KEY not configured');
      return res.status(500).json({ message: 'Judge0 API key not configured' });
    }

    // Prepare submission data
    const submissionData = {
      source_code: source_code,
      language_id: language_id || 71, // Default to Python
      stdin: stdin || '',
      expected_output: null,
      stdout: null,
      stderr: null,
      compile_output: null,
      message: null,
      time: null,
      memory: null,
      status: null
    };

    console.log('Submitting code to Judge0...');
    console.log('Using Judge0 Extra CE:', USE_JUDGE0_EXTRA);

    let submitResponse;

    if (USE_JUDGE0_EXTRA) {
      // Use Judge0 Extra CE (free tier)
      submitResponse = await axios.post(`${JUDGE0_EXTRA_API_URL}/submissions`, submissionData, {
        headers: {
          'content-type': 'application/json'
        },
        params: {
          base64_encoded: 'false',
          wait: 'false'
        }
      });
    } else {
      // Use RapidAPI Judge0 CE
      submitResponse = await axios.post(`${JUDGE0_API_URL}/submissions`, submissionData, {
        headers: {
          'content-type': 'application/json',
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': JUDGE0_API_HOST
        },
        params: {
          base64_encoded: 'false',
          wait: 'false'
        }
      });
    }

    console.log('Submit response:', submitResponse.data);

    const token = submitResponse.data.token;

    if (!token) {
      return res.status(500).json({ message: 'Failed to submit code' });
    }

    // Wait a bit for processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the result
    let resultResponse;
    if (USE_JUDGE0_EXTRA) {
      resultResponse = await axios.get(`${JUDGE0_EXTRA_API_URL}/submissions/${token}`, {
        params: {
          base64_encoded: 'false'
        }
      });
    } else {
      resultResponse = await axios.get(`${JUDGE0_API_URL}/submissions/${token}`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': JUDGE0_API_HOST
        },
        params: {
          base64_encoded: 'false'
        }
      });
    }

    const result = resultResponse.data;

    // Return the execution result
    res.json({
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      message: result.message || '',
      status: result.status,
      time: result.time,
      memory: result.memory
    });

  } catch (error) {
    console.error('Code execution error:', error.response?.data || error.message);
    console.error('Full error object:', error);
    res.status(500).json({
      message: 'Failed to execute code',
      error: error.response?.data?.message || error.message
    });
  }
});

// Get supported languages
router.get('/languages', auth, async (req, res) => {
  try {
    let response;
    if (USE_JUDGE0_EXTRA) {
      response = await axios.get(`${JUDGE0_EXTRA_API_URL}/languages`);
    } else {
      response = await axios.get(`${JUDGE0_API_URL}/languages`, {
        headers: {
          'X-RapidAPI-Key': JUDGE0_API_KEY,
          'X-RapidAPI-Host': JUDGE0_API_HOST
        }
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Languages fetch error:', error);
    res.status(500).json({ message: 'Failed to fetch languages' });
  }
});

module.exports = router;