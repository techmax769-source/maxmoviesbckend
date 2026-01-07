const express = require('express');
const router = express.Router();
const apiClient = require('../utils/apiClient');

// Middleware to log API requests
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Homepage endpoint
router.get('/homepage', async (req, res) => {
  try {
    const data = await apiClient.get('/homepage');
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      ...data
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Trending endpoint
router.get('/trending', async (req, res) => {
  try {
    const data = await apiClient.get('/trending');
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      ...data
    });
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Search endpoint
router.get('/search/:query', async (req, res) => {
  try {
    const { query } = req.params;
    const page = req.query.page || 1;
    
    if (!query) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'Query parameter is required'
      });
    }

    const data = await apiClient.get(`/search/${encodeURIComponent(query)}`, { page });
    
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      query: query,
      page: parseInt(page),
      ...data
    });
    
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Info endpoint
router.get('/info/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'ID parameter is required'
      });
    }

    const data = await apiClient.get(`/info/${id}`);
    
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      ...data
    });
    
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Sources endpoint
router.get('/sources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { season, episode } = req.query;
    
    if (!id) {
      return res.status(400).json({
        status: 400,
        success: false,
        message: 'ID parameter is required'
      });
    }

    let endpoint = `/sources/${id}`;
    const params = {};
    if (season) params.season = season;
    if (episode) params.episode = episode;

    const data = await apiClient.get(endpoint, params);
    
    res.json({
      status: 200,
      success: true,
      creator: "GiftedTech",
      ...data
    });
    
  } catch (error) {
    res.status(error.status || 500).json({
      status: error.status || 500,
      success: false,
      message: error.message || 'Internal server error'
    });
  }
});

// Health check endpoint
router.get('/health', async (req, res) => {
  try {
    const health = await apiClient.healthCheck();
    
    res.json({
      status: 200,
      success: true,
      message: 'MaxMovies Backend API',
      backend: {
        status: 'running',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        environment: process.env.NODE_ENV
      },
      movieApi: health,
      endpoints: {
        homepage: '/api/v2/homepage',
        trending: '/api/v2/trending',
        search: '/api/v2/search/{query}',
        info: '/api/v2/info/{id}',
        sources: '/api/v2/sources/{id}'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 500,
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

module.exports = router;
