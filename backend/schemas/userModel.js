// userModel.js

const mongoose = require('mongoose');
 
// Define the user schema
const userModel = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'name is required'],
      set: function (value) {
        return value.charAt(0).toUpperCase() + value.slice(1);
      },
    },
    email: {
      type: String,
      required: [true, 'email is required'],
    },
    password: {
      type: String,
      required: [true, 'password is required'],
    },
    type: {
      type: String,
      required: [true, 'type is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Create and export the user model
const userSchema = mongoose.model('user', userModel);

// Establish database connection
 
module.exports = userSchema;
