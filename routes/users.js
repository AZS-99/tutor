const express = require('express');
const database = require('../models/database')
const {verify_user, ensure_log_in} = require("../middlewares/access");

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});

router.get('/book', (req, res) => {
    res.render("booking")
})


router.get('/book_trial', ensure_log_in, (req, res) => {
    res.render("book_trial")
})

router.post('/book_trial',  async (req, res) => {
  try {
      const year = parseInt(req.body.date.substring(0, 4))
      const month = parseInt(req.body.date.substring(5, 7))
      const day = parseInt(req.body.date.substring(8))
      const half_hr = parseInt(req.body.time.substring(0, 2)) * 2 + (parseInt(req.body.time.substring(3)) === 30? 1 : 0);
      const slots_count = 2

      const unavailable_slots_jsn = await database.get_unavailable_slots(year, month, day, 2);
      const unavailable_slots = unavailable_slots_jsn.map(jsn => jsn.half_hr);

      for (let i = 0; i < slots_count; ++i) {
          if (unavailable_slots.includes(half_hr + i)){
              res.send("Unavailable");
              return;
          }
      }

      await database.set_appointment(year, month, day, half_hr, slots_count, 1);
      res.send("Success, you'll be contacted within 24 hrs to confirm your session!")

  }catch (e) {
      console.log(e.message)
      res.send(e)
  }
})


router.get('/sign_up', (req, res) => {
    res.render('sign_up', {
        title: "Sign up with Sigma!"
    })
})


router.post('/sign_up', async (req, res) => {
    try {
        const user = await database.add_user(req.body);
        if (req.body.position === "student") await database.add_student(user.id, req.body.grade)
        else if(req.body.position === "instructor") await database.add_instructor(user.id, 30)
        delete user.password;
        req.session.user = user;
        res.redirect('/');
    } catch (e) {
        console.log("ERROR!!!" + e)
        res.send(e);
    }
});


router.get('/log_in',  (req, res) => {
    res.render('log_in', {
        title: "Log in to Alpha"
    });
});


router.post('/log_in', async (req, res) => {
    try {
        const user = await database.get_user("email", req.body.email)
        const verified = await verify_user(req.body.password, user.password)
        if (verified) {
            delete user.password;
            req.session.user = user;
            res.redirect('/');
        }
        else
            res.send("Email-Password combination is not valid")
    } catch (error) {
        res.send("Log-in process failed: " + error)
    }
});


router.get('/log_out', (req, res) => {
    req.session.destroy();
    res.redirect('/')
})

module.exports = router;
