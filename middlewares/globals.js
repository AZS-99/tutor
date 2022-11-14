globals = (req, res, next) => {
    res.locals.session = req.session;
    res.locals.nav_lsts = [
        {"Home": '/', "About": "/", "Booking": '/enroll/packages'},
        {"Sign in": "/users/log_in", "Sign up": "/users/sign_up"}
    ];
    res.locals.logged_nav_lsts = [
        {"Home": '/', "About": "/", "Booking": '/enroll/packages'},
        {"Log out": "/users/log_out"}
    ]
    next();
}

module.exports = globals