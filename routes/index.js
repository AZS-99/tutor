const express = require('express');
const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', {
     sess: req.session
  });
});


router.get('/success', (req, res) => {
    res.send("SUCCESS");
});

router.get('/failure', (req, res) => {
    res.send("Failure");
})

module.exports = router;
