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
const upload = require("./utils/multer.js")

//middlewares

app.set("view engine", "ejs");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());


//get items
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/logout", (req, res) => {
  res.cookie("token", "");
  res.redirect("/login");
});

app.get("/profile", isLoggedIn, async (req, res) => {
  let user = await userModel
    .findOne({ email: req.user.email })
    .populate("posts");
  res.render("profile", { user });
});

app.get("/like/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ id: req.params._id }).populate("user");

  if (post.likes.indexOf(req.user.userid) === -1) {
    post.likes.push(req.user.userid);
  } else {
    post.likes.splice(req.user.userid, 1);
  }

  await post.save();
  res.redirect("/profile");
});

app.get("/love/:id", isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ id: req.params._id }).populate("user");
  if(post.loves.indexOf(req.user.userid) === -1){
    post.loves.push(req.user.userid);
  }else{
    post.loves.splice(req.user.userid, 1);
  }
 await post.save();
  res.redirect("/profile");
});

app.get('/edit/:id', isLoggedIn, async (req,res) => {
  let post = await postModel.findOne({_id: req.params.id})
  res.render('edit', {post})
  
})

app.get('/delete/:id', isLoggedIn, async (req,res)=> {
 let post = await postModel.findOneAndDelete({_id: req.params.id});
 res.redirect('/profile')
} )

app.get('/profile/upload', isLoggedIn, (req,res) => {
  res.render('profileUpload')
})

//post items

app.post("/post", isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email });
  let { content } = req.body;
  let posts = await postModel.create({
    user: user._id,
    content,
  });
  user.posts.push(posts._id);
  await user.save();
  res.redirect("/profile");
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
  let token = jwt.sign({ email, fullname }, process.env.SECRET_JWT_TOKEN);
  res.cookie("token", token);
  res.send("User registered");
});

app.post("/login", async (req, res) => {
  let { email, password } = req.body;
  let user = await userModel.findOne({ email });
  if (!user) return res.status(200).send("Something went wrong ");
  bcrypt.compare(password, user.password, (err, result) => {
    if (result) {
      let token = jwt.sign(
        { email, userid: user._id },
        process.env.SECRET_JWT_TOKEN
      );
      res.cookie("token", token);
      return res.redirect("/profile");
    } else return res.send("Something went wrong");
  });
});

app.post('/update/:id', isLoggedIn, async(req,res) => {
  await postModel.findOneAndUpdate({_id: req.params.id}, {
    content: req.body.content
   })

     res.redirect('/profile')
})

app.post('/upload', isLoggedIn  ,upload.single('image') ,async (req,res)=>{
  let user = await userModel.findOne({email: req.user.email})
  user. profilePic = req.file.filename
  user.save();
  res.redirect('/profile')
})


//self made middleware
function isLoggedIn(req, res, next) {
  if (req.cookies.token === "") {
    res.redirect("/login");
  } else {
    let data = jwt.verify(req.cookies.token, process.env.SECRET_JWT_TOKEN);
    req.user = data;
  }

  next();
}



app.listen(port, () => {
  console.log(`app is listen is listening at port ${port}`);
});
