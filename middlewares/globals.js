globals = (req, res, next) => {
    res.locals.session = req.session;
    res.locals.nav = [
        {"Home": '/', "About": "/about", "Booking": '/enroll/packages', "Contact": '/contact', "YouTube": "https://www.youtube.com/channel/UC1UqIZSBT1zbXP6Y4KyObDw"},
        {"Sign in": "/users/log_in", "Sign up": "/users/sign_up"}
    ];

    res.locals.nav_student = [
        {"Home": '/', "About": "/about", "Booking": '/enroll/packages', "Contact": '/contact'},
        {"My Account": "/users/account", "Log out": "/users/log_out"}
    ];

    res.locals.nav_instructor = [
        {"Home": '/', "About": "/about", "Contact": '/contact', "YouTube": "https://www.youtube.com/channel/UC1UqIZSBT1zbXP6Y4KyObDw"},
        {"My Account": "/users/account", "Log out": "/users/log_out"}
    ]



    next();
}

module.exports = globals