const bcrypt = require("bcrypt");

module.exports.ensure_admin_authority = (req, res, next) => {
    req.session.user && req.session.user.is_admin? next() : res.redirect('/')
}


module.exports.ensure_log_in = (req, res, next) => {
    req.session.user? next() : res.redirect('/users/sign_up')
}


module.exports.ensure_no_log = (req, res, next) => {
    !req.session.user ? next() : res.redirect('/')
}


module.exports.verify_user = async (entered_pass, stored_pass) => {
    try { return await bcrypt.compare(entered_pass, stored_pass) }
    catch (e) { throw e }
}