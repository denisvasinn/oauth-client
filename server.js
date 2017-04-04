'use strict';
const express = require('express'),
    bodyParser = require('body-parser'),
    request = require('request'),
    session = require('express-session'),
    fs = require('fs'),
    path = require('path'),
    config = require('./config');

var ca = fs.readFileSync(path.join(__dirname, '/ssl/oauth.crt'));
var auth = [(req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
}, (req, res, next) => {
    if(req.query.token) req.session.token = req.query.token;
    return next()
},(req, res, next) => {
    if(req.session.token) return next();
    res.location(`${config.oauthServer}?sender=${req.get('host')}`).status(302).end();
}, (req, res, next) => {
    if(!req.session.token) return next(new Error('Token is undefined'));
    var option = {
        method: 'GET',
        uri: `${config.oauthServer}?sender=${req.get('host')}&token=${req.session.token}`,
        agentOptions: { ca } 
    }

    request(option, (error, response, body) => {
        if(response.statusCode == 200){
            let tmp = JSON.parse(body);
            req.currentUser = tmp.user;
            return next();
            //res.status(200).end(body);
        }
        else res.status(response.statusCode).end('End');
    });
}];

if(module.parent){
    const router = express.Router();
    router.get('/', auth);
    module.exports = router;
}
else{
    const app = express(),
        https = require('https');

    const option = {
        key: fs.readFileSync(path.join(__dirname, '/ssl/oauth.key')),
        cert: fs.readFileSync(path.join(__dirname, '/ssl/oauth.crt'))
    }

    app.disable('x-powered-by');

    //middleware
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(bodyParser.json());
    app.use(session(config.session));

    app.get('/', (req, res, next) => res.status(200).end('Hello world!'));
    app.get('/auth/login', auth, (req, res, next) => {
        console.log(req.currentUser);
        res.status(200).end(JSON.stringify(req.currentUser));
    });

    // catch 404 and forward to error handler
    app.use((req, res, next) => {
        let err = new Error('Not Found');
        err.status = 404;
        next(err);
    });

    // development error handler
    // will print stacktrace
    if (app.get('env') === 'development') {
        app.use((err, req, res, next) => res.status(err.status || 500).end(JSON.stringify(err)));
    }

    //app.set('env', 'production');
    app.set('port', process.env.PORT || 4000);
    https.createServer(option, app).listen(app.get('port'), () => {
        console.log(`Server started in ${app.get('env')} mode on port ${app.get('port')}.`);
    });
}