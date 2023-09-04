const mongoose = require('mongoose');
const userJoiSchema = require('../JOI/userJoiSchema')

const userSchema = new mongoose.Schema({
  firebaseID: {
    type: String,
    // required: true,
    unique: true
  },
  merchantID: {
    type: String,
    sparse: true,
    unique: true
  },
  username: {
    type: String,
    // required: true,
  },
  email: {
    type: String,
    // required: true,
    unique: true,
  },
  emailVerified: {
    type: Boolean,
    default: false,
  },
  expertise: {
    type: String
  },
  profileFirstName: {
    type: String,
    // required: true
  },
  profileLastName: {
    type: String,
    // required: true
  },
  birthDate: {
    type: String,
  },
  businessEmail: {
    type: String,
  },
  businessName: {
    type: String,
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
  citizenship: {
    type: String
  },
  platforms: {
    type: [
      {
        platform: { type: String },
        userAlias: { type: String },
        storeID: { type: String }
      }
    ],
    // required: true,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});




// Mongoose middleware to validate and save data before saving to the database
userSchema.pre('save', async function (next) {
  try {
    await userJoiSchema.validateAsync(this.toObject());
    next();
  } catch (err) {
    next(err);
  }
});

const User = mongoose.model('User', userSchema);

module.exports = User;
