const express_session = require('express-session')
const Session_store = require('connect-pg-simple')(express_session)

const { Pool } = require('pg')

const session = (express_session({
    store: new Session_store({
        pool: new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.NODE_ENV === 'development'?  false : { rejectUnauthorized: false }
        }),
        tableName: process.env.SESSIONS_TABLE
    }),
    name: 'efas_session',
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV !== 'development'
    }
}));

module.exports = session