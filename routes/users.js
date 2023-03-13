const express = require('express');
const alert = require('alert');
const bcrypt = require('bcrypt');
const nodeoutlook = require('nodejs-nodemailer-outlook');
const database = require('../models/database');

const {verify_user, ensure_log_in, ensure_no_log} = require("../middlewares/access");
const {get_tomorrow_str, get_date_str, send_email} = require("../middlewares/helpers");
const {sendEmail} = require("nodejs-nodemailer-outlook");

const router = express.Router();

/* GET users listing. */
router.get('/', (req, res, next) => {
  res.send('respond with a resource');
});


router.get('/account', ensure_log_in, async (req, res) => {
    try {
        const info = await database.get_user_info(req.session.user);

        let tomorrow_str = get_tomorrow_str();
        let next_month = get_date_str(30);
        tomorrow_str += "17:00";
        next_month += "17:00";

        res.render('account', {
            info: info,
            appointments: await database.get_appointments(req.session.user),
            subjects: await database.get_subjects(),
            datetime_min: tomorrow_str,
            datetime_max: next_month
        });
    } catch (e) {res.render('error', {error: e});}

});


router.post('/cancel_session', ensure_log_in, async (req, res) => {
    try {
        await database.cancel_slot(req.session.user.id, req.body.year, req.body.month, req.body.day, req.body.start_time, req.body.count);
        res.redirect('/users/account')
    }catch (e) {res.render('error', {error: e});}

});


router.get('/change_name', ensure_log_in, (req, res) => {
    res.render('users/change_name');
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

    } catch (e) {res.render('error', {error: e});}
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
    } catch (e) {res.render('error', {error: e});}
})

router.post('/request_slot', ensure_log_in, async (req, res) => {

    const student_info = await database.get_user_info(req.session.user);
    const date = req.body.slot.slice(0, 10).split("-");
    const time = req.body.slot.slice(11, 16).split(":");

    req.body.year = date[0];
    req.body.month = date[1];
    req.body.day = date[2];
    req.body.half_hr =  Number(time[0]) * 2 + (Number(time[1]) === 30? 1 : 0);
    req.body.duration = Number(req.body.duration);
    req.body.student_id = req.session.user.id;

    if (req.body.duration <= student_info.half_hrs_credit) {
        await database.set_appointment(req.body);
        await database.add_student_hrs(req.session.user.id, req.body.duration * -1);
        if (process.env.NODE_ENV === "production") {
            send_email("adam.zachary.saher@gmail.com", "Slot requested", "Check new activity on Sigma");
            send_email(req.session.user.email, "Lesson Booked", "A lesson has been booked, check your account on www.sigmaedu.ca!");
        }
    } else {
        res.render('failure', {failure: "Your credit hours are not enough, please add more hours to your account"});
    }

    res.redirect("/users/account");
});

router.get('/log_in', ensure_no_log, (req, res) => {
    res.render('users/log_in', {
        title: "Log in to Sigma"
    });
});


router.post('/log_in', async (req, res) => {
    try {
        const user = await database.get_user("email", req.body.email)
        if (user) {
            const verified = await verify_user(req.body.password, user.password)
            if (verified) {
                delete user.password;
                req.session.user = user;
                res.redirect('back');
            }
            else
                res.send("Email-Password combination is not valid")
        } else res.render('failure', {failure: "User does not exist"});

    }  catch (e) {res.render('error', {error: e});}
});

router.get('/sign_up', ensure_no_log, (req, res) => {
    res.render('users/sign_up', {
        title: "Sign up with Sigma!"
    });
});


router.post('/sign_up', async (req, res) => {
    try {
        req.session.tmp_user = req.body;
        req.session.tmp_user.position = 'STUDENT';
        req.session.tmp_user.confirm_code = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

        let msg = "We have received a request to create an account on www.sigmaedu.ca using this email. If this was you"
        msg += " please enter the following code:";
        msg += req.session.tmp_user.confirm_code;

        send_email(req.body.email, "Confirm your Email on Sigma", msg);

        res.redirect('/users/confirm_email');
    }  catch (e) {res.render('error', {error: e});}
});


router.get('/confirm_email', (req, res) => {
    res.render('users/confirm_code');
})


router.post('/confirm_email', async (req, res) => {
    try {
        if (req.body.code === req.session.tmp_user.confirm_code) {
            const user = await database.add_user(req.session.tmp_user);
            delete user.password;
            req.session.user = user;
            req.session.user.position = 'STUDENT';
            delete req.session.tmp_user;
            console.log(req.session.user);
            res.redirect('/users/account');
        } else {
            delete req.session.tmp_user;
            res.send('Sorry, that confirmation code you entered was incorrect!!');
        }
    }  catch (e) {res.render('error', {error: e});}
})



router.get('/log_out', ensure_log_in, (req, res) => {
    req.session.destroy();
    res.redirect('/')
})


router.post('/unavailable_slots', express.json({type: 'application/json'}), async (req, res) => {
    try {
        res.send(await database.get_unavailable_slots(req.body.year, req.body.month, req.body.day, req.body.instructor_id));
    }  catch (e) {res.render('error', {error: e});}
})


router.post('/get_instructors_tutoring', express.json({type: 'application/json'}), async(req, res) => {
    try {
        res.send(await database.get_instructors_tutoring(req.body.subject_id));
    }  catch (e) {res.render('error', {error: e});}
})

module.exports = router;
