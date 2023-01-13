const express = require('express');
const database = require('../models/database')
const {verify_user, ensure_log_in, ensure_no_log} = require("../middlewares/access");

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});


router.get('/account', ensure_log_in, async (req, res) => {
    const student_info = await database.get_student_info(req.session.user.id);
    student_info.hrs_credit = Number(student_info.half_hrs_credit) / 2;
    delete student_info.half_hrs_credit;

    const taken_slots = await database.get_unavailable_slots(2023, 1, 6, 1);
    console.log(taken_slots)
    res.render('account', {
        student_info: student_info,
        appointments: await database.get_student_appointments(req.session.user.id)
    });
});


router.post('/request_slot', ensure_log_in, async (req, res) => {
    const student_info = await database.get_student_info(req.session.user.id);
    const half_hrs_count = Number(req.body.duration_mins) / 30;
    const date = req.body.slot.slice(0, 10).split("-");
    const time = req.body.slot.slice(11, 16).split(":");
    const half_hr = Number(time[0]) * 2 + (Number(time[1]) === 30? 1 : 0);

    if (half_hrs_count <= student_info.half_hrs_credit) {
        await database.set_appointment(date[0], date[1], date[2], half_hr, half_hrs_count, req.session.user.id, 1);
        await database.add_student_hrs(req.session.user.id, half_hrs_count * -1);
    }

    res.redirect("/users/account");
});


router.get('/sign_up', ensure_no_log, (req, res) => {
    res.render('sign_up', {
        title: "Sign up with Sigma!"
    });
});


router.post('/sign_up', async (req, res) => {
    try {
        const user = await database.add_user(req.body);
        delete user.password;
        req.session.user = user;
        res.redirect('/');
    } catch (e) {
        console.log("ERROR!!!" + e)
        res.send(e);
    }
});


router.get('/log_in', ensure_no_log, (req, res) => {
    res.render('log_in', {
        title: "Log in to Sigma"
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


router.get('/log_out', ensure_log_in, (req, res) => {
    req.session.destroy();
    res.redirect('/')
})


router.post('/unavailable_slots', express.json({type: 'application/json'}), async (req, res) => {
    try {
        res.send(await database.get_unavailable_slots(req.body.year, req.body.month, req.body.day, req.body.instructor_id));
    } catch (e) {
        console.log(e.message);
    }
})

module.exports = router;
