const mongoose = require('mongoose');



const categorySchema = new mongoose.Schema({
  categoryName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  categoryDescription: {
    type: String,
    required: true,

  },
  categoryCover: {
    path: {
      type: String,
      required: true,
      trim: true,
    },
    filename: {
      type: String,
      required: true,
      trim: true,
    },
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

// const socialMediaSchema = new mongoose.Schema({
//   instagram: {
//     type: String,
//     trim: true,
//   },
//   facebook: {
//     type: String,
//     trim: true,
//   },
//   twitter: {
//     type: String,
//     trim: true,
//   },

//   linkedin: {
//     type: String,
//     trim: true,
//   },
//   pinterest: {
//     type: String,
//     trim: true,
//   },
//   youtube: {
//     type: String,
//     trim: true,
//   },
// });



// Define the Store schema
const storeSchema = new mongoose.Schema({
  store_name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },

  store_logo: {
    path: {
      type: String
    },
    filename: {
      type: String
    }
  },

  theme: {
    buttonColor: {
      type: String
    }
  },


  store_banner: {
    path: {
      type: String
    },
    filename: {
      type: String
    }
  },

  description: {
    type: String,
    trim: true,
  },

  heroTitle: {
    type: String,
    trim: true,
  },

  // socialMedia: socialMediaSchema,
  socialMedia: [String],

  contactInformation: {
    type: String
  },

  paymentMethod: [{
    type: {
      type: String,
      enum: ['PayPal', 'COD'], // Allowed values: 'Paypal', 'COD'
      required: true,
    },
    data: {
      type: Object,
      default: {}, // You can define default data if needed
    },
  }],

  owner: {
    ownerID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    ownerEmail: {
      type: String
    },

    ownerMerchantID: {
      type: String
    }
  },

  categories: [categorySchema],

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});




// Custom validation function to check for duplicate category names
storeSchema.methods.validateCategories = function () {
  const categoryNames = new Set();
  for (const category of this.categories) {
    if (categoryNames.has(category.categoryName)) {
      throw new Error(`Duplicate categoryName: ${category.categoryName}`);
    }
    categoryNames.add(category.categoryName);
  }
};

// Pre-save hook to run the validation before saving the Store document
storeSchema.pre('save', function (next) {
  try {
    this.validateCategories();
    next();
  } catch (error) {
    next(error); // Pass any validation error to the next middleware
  }
});

// Create the Store model
const Store = mongoose.model('Store', storeSchema);

module.exports = Store;
