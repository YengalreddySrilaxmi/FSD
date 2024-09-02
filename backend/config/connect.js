const mongoose = require("mongoose");

const connectionOfDb = () => {
  mongoose
    .connect('mongodb://localhost:27017/mydatabase', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      throw new Error(`Could not connect to MongoDB: ${err}`);
    });
};
module.exports = connectionOfDb;