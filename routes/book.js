const express = require('express')
const database = require('../models/database')
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


router.post('/create-checkout-session', async (req, res) => {
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

