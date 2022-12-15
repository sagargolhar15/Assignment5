const express = require('express');
const app = express();
const PORT = 2000;
// ejs templete engine
const exphbs = require('express-handlebars');
const hbs = require('hbs')
hbs.registerHelper('multiply', function (a,b) {
    return a*b;
})
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars');
app.set('views', './views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static(__dirname +'/public'));

// database connection
require('./db/db-config')
const userRoute=require('./route/userRoute')
app.use("/",userRoute)

app.listen(PORT, (err) => {
    if (err) throw err;
    else console.log(`the server run on the ${PORT}`)
})
