"use strict";
require('dotenv').config()

const createError = require('http-errors');
const enforce_ssl = require('express-enforces-ssl')
const express = require('express');
const exphbs = require('express-handlebars')
const helmet = require('helmet');
const path = require('path');
const logger = require('morgan');
const session = require('./middlewares/session')
const rateLimiter = require('./middlewares/rateLimiter');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const enrollRouter = require('./routes/enroll');
const manageRouter = require('./routes/manage');

const globals = require("./middlewares/globals")


const app = express();



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');



app.use(logger('dev'));
app.use((req, res, next) => {
  if (req.originalUrl !== '/enroll/webhook') express.json();
  next();
});

app.use(express.urlencoded({ extended: false }));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.engine('hbs', exphbs.engine({
  extname: 'hbs',
  defaultLayout: 'main',
  helpers: {
    capitalise: (str) => {
      return str[0].toUpperCase() + str.substr(1);
    },
    equals: (var1, var2) => {
      return var1 === var2;
    },
    not_equal: (var1, var2) => {
      return var1 !== var2
    },
    ternary: (condition, var1, var2) => {
      return condition? var1 : var2;
    },
    multiply: (var1, var2) => {
      return var1 * var2
    },
    div: (var1, var2) => {
      return var1 / var2;
    },
    int_div: (var1, var2) => {
      return Math.floor(var1/var2);
    },
    modulo: (var1, var2) => {
      return var1 % var2;
    },
    get_package_price: (hrs) => {
      hrs = Number(hrs);
      return hrs === 1? 40 : Math.round(40 * hrs * (100 - hrs)/100)
    }
  }
}));



app.use(helmet({
  contentSecurityPolicy: {
    useDefaults: false,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://checkout.stripe.com", "https://b.stripecdn.com", "https://js.stripe.com/", "https://maps.googleapis.com", "https://www.googletagmanager.com/gtag/js?id=G-MZ4FCEQWFC"],
      connectSrc: ["'self'", "https://checkout.stripe.com", "https://api.stripe.com", "https://maps.googleapis.com"],
      frameSrc: ["'self'", "https://checkout.stripe.com", "https://b.stripecdn.com", "https://js.stripe.com", "https://hooks.stripe.com"],
      imgSrc: ["'self'", "https://*.stripe.com"],
      styleSrc: ["'self'", "unsafe-inline"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    }
  },
  crossOriginResourcePolicy: {policy: "cross-origin"}
}))











app.use(session);
app.use(globals);
app.use(rateLimiter);

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/enroll', enrollRouter);
app.use('/manage', manageRouter);

if (process.env.NODE_ENV !== 'development') {
  app.enable('trust proxy')
  app.use(enforce_ssl())
}

// catch 404 and forward to error handler
app.use((req, res, next) => {
  next(createError(404));
});

// error handler
app.use((err, req, res, next) => {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};


  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
