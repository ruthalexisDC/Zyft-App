// Back-end/config/passport.js
import dotenv from 'dotenv';
dotenv.config();

import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import User from '../models/User.js';

// Debug: confirm env vars loaded
console.log('GOOGLE_CLIENT_ID loaded:', process.env.GOOGLE_CLIENT_ID ? '✓' : '✗ MISSING');
console.log('GOOGLE_CLIENT_SECRET loaded:', process.env.GOOGLE_CLIENT_SECRET ? '✓' : '✗ MISSING');
console.log('FACEBOOK_APP_ID loaded:', process.env.FACEBOOK_APP_ID ? '✓' : '✗ MISSING');
console.log('FACEBOOK_APP_SECRET loaded:', process.env.FACEBOOK_APP_SECRET ? '✓' : '✗ MISSING');

// Shared helper: generate a unique handle from a display name
const generateHandle = async (name) => {
  let handle = (name || 'user').toLowerCase().replace(/\s+/g, '');
  let handleExists = await User.findOne({ handle });
  while (handleExists) {
    handle = `${handle}${Math.floor(Math.random() * 1000)}`;
    handleExists = await User.findOne({ handle });
  }
  return handle;
};

// Google Strategy
passport.use('google', new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "http://localhost:5000/api/auth/google/callback",
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id: googleId, displayName: name, emails, photos } = profile;
    const email = emails?.[0]?.value;
    const picture = photos?.[0]?.value;

    let user = await User.findOne({ googleId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.googleId = googleId;
        await user.save();
      } else {
        const handle = await generateHandle(name);
        user = await User.create({
          name,
          email,
          handle,
          googleId,
          avatar: picture,
          authProvider: 'google',
          isVerified: true,
          onboardingComplete: false,
        });
      }
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

// Facebook Strategy
passport.use('facebook', new FacebookStrategy({
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: "http://localhost:5000/api/auth/facebook/callback",
  profileFields: ['id', 'displayName', 'photos', 'email'],
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const { id: facebookId, displayName: name, emails, photos } = profile;
    const email = emails?.[0]?.value || `${facebookId}@facebook.placeholder`; // ← fallback if no email
    const picture = photos?.[0]?.value;

    let user = await User.findOne({ facebookId });
    if (!user) {
      user = await User.findOne({ email });
      if (user) {
        user.facebookId = facebookId;
        await user.save();
      } else {
        const handle = await generateHandle(name);
        user = await User.create({
          name,
          email,
          handle,
          facebookId,
          avatar: picture,
          authProvider: 'facebook',
          isVerified: true,
          onboardingComplete: false,
        });
      }
    }
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;