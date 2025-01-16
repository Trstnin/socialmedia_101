const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/socialApp");

const userSchema = mongoose.Schema({
  username: String,
  email: String,
  password: String,
  age: Number,
  fullname: String,
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
});

module.exports = mongoose.model("user", userSchema);
