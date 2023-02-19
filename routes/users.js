const express = require('express');
const database = require('../models/database')
const {verify_user, ensure_log_in, ensure_no_log} = require("../middlewares/access");
const {get_tomorrow_str, get_date_str} = require("../middlewares/helpers");

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});


router.get('/account', ensure_log_in, async (req, res) => {
    const instructors = await database.get_instructors();
    const info = await database.get_user_info(req.session.user);

    let tomorrow_str = get_tomorrow_str();
    let next_month = get_date_str(30);
    tomorrow_str += "17:00";
    next_month += "17:00";

    res.render('account', {
        info: info,
        instructors: instructors,
        appointments: await database.get_appointments(req.session.user),
        datetime_min: tomorrow_str,
        datetime_max: next_month
    });
});


router.post('/cancel_session', ensure_log_in, async (req, res) => {
    await database.cancel_slot(req.session.user.id, req.body.year, req.body.month, req.body.day, req.body.start_time, req.body.count);
    res.redirect('/users/account')
})


router.post('/request_slot', ensure_log_in, async (req, res) => {
    const student_info = await database.get_user_info(req.session.user);
    const half_hrs_count = Number(req.body.duration_mins) / 30;
    const date = req.body.slot.slice(0, 10).split("-");
    const time = req.body.slot.slice(11, 16).split(":");
    const half_hr = Number(time[0]) * 2 + (Number(time[1]) === 30? 1 : 0);

    if (half_hrs_count <= student_info.half_hrs_credit) {
        await database.set_appointment(date[0], date[1], date[2], half_hr, half_hrs_count, req.session.user.id, req.body.instructor_id);
        await database.add_student_hrs(req.session.user.id, half_hrs_count * -1);
    }

    res.redirect("/users/account");
});

router.get('/log_in', ensure_no_log, (req, res) => {
    res.render('log_in', {
        title: "Log in to Sigma"
    });
});


router.post('/log_in', async (req, res) => {
    try {
        const user = await database.get_user("email", req.body.email)
        console.log(user);
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

router.get('/sign_up', ensure_no_log, (req, res) => {
    res.render('sign_up', {
        title: "Sign up with Sigma!"
    });
});


router.post('/sign_up', async (req, res) => {
    try {
        req.body.position = 'STUDENT'
        const user = await database.add_user(req.body);
        delete user.password
        req.session.user = user;
        res.redirect('/');
    } catch (e) {
        console.log("ERROR!!!" + e)
        res.send(e);
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
