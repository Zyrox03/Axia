const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: {
    type: String,
    unique: true,
    required: true,
  },
  storeOwner: {
    ownerID: {
      type: String,
    },
    ownerEmail: {
      type: String,
    }
  },
  captureID: {
    type: String,
    // required: true,
  },
  status: String,
  payerName: {
    type: String,
    // required: true,
  },
  payerEmail: {
    type: String,
    // required: true,
  },
  payerPhone: {
    type: String,
    // required: true,
  },
  paymentMethod: {
    type: String,
    required: true,
  },
  totalAmount: {
    currency_code: String,
    value: Number,
  },
  items: [
    {
      name: String,
      quantity: Number,
      unit_price: Number,
      currency_code: String,

      productImage: String,
      variantsArray: [{ name: String, value: String }],

    },
  ],
  shippingAddress: {
    address_line_1: String,
    admin_area_2: String,
    admin_area_1: String,
    postal_code: String,
    country_code: String,
  }, 
 

  notes: String,
  create_time: Date,
  update_time: Date,
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
