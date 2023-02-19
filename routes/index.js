const express = require('express');
const database = require('../models/database')
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
    user: req.session.user
  });
});

router.get('/about', (req, res) => {
  res.render('about');
})

router.get('/contact', (req, res) => {
  res.render('contact');
})


module.exports = router;
