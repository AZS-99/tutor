const bcrypt = require("bcrypt");
const database = require('../models/database')

module.exports.ensure_admin_authority = async (req, res, next) => {
    if (req.session.user) {
        const is_admin = await database.is_admin(req.session.user.id);
        is_admin.exists? next() : res.redirect('/');
    }
    else res.redirect('/')
}


module.exports.ensure_log_in = (req, res, next) => {
   req.session.user? next() : res.redirect('/users/sign_up');
}


module.exports.ensure_no_log = (req, res, next) => {
    req.session.user?  res.redirect('/users/account') : next();
}


module.exports.verify_user = async (entered_pass, stored_pass) => {
    try { return await bcrypt.compare(entered_pass, stored_pass) }
    catch (e) { throw e }
}