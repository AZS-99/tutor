const express = require('express')
const database = require('../models/database')
const {ensure_log_in} = require("../middlewares/access");

const stripe = require('stripe')(process.env.STRIPE_KEY, {apiVersion: "2022-08-01"});
const endpoint_secret = process.env.WEBHOOK_ENDPOINT;


const router = express.Router();


router.get('/packages', async (req, res) => {
    res.render("packages" , {
        packages: {
            1: "Booking one hour at a time is best for those who have a hectic schedule which changes frequently",
            5: "The 5 hrs package is ideal for pupils who have a good grasp of coding, and need at least one weekly hour to brush" +
                " on their knowledge and to exercise, or those who would like to save 5% instead of 5 individual hours",
            10: "For beginners who need at least two hours a week, or those who would like to save 10%"
        }
    });
})


router.get('/book_trial', ensure_log_in, (req, res) => {
    res.render("book_trial")
})

router.post('/book_trial',  async (req, res) => {
    try {
        const year = parseInt(req.body.date.substring(0, 4))
        const month = parseInt(req.body.date.substring(5, 7))
        const day = parseInt(req.body.date.substring(8))
        const half_hr = parseInt(req.body.time.substring(0, 2)) * 2 + (parseInt(req.body.time.substring(3)) === 30? 1 : 0);
        const slots_count = 2

        const unavailable_slots_jsn = await database.get_unavailable_slots(year, month, day, 2);
        const unavailable_slots = unavailable_slots_jsn.map(jsn => jsn.half_hr);

        for (let i = 0; i < slots_count; ++i) {
            if (unavailable_slots.includes(half_hr + i)){
                res.send("Unavailable");
                return;
            }
        }

        await database.set_appointment(year, month, day, half_hr, slots_count, 1);
        res.send("Success, you'll be contacted within 24 hrs to confirm your session!")

    }catch (e) {
        console.log(e.message)
        res.send(e)
    }
})


router.post('/create-checkout-session', ensure_log_in, async (req, res) => {
    try {
        const hrs = Number(req.body.hours)
        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: req.body.hours + 'hr' + (req.body.hours === '1'? ' ': 's ') + 'Package',
                        },
                        unit_amount:  hrs === 1? 4000 : 4000 * (100 - hrs)/100,
                    },
                    quantity: hrs,
                },
            ],
            customer_email: req.session.user.email,
            mode: 'payment',
            success_url: process.env.NODE_ENV === 'development'?  'http://localhost:3000/enroll/success' : 'https://www.sigmaedu.ca/enroll/success',
            cancel_url: process.env.NODE_ENV === 'development'? 'http://localhost:3000/enroll/cancel' :'https://www.sigmaedu.ca/enroll/cancel'
        });

        res.redirect(303, session.url);
    } catch (e) {
        console.log(e)
    }
});


router.post('/webhook',  express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    console.log("sig", sig);

    let event;



    try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpoint_secret);
        console.log(event);
    }
    catch (err) {
        res.send("ERROR:" + err.message);
    }

    switch (event.type) {
        case 'checkout.session.completed':
            const id = event.data.object.id;
            const session = await stripe.checkout.sessions.retrieve(id, {expand: ["line_items"]});
            const quantity = session.line_items.data[0].quantity;
            const email = event.data.object.customer_email;
            const user = await database.get_user("email", email);
            if (event.data.object.payment_status === 'paid') await database.add_student_hrs(user.id, quantity);
            break;

        case 'charge.succeeded':
            break;

        case 'payment_intent.succeeded':
            break;

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.send();
});







router.get('/checkout', (req, res) => {
    res.render('checkout', {
        layout: 'checkoutLay'
    });
})

router.get('/success', (req, res) => {
    res.send("SUCCESS");
});

router.get('/cancel', (req, res) => {
    res.send("Failure");
})



module.exports = router

