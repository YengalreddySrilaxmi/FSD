const mongoose = require("mongoose");

// Define the Section Schema
const sectionSchema = mongoose.Schema({
  S_title: { type: String, required: true },
  S_description: { type: String, required: true },
  S_content: [
    {
      filename: { type: String, required: true },
      path: { type: String, required: true },
    },
  ],
});

const courseModel = mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    C_educator: {
      type: String,
      required: [true, "name is required"],
    },
    C_title: {
      type: String,
      required: [true, "C_title is required"],
    },
    C_categories: {
      type: String,
      required: [true, "C_categories: is required"],
    },
    C_price: {
      type: String,
    },
    C_description: {
      type: String,
      required: [true, "C_description: is required"],
    },
    sections: [sectionSchema],
    enrolled: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const courseSchema = mongoose.model("course", courseModel);

module.exports = courseSchema;
