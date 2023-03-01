const express = require('express')
const database = require('../models/database');
const {ensure_admin_authority} = require("../middlewares/access");
const router = express.Router()


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

