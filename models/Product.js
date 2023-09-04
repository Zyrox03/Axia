const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const productSchema = new Schema({
  productName: {
    type: String,
    required: true,
  },
  productSlug: {
    type: String,
    required: true,
    match: /^[a-zA-Z0-9-_]+$/,
  },
  productCategory: {
    type: String,
  },
  productDescription: {
    type: String,
    required: true,
  },
  richTextDescription: {
    type: String
  },
  productImage: [
    {
      path: {
        type: String,
        required: true,
      },
      filename: {
        type: String,
        required: true,
      },
    },
    // validate: {
    //   validator: (images) => images && images.length > 0,
    //   message: 'Please select at least one image',
    // },
  ],
  price: {
    type: String,
  },
  originalPrice: {
    type: String,
  },
  costPrice: {
    type: String,
  },
  variantsArray: {
    type: [{
      variantType: {
        type: String,
        required: true,
      },
      buttonType: {
        type: String,
        required: true,
      },
      values: {
        type: [String],
        required: true,
      },
    }],
  },
  relatedProductsArray: {
    type: [String],
  },
  metaSlug: {
    type: String,
  },
  metaTitle: {
    type: String,
  },
  metaDescription: {
    type: String,
  },
  metaImage: {
    type: {
      path: {
        type: String,
        required: function () {
          // Custom validator to check if metaImage object is present
          return this.metaImage && this.metaImage.hasOwnProperty('path');
        },
      },
      filename: {
        type: String,
        required: function () {
          // Custom validator to check if metaImage object is present
          return this.metaImage && this.metaImage.hasOwnProperty('filename');
        },
      },
    },
    required: false,
  },

  orderCount: {
    type: Number,
    default: 0
  },

  productHidden: {
    type: Boolean,
    required: true
  },

  store: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store', // Reference to the Store model
    required: true,
  },

  created_at: {
    type: Date,
    default: Date.now,
  },
  updated_at: {
    type: Date,
    default: Date.now,
  },
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
