const { RateLimiterPostgres } = require('rate-limiter-flexible');

const { Pool } = require('pg')

const client = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'? { rejectUnauthorized: false } : false
});


const rateLimiterOpts = new RateLimiterPostgres({
    storeClient: client,
    points: 5,             //max number of hits
    duration: 1,           //within 1 second
    blockDuration: 60,
    tableName: 'brute_force',
    keyPrefix: 'tmp'
});


const rateLimiter = async (req, res, next) => {
    // On the basis of ip address, but can be modified according to your needs
    try {
        await rateLimiterOpts.consume(req.ip)
        next()
    } catch (error) {
        res.status(429).render('error', {
            error: "suspicious behaviour"
        })
    }
};

module.exports = rateLimiter;