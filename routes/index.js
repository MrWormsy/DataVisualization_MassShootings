let express = require('express');
let router = express.Router();

/* GET home page. */
router.get('/mass_shooting_us', function(req, res, next) {
  res.render('index', {});
});

module.exports = router;
