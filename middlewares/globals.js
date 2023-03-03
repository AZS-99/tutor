globals = (req, res, next) => {
    res.locals.session = req.session;
    res.locals.nav = [
        {"Home": '/', "About": "/about", "Booking": '/enroll/packages', "Contact": '/contact'},
        {"Sign in": "/users/log_in", "Sign up": "/users/sign_up"}
    ];

    res.locals.nav_student = [
        {"Home": '/', "About": "/about", "Booking": '/enroll/packages', "Contact": '/contact'},
        {"My Account": "/users/account", "Log out": "/users/log_out"}
    ];

    res.locals.nav_instructor = [
        {"Home": '/', "About": "/about", "Contact": '/contact'},
        {"My Account": "/users/account", "Log out": "/users/log_out"}
    ]



    next();
}

module.exports = globals