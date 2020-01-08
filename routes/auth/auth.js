/* eslint-disable no-shadow */
/* eslint-disable no-underscore-dangle */
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const FacebookStrategy = require('passport-facebook').Strategy;
const AmazonStrategy = require('passport-amazon').Strategy;
const GithubStrategy = require('passport-github').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const InstagramStrategy = require('passport-instagram').Strategy;
const SpotifyStrategy = require('passport-spotify').Strategy;
const TwitchStrategy = require('passport-twitch.js').Strategy;
const chalk = require('chalk');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const keys = require('../../config/providers');

const authConfig = require('../../config/auth');

const User = require('../../models/user/User');
const UserProfileImage = require('../../models/user/UserProfileImage');

let user = {};

const app = express();
app.use(cors());


passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

// Facebook Strategy
passport.use(
  new FacebookStrategy({
    clientID: keys.FACEBOOK.clientID,
    clientSecret: keys.FACEBOOK.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/facebook/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

// Amazon Strategy
passport.use(
  new AmazonStrategy({
    clientID: keys.AMAZON.clientID,
    clientSecret: keys.AMAZON.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/amazon/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

// Github Strategy
passport.use(
  new GithubStrategy({
    clientID: keys.GITHUB.clientID,
    clientSecret: keys.GITHUB.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/github/callback',
  },
  async (accessToken, refreshToken, profile, cb) => {
    const profileId = profile.id;
    let userImage = {};
    const {
      photos,
    } = profile;

    const tempUser = await User.find({
      id: profileId,
    })
      .populate('profileImage');

    if (tempUser.length === 0) {
      let tempEmail = '';
      const image = photos[0].value;
      if (profile._json.email !== null) {
        tempEmail = profile._json.email;
      }
      const newUserProfileImage = new UserProfileImage({
        id: profile.id,
        name: `${profile.displayName} profile picture`,
        url: image,
        origin: 'Github',
      });
      await newUserProfileImage
        .save()
        .then(async () => {
          const img = await UserProfileImage.findOne({
            id: profile.id,
          });
          userImage = {
            ...img,
          };
        })
        .catch((err) => {
          console.log('err:', err);
        });

      const newUser = new User({
        id: profile.id,
        name: profile.displayName,
        email: tempEmail,
        username: profile._json.login,
        password: '',
        profileImage: userImage._doc._id,
        isAdmin: false,
        origin: 'Github',
      });
      await newUser
        .save()
        .then(() => {
          User.findOne({
            profileId,
          })
            .then((userInfo) => {
              user = {
                ...userInfo,
              };
            });
        })
        .catch((err) => {
          console.log('err:', err);
        });
    } else {
      user = {
        ...tempUser,
      };
    }


    return cb(null, profile);
  }),
);

// Google Strategy
passport.use(
  new GoogleStrategy({
    clientID: keys.GOOGLE.clientID,
    clientSecret: keys.GOOGLE.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/google/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    console.log('accessToken: ', accessToken);
    console.log('refreshToken:', refreshToken);
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

// Instagram Strategy
passport.use(
  new InstagramStrategy({
    clientID: keys.INSTAGRAM.clientID,
    clientSecret: keys.INSTAGRAM.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/instagram/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

// Spotify Strategy
passport.use(
  new SpotifyStrategy({
    clientID: keys.SPOTIFY.clientID,
    clientSecret: keys.SPOTIFY.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/spotify/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

// Twitch Strategy
passport.use(
  new TwitchStrategy({
    clientID: keys.TWITCH.clientID,
    clientSecret: keys.TWITCH.clientSecret,
    callbackURL: 'https://cryptic-activist-backend.herokuapp.com/auth/twitch/callback',
  },
  (accessToken, refreshToken, profile, cb) => {
    console.log(chalk.blue(JSON.stringify(profile)));
    user = {
      ...profile,
    };
    return cb(null, profile);
  }),
);

app.use(express.json());
app.use(passport.initialize());

// Bodyparser
app.use(express.urlencoded({
  extended: false,
}));

// Express session
app.use(
  session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
  }),
);


app.get('/facebook', passport.authenticate('facebook'));
app.get(
  '/facebook/callback',
  passport.authenticate('facebook'),
  (req, res) => {
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

app.get(
  '/amazon',
  passport.authenticate('amazon', {
    scope: ['profile'],
  }),
);
app.get(
  '/amazon/callback',
  passport.authenticate('amazon'),
  (req, res) => {
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

function generateToken(params = {}) {
  return jwt.sign({ id: user.id }, authConfig.secret, {
    expiresIn: 86400,
  });
}

app.get('/github', passport.authenticate('github'));
app.get(
  '/github/callback',
  passport.authenticate('github'),
  (req, res) => {
    user.token = generateToken(user.id);
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

app.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  }),
);
app.get(
  '/google/callback',
  passport.authenticate('google'),
  (req, res) => {
    console.log('Google Profile Info', req.profile);
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

app.get('/instagram', passport.authenticate('instagram'));
app.get(
  '/instagram/callback',
  passport.authenticate('instagram'),
  (req, res) => {
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

app.get('/spotify', passport.authenticate('spotify'));
app.get(
  '/spotify/callback',
  passport.authenticate('spotify'),
  (req, res) => {
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com');
  },
);

app.get('/twitch', passport.authenticate('twitch.js'));
app.get(
  '/twitch/callback',
  passport.authenticate('twitch.js'),
  (req, res) => {
    // res.redirect("https://hardcore-tesla-e87eac.netlify.com/profile");
    res.redirect('https://hardcore-tesla-e87eac.netlify.com/profile');
  },
);

app.get('/user', (req, res) => {
  console.log('getting user data!');
  console.log('user:', user);
  res.send(user);
});

app.get('/logout', (req, res) => {
  console.log('logging out!');
  user = {};
  res.json({
    user,
  });
});

module.exports = app;