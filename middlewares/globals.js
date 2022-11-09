globals = (req, res, next) => {
    res.locals.session = req.session;
    res.locals.nav_lsts = [
        {"Home": '/', "About": "/", "Booking": 'users/book'},
        {"Sign in": "users/log_in", "Sign up": "users/sign_up"}
    ];
    res.locals.logged_nav_lsts = [
        {"Home": '/', "About": "/", "Booking": '/'},
        {"Log out": "users/log_out"}
    ]
    next();
}

module.exports = globals