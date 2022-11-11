const express = require('express')
const database = require('../models/database')
const stripe = require('stripe')('sk_test_51M1zZZKgvv1eRC7rBgnByDQdn91Zs2vddghqvN3VjEO88sEVuZPttsXIM4AzWZVzC9tqEWqnWpHKXLAYJ9JIfmvD006mwpuT8W', {apiVersion: "2022-08-01"});


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
                        currency: 'usd',
                        product_data: {
                            name: '10 hrs Package',
                        },
                        unit_amount: 27000,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: 'http://localhost:3000/success',
            cancel_url: 'http://localhost:3000/cancel',
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



module.exports = router

