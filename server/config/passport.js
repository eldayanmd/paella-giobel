const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { User } = require('../models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    passReqToCallback: true,
    proxy: true
}, async (req, accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                nombre: profile.displayName,
                email: email,
                google_id: profile.id,
                picture: profile.photos[0]?.value,
                auth_method: 'google',
                profile_complete: false
            });
        }

        // Generar token JWT
        const tokenPayload = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            picture: user.picture,
            authMethod: 'google'
        };

        if (!user.password) {
            tokenPayload.needsPassword = true;
        }

        const token = jwt.sign(
            tokenPayload,
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        // Guardar la URL original en la sesión si existe
        const originalUrl = req.session.originalUrl || '/';
        
        const redirectUrl = user.password
    ? `${process.env.FRONTEND_URL}${originalUrl}?token=${encodeURIComponent(token)}&source=google`
    : `${process.env.FRONTEND_URL}/completar-perfil.html?token=${encodeURIComponent(token)}&source=google&originalUrl=${encodeURIComponent(originalUrl)}`;
        return done(null, user, { redirectUrl });

    } catch (error) {
        console.error('Error en autenticación Google:', error);
        return done(error);
    }
}));
// Serialización
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialización
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findByPk(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

module.exports = passport;
