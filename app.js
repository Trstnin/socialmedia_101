const express = require("express");
const app = express();
require("dotenv").config();

const port = process.env.PORT || 3000;

const userModel = require("./models/user.model.js");
const postModel = require("./models/post.model.js");
const cookieParser = require("cookie-parser");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/create", async (req, res) => {
  let { fullname, email, age, password, username } = req.body;
  const Createduser = await userModel.findOne({ email });
  if (Createduser) return res.status(500).send("User already registered");

  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let Newuser = await userModel.create({
        fullname,
        username,
        password: hash,
        email,
        age,
      });
    });
  });
  let token = jwt.sign({ email }, process.env.SECRET_JWT_TOKEN);
  res.cookie("token", token);
  res.send("User registered");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(200).send("Something went wrong ");
  bcrypt.compare(password, user.password, (err, result) => {
    if (result)
      {
      let token = jwt.sign({ email }, process.env.SECRET_JWT_TOKEN);
      res.cookie("token", token);
      return res.redirect("/profile");
      } 

    else return res.send("Something went wrong");
  });
});

app.get('/logout', (req,res) => {
   res.cookie('token', '')
   res.redirect('/login')
})

app.get('/profile', isLoggedIn ,async (req ,res) => {
 let user =   await userModel.findOne({email: req.user.email})
 console.log(user)
 res.render('profile', {user})
} )

function isLoggedIn(req,res,next){
    if(req.cookies.token === ""){
      res.redirect('/login')
    }else {
     let data =  jwt.verify(req.cookies.token , process.env.SECRET_JWT_TOKEN);
     req.user = data
    }
  
  next()
}

app.listen(port, () => {
  console.log(`app is listen is listening at port ${port}`);
});
