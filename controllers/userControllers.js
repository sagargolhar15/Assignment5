const multer = require('multer');
const path = require('path');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const hbs = require('nodemailer-express-handlebars');
const saltRounds = 10;

const dotenv = require('dotenv')
dotenv.config();

const userModel = require('../model/User');
const productModel = require('../model/Product');
const cartModel = require('../model/Cart');


let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
        user: process.env.USER_NAME,
        pass: process.env.MAIL_PASS
    }
});
transporter.use('compile', hbs(
    {
        viewEngine: "nodemailer-express-handlebars",
        viewPath: "views/emailTemplates/",

    }
));
const homePage = (req, res) => {
    try {
        session = req.session;
        if (session.username) {
            res.render("welcome", { name: session.username })
        }
        else {
            return res.render("home");
        }
    }
    catch (err) {
        console.log(err);
    }
}
const loginPage = (req, res) => {
    try {
        let auth = req.query.msg ? true : false;
        if (auth) {
            return res.render("login", { error: 'Invalid username or password' });
        }
        else {
            return res.render("login");
        }
    }
    catch (err) {
        console.log(err);
    }
}
const registerPage = (req, res) => {
    try {
        res.render("register");
    }
    catch (err) {
        console.log(err);
    }
}

const saveRegister = (req, res) => {

    let { email, uname, password, mobile, address } = req.body;
    let name1 = /[a-zA-Z]{5}\s?[0-9]{3}\s?$/;
    let email1 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    let pass1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,24}$/;
    let address1 = /^[\w-_.]*$/;
    let mobile1 = /^[789]\d{9}$/;
    let mobileErr;
    let addressErr;
    let nameErr;
    let emailErr;
    let passErr;
    if (name1.test(uname) && email1.test(email) && pass1.test(password) && mobile1.test(mobile) && address1.test(address)) {
        const hash = bcrypt.hashSync(password, saltRounds);
        userModel.create({ email: email, username: uname, password: hash, mobile: mobile, address: address, status: 0 })
            .then(data => {
                let mailOptions = {
                    from: 'sagargolhar46@gmail.com',
                    to: email,
                    subject: "Activation Account",
                    template: 'mail',
                    context: {
                        username: uname,
                        id: data._id
                    }
                }
                transporter.sendMail(mailOptions, (err, info) => {
                    if (err) { console.log(err) }
                    else {
                        res.render('register', { successMsg: 'Register Successfully' })
                    }
                })
            })
            .catch(err => {
                res.render("register", { error: "User Already Registered", })
            })
    }
    else {
        if (!name1.test(uname)) {
            nameErr = 'first 5 digits are alphabets and next 3 digits are numeric   ';
        }
        if (!email1.test(email)) {
            emailErr = 'Email address is not valid';
        }
        if (!pass1.test(password)) {
            passErr = 'password between 8 to 24 characters which contain at least one  uppercase,lowercase'
        }
        if (!mobile1.test(mobile)) {
            mobileErr = 'Mobile No. is not valid'
        }
        if (!address1.test(address)) {
            addressErr = 'address is not valid'
        }
        res.render('register', { nameErr: nameErr, passErr: passErr, emailErr: emailErr, mobileErr: mobileErr, addressErr: addressErr })
    }
}

const postLogin = (req, res) => {
    try {
        let { uname, password } = req.body;
        userModel.findOne({ username: uname }, (err, data) => {
            if (err) {
                return res.redirect("/login?msg=fail");
            }
            else if (data == null) {
                return res.redirect("/login?msg=fail");
            }
            else {
                // console.log(data.pass)
                if (bcrypt.compareSync(password, data.password)) {
                    session = req.session;
                    session.username = uname;
                    console.log(req.session);
                    return res.redirect("/welcome");
                }
                else {
                    return res.redirect("/login?msg=fail");
                }
            }
        })
    }
    catch (err) {
        console.log(err);
    }
}

const welcomePage = async (req, res) => {
    try {
        let username = req.session.username;
        if (username) {
            userModel.findOne({ username: username }, (err, data) => {
                if (err) { }
                else {
                    cartModel.find({ user_id: data._id }, (err, cartData) => {
                        if (err) {
                            productModel.find({}, (err, data) => {
                                res.render("welcome", { name: username, data: data.map(data => data.toJSON()), cart_tot: 0 })
                            })
                        }
                        productModel.find({}, (err, data) => {
                            res.render("welcome", { name: username, data: data.map(data => data.toJSON()), cart_tot: cartData.length })
                        })
                    })
                }
            })
        }
        else {
            return res.redirect("/login");
        }
    }
    catch (err) {
        console.log(err);
    }
}
const addtocart = async (req, res) => {
    try {
        if (req.session.username) {

            let id = req.params.id;
            let userData = await userModel.findOne({ username: req.session.username }, { _id: 1 })
            let productData = await productModel.findOne({ _id: id })
            let cartFind = await cartModel.findOne({ product_id: id })
            if (cartFind == null) {
                let cart = await cartModel.create({ user_id: userData._id, product_id: id, image: productData.image, name: productData.name, price: productData.price })
                return res.redirect("/welcome");
            }
            else {
                // let cart = await cartModel.updateOne({ user_id: userData._id, product_id: id },{$inc:{qty:1}})
                // console.log(cart);
                return res.redirect("/welcome");
            }
        }
        else {
            return res.redirect("/login");

        }

    }
    catch (err) {
        console.log(err);
    }
}
const cart = async (req, res) => {
    try {
        if (req.session.username) {
            let userData = await userModel.findOne({ username: req.session.username }, { _id: 1 })
            cartModel.find({ user_id: userData._id }, (err, data) => {
                let cartData = data.map(data => data.toJSON());
                let sum = 0;
                for (let i = 0; i < cartData.length; i++) {
                    sum += cartData[i].qty * cartData[i].price;
                    cartData[i].total = cartData[i].qty * cartData[i].price;
                }
                res.render("cartpage", { data: cartData, name: req.session.username, sum: sum})
            })
        }
        else {
            return res.redirect("/login");

        }
    }
    catch (err) {
        console.log(err);
    }
}
const changeQtyByAjax = async (req, res) => {
    try {
        if (req.session.username) {
            const { p_id, cart_id, operation } = req.body
            if (operation == 'plus') {
                let cart = await cartModel.updateOne({ _id: cart_id, product_id: p_id }, { $inc: { qty: 1 } })
                let cartFindQty = await cartModel.find({ _id: cart_id, product_id: p_id }, { qty: 1 })
                ret = {
                    qty: cartFindQty[0].qty,
                    'status': 'successs'
                };
                res.send(ret);
            }
            if (operation == 'minus') {
                let cart = await cartModel.updateOne({ _id: cart_id, product_id: p_id }, { $inc: { qty: -1 } })
                let cartFindQty = await cartModel.find({ _id: cart_id, product_id: p_id }, { qty: 1 })
                if (cartFindQty[0].qty == 0) {
                    await cartModel.deleteOne({ _id: cart_id, product_id: p_id })
                    ret = {
                        qty: cartFindQty[0].qty,
                        'status': 'deleted'
                    };
                    res.send(ret);
                }
                else {
                    ret = {
                        qty: cartFindQty[0].qty,
                        'status': 'successs'
                    };
                    res.send(ret);
                }
            }
        }
        else {
            return res.redirect("/login");

        }
    }
    catch (err) {
        console.log(err);
    }
}
const deletecart = async (req, res) => {
    let cartID = req.params.id;
    await cartModel.deleteOne({ _id: cartID })
    res.redirect('/cart')
}

const checkout = async (req, res) => {
    try {
        if (req.session.username) {
            let userData = await userModel.findOne({ username: req.session.username }, { _id: 1 })
            cartModel.find({ user_id: userData._id }, (err, data) => {
                let sum = 0;
                for (let i = 0; i < data.length; i++) {
                    sum += data[i].qty * data[i].price;
                }
                res.render("checkout", { sum: sum, name: req.session.username })
            })
        }
        else {
            return res.redirect("/login");
        }
    }
    catch (err) {
        console.log(err);
    }
}
const postcheckout = async (req, res) => {
    try {
        if (req.session.username) {
            let userData = await userModel.findOne({ username: req.session.username }, { _id: 1 })
            await cartModel.deleteMany({ user_id: userData._id })
            res.render('orderplace', { name: req.session.username, successMsg: "Order place successfully" })
        }
        else {
            return res.redirect("/login");
        }
    }
    catch (err) {
        console.log(err);
    }
}

module.exports =
{
    homePage,
    registerPage,
    saveRegister,
    loginPage,
    postLogin,
    welcomePage,
    addtocart,
    cart,
    changeQtyByAjax,
    deletecart,
    checkout,
    postcheckout
};