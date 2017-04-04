module.exports = {
    port: 4000,
    oauthServer: 'https://localhost:3000/auth/oauth',
    session: {
        name: 'id',
        secret: 'z3TY48P12',
        resave: true,
        saveUninitialized: false,
        cookie: {
            secure: true,
            httpOnly: true,
            path: '/', 
            maxAge: 1 * 60 * 60 * 1000
        }
    }
}