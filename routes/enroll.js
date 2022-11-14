const express = require('express')
const database = require('../models/database')
const {ensure_log_in} = require("../middlewares/access");
const stripe = require('stripe')(process.env.STRIPE_KEY, {apiVersion: "2022-08-01"});


const router = express.Router();

// router.post("/create-payment-intent", async (req, res) => {
//     try {
//         const { items } = req.body;
//
//         // Create a PaymentIntent with the order amount and currency
//         const paymentIntent = await stripe.paymentIntents.create({
//             amount: 10,
//             currency: "cad",
//             automatic_payment_methods: {
//                 enabled: true
//             }
//         });
//
//         res.send({
//             clientSecret: paymentIntent.client_secret
//         });
//     } catch (e) {
//         console.log(e)
//     }
//
// });


router.get('/packages', async (req, res) => {
    const packages = await database.get_packages();
    res.render("packages", {
        packages: packages
    })
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

        const session = await stripe.checkout.sessions.create({
            line_items: [
                {
                    price_data: {
                        currency: 'cad',
                        product_data: {
                            name: req.body.hours + 'hr' + (req.body.hours === '1'? ' ': 's ') + 'Package',
                        },
                        unit_amount: Number(req.body.cost) * 100,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: process.env.NODE_ENV === 'development'?  'http://localhost:3000/book/success' : 'http://www.sigmaedu.ca/book/success',
            cancel_url: process.env.NODE_ENV === 'development'? 'http://localhost:3000/book/cancel' :'http://www.sigmaedu.ca/book/cancel'
        });

        res.redirect(303, session.url);
    } catch (e) {
        console.log(e)
    }

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

