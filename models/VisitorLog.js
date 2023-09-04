const mongoose = require('mongoose');

const VisitorLogSchema = new mongoose.Schema({
    storeID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Store',
    },
    date: Date, // Date for the visitor count
    visitorCount: {
        type: Number,
        default: 0, // Initialize visitor count to 0
      },});

const VisitorLog = mongoose.model('VisitorLog', VisitorLogSchema);

module.exports = VisitorLog;
 