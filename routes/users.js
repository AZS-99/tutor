const express = require('express');
const bcrypt = require('bcrypt');
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
});


router.get('/change_name', ensure_log_in, (req, res) => {
    res.render('change_name');
})

router.post('/change_name', ensure_log_in, async (req, res) => {
    try {
        const password = (await database.get_user("id", req.session.user.id)).password
        const verified = verify_user(req.body.password, password);
        if (verified) {
            await database.edit_user(req.session.user.id, "forename", req.body.new_forename);
            await database.edit_user(req.session.user.id, "surname", req.body.new_surname);
            req.session.user = await database.get_user("id", req.session.user.id);
            res.redirect('/');
        } else res.render("failure", {
            err: "Wrong password"
        })

    } catch (e) {
        throw e;
    }
});

router.get('/change_password', ensure_log_in, (req, res) => {
    res.render('change_password');
})

router.post('/change_password', ensure_log_in, async (req, res) => {
    try {
        const password = (await database.get_user("id", req.session.user.id)).password
        const verified = verify_user(req.body.old_password, password);

        if (verified) {
            let new_password = await bcrypt.hash(req.body.new_password, Number(process.env.SALT_ROUNDS));
            await database.edit_user(req.session.user.id, "password", new_password);
            res.redirect('/');
        } else res.render("failure", {err: "Wrong pass"});
    } catch (e) {

    }
})

router.post('/request_slot', ensure_log_in, async (req, res) => {
    const student_info = await database.get_user_info(req.session.user);
    const date = req.body.slot.slice(0, 10).split("-");
    const time = req.body.slot.slice(11, 16).split(":");

    req.body.year = date[0];
    req.body.month = date[1];
    req.body.day = date[2];
    req.body.half_hr =  Number(time[0]) * 2 + (Number(time[1]) === 30? 1 : 0);
    // Duration in half hrs, rather than mins.
    req.body.duration = Number(req.body.duration_mins) / 30;
    req.body.student_id = req.session.user.id;

    if (req.body.duration <= student_info.half_hrs_credit) {
        await database.set_appointment(req.body);
        await database.add_student_hrs(req.session.user.id, req.body.duration * -1);
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
