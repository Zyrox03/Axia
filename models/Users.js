const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseID: {
    type: String,
    required: true,
    unique: true
  },
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  expertise: {
    type: String
  },
  name: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    default: null,
    sparse: true,
  },

  profilePicture: {
    path: {
      type: String
    },
    filename: {
      type: String
    },
  },
  bannerPicture: {
    path: {
      type: String
    },
    filename: {
      type: String
    },
  },
  location: {
    type: String
  },
  platforms: {
    type: [
      {
        platform: { type: String },
        userAlias: { type: String },
      }
    ],
    required: true,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
