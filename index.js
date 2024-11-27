const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
var bodyParser = require("body-parser");
require('dotenv').config()
const moment = require('moment');

const mongo_uri = process.env.MONGO_URI
mongoose.connect(mongo_uri, { useUnifiedTopology: true });

//schemas
let userSchema = new mongoose.Schema({
  username: String
})
let User = mongoose.model('User', userSchema);


let exerciseSchema = new mongoose.Schema({
  user_id: String,
  description: String,
  duration: Number,
  date: Date
});
let Exercise = mongoose.model('Exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.route('/api/users')
.get(async (req,res) => {
  const result = await User.find({})
  res.json(result)
})
.post(async (req, res) => {
  const user = req.body.username;

  const newUser = new User({
    username: user
  });
  const result = await newUser.save();
  res.json({
    username:user,
    _id:result._id
  });
})

//add exercise
app.post('/api/users/:id/exercises', async (req,res) => {
  const userId = req.params.id;
  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date;

  if (req.body.date === null || req.body.date === undefined || req.body.date === '') {
    date = new Date()
  } else{
    date = new Date(req.body.date);
  }

  const formatedDate = moment(date).utc().format('YYYY-MM-DD');
  const user = await User.findById({_id:userId});

  const newExercise = new Exercise({
    username: user.username,
    user_id: userId,
    description: description,
    duration: duration,
    date: date
  });

  const result = await newExercise.save();
  // res.json({
  //   _id: userId,
  //   username: user.username,
  //   date: formatedDate,
  //   duration: duration,
  //   description: description
  // });
  res.json({
    username: user.username,
    description: description,
    duration: duration,
    date: formatedDate,
    _id: userId,
  });


})

//get exercise
app.get('/api/users/:id/logs', async (req, res) => {
  const userId = req.params.id;
  const { from, to, limit } = req.query;

  const query = { user_id: userId };

  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = new Date(from);
    if (to) query.date.$lte = new Date(to);
  }

  const user = await User.findById({_id:userId});
  const logs = await Exercise.find(query).sort({date: 1}).limit(limit ? parseInt(limit) : undefined);
//67469beed56ace0013aedfd7
//67469becf6c816df558b2e66
  const count =  logs.length

  const formattedLogs = logs.map((log) => ({
    description: log.description,
    duration: log.duration,
    formattedDate: new Date(log.date).toDateString(),
  }));

  res.json({
    _id: userId,
    username: user.username,
    count: count,
    log: formattedLogs
  });
})



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
