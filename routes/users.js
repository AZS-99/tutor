const express = require('express');
const database = require('../models/database')
const {verify_user, ensure_log_in} = require("../middlewares/access");

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});




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
        res.redirect('..');
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
            res.redirect('back');
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
