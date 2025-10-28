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
        console.log('📸 Perfil de Google recibido:', {
            displayName: profile.displayName,
            email: profile.emails[0].value,
            id: profile.id
        });

        const email = profile.emails[0].value;
        let user = await User.findOne({ where: { email } });

        if (!user) {
            user = await User.create({
                nombre: profile.displayName || email.split('@')[0],
                email: email,
                google_id: profile.id,
                picture: profile.photos[0]?.value,
                auth_method: 'google',
                profile_complete: false
            });
            console.log('✅ Nuevo usuario creado:', user.nombre);
        } else {
            console.log('✅ Usuario existente:', user.nombre);
        }

        // Generar token JWT
        const tokenPayload = {
            id: user.id,
            email: user.email,
            nombre: user.nombre,
            picture: user.picture,
            authMethod: 'google'
        };

        const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
        
        // Redirección DIRECTA al frontend con token
        const redirectUrl = `${process.env.FRONTEND_URL}?token=${token}&user=${encodeURIComponent(user.nombre || user.email.split('@')[0])}`;
        
        console.log('🔗 Redirect URL generada:', redirectUrl);
        return done(null, user, { redirectUrl });

    } catch (error) {
        console.error('❌ Error en autenticación Google:', error);
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
