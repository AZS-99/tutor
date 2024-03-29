const nodeoutlook = require("nodejs-nodemailer-outlook");

module.exports.get_tomorrow_str = () => {
    let tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().slice(0, 11);
}


module.exports.get_date_str = (days_from_today) => {
    let today = new Date();
    let future_date = new Date();
    future_date.setDate(today.getDate() + days_from_today);
    return future_date.toISOString().slice(0, 11);
}


module.exports.send_email = (email, subject, msg) => {
    nodeoutlook.sendEmail({
        auth: {
            user: process.env.EMAIL,
            pass: process.env.EMAIL_PASS
        },
        from: process.env.EMAIL,
        to: email,
        subject: subject,
        html: '<p>' + msg + '<p>',
        onError: (e) => console.log(e)
    })
}

