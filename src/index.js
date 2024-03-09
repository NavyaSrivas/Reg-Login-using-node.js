const express = require('express'); //importing express
const path = require("path"); //import build-in path module
const bcrypt = require('bcrypt');
const collection =require("./config");
const bodyParser = require('body-parser');
const request = require('request');

const app = express(); // create instance of express framework.
//Convert data into json format.
app.use(express.json()); // It allow app to understand JSON dataset in the req. body.

app.use(express.urlencoded({extended: false}));

// Set EJS (Embedded JavaScript) as view engine.
app.set('views', path.join(__dirname,'./views')); // views is a folder
app.set('view engine', 'ejs');

// static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", (req, res)=>{
  res.render('login');
})

app.get("/signup", (req, res)=>{
  res.render('signup');
})

//Register user
app.post("/signup", async(req, res)=>{
  const data={
    name: req.body.username,
    password: req.body.password
  } 
  const secretKey = "6LewCIgpAAAAAC0YJlAGXho1DaSpVfn9vlLbE9Jn";
  const { 'g-recaptcha-response': captchaResponse } = req.body;

  const verifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${secretKey}&response=${captchaResponse}`;

  request(verifyUrl, (error, response, body) => {
      body = JSON.parse(body);
      if (body.success !== undefined && !body.success) {
          // reCAPTCHA validation failed
          res.send('Failed to verify reCAPTCHA');
      } else {
          // reCAPTCHA validation passed, proceed with sign up process...
          res.render("home");
      }
  });

  //check user already exists
  const existinguser = await collection.findOne({name:data.name});
  if(existinguser){
    res.send("User already exists. Please try another name");
  }
  else{
    // hashing password using bcrypt
      const saltRounds = 10; // Number of salt rounds for bcrypt
      const hashedPassword = await bcrypt.hash(data.password, saltRounds);

      data.password = hashedPassword; // Replace the original password with the hashed one

      const userdata = await collection.insertMany(data);
      console.log(userdata);
  }
})
// Login user
app.post("/login", async(req, res)=>{
  try {
    const check = await collection.findOne({ name: req.body.username });
    if(!check){
        res.send("User name cannot found");
      }
    // Compare the hashed password from the database with the plaintext password
    const isPasswordMatch = await bcrypt.compare(req.body.password, check.password);
    if(!isPasswordMatch) {
        res.send("wrong Password");
      }
    else{
        res.render("home");
      }
    }
    catch{
      res.send("wrong Details");
    }
});
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


const port = 5002;
app.listen(port, ()=>{
  console.log(`Server running on the port: ${port}`);
})
