const dotenv=require('dotenv')
dotenv.config();

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_DB_URL)
    .then(res => console.log("MongoDB Connected"))
    .catch(err => console.log("Error : " + err));
