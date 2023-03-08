const express = require('express')
const database = require('../models/database');
const {ensure_admin_authority} = require("../middlewares/access");
const router = express.Router()


router.post('/add_subject', async (req, res) => {
    try {
        await database.add_subject(req.body.subject)
        res.render('/');
    } catch (e) {
        res.render('error', {
            error: e
        });
    }
});


router.get('/deactivate_user/:id', ensure_admin_authority, async (req, res) => {
    try {
        await database.deactivate_user(req.params.id);
        res.redirect('back');
    } catch (e) {
        res.render('/error', {error: e});
    }
});

router.get('/control_panel', ensure_admin_authority, (req, res) => {
    res.render('admin/management');
});

router.get('/list_students', ensure_admin_authority, async (req, res) => {
    try {
        res.send(await database.get_student_list());
    } catch (e) {
        res.render('error', {
            error: e
        })
    }
});

router.get('/register_instructor', ensure_admin_authority, async (req, res) => {
    res.render('create_instructor', {
        subjects: await database.get_subjects()
    });
});

router.post('/register_instructor', ensure_admin_authority, async (req, res) => {
    try {
        await database.add_user(req.body);
        res.redirect('/users/account');
    } catch (e) {
        res.render('error');
    }
});

module.exports = router;

