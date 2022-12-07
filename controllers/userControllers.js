const multer = require('multer');
const path = require('path');
const nodemailer = require("nodemailer");
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const hbs = require('nodemailer-express-handlebars');
const saltRounds = 10;

const dotenv=require('dotenv')
dotenv.config();

const userModel = require('../model/User');
const tokenModel = require('../model/token');
const router = require('../route/userRoute');

// file  Upload  code
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join('./public', "/uploads"))
    },
    filename: function (req, file, cb) {
        fileExtension = path.extname(file.originalname);
        cb(null, file.fieldname + "-" + Date.now() + fileExtension)

    }
})

const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
            cb(null, true)
        }
        else {
            cb(null, false);
            cb(new Error("Only png and jpg formet allowed"))
        }
    }
});

let transporter = nodemailer.createTransport({
    service: "gmail",
    port: 587,
    secure: false,
    auth: {
        user:process.env.USER_NAME,
        pass: process.env.MAIL_PASS
    }
});
transporter.use('compile', hbs(
    {
        viewEngine: "nodemailer-express-handlebars",
        viewPath: "views/emailTemplates/",

    }
));
var session;

const uploadSingle = upload.single("image");

const homePage = (req, res) => {
    try {
        session = req.session;
        if (session.username) {
            return res.render("home", { uname: session.username })
        }
        else {
            return res.render("login", { csrf: req.csrfToken() });
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
            return res.render("login", { error: 'Invalid username or password', csrf: req.csrfToken() });
        }
        else {
            return res.render("login", { csrf: req.csrfToken() });
        }
    }
    catch (err) {
        console.log(err);
    }
}
const registerPage = (req, res) => {
    try {
        res.render("register", { csrf: req.csrfToken() });
    }
    catch (err) {
        console.log(err);
    }
}

const saveRegister = (req, res) => {
    try {
        uploadSingle(req, res, (err) => {
            if (err) {
                res.render("register", { error: err.message,csrf: req.csrfToken()})
            }
            else {
                let { email, uname, password } = req.body;
                let name1 = /[a-zA-Z]{5}\s?[0-9]{3}\s?$/;
                let email1 = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
                let pass1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,24}$/;
                let nameErr;
                let emailErr;
                let passErr;
                if (name1.test(uname) && email1.test(email) && pass1.test(password)) {
                    const hash = bcrypt.hashSync(password, saltRounds);
                    userModel.create({ email: email, username: uname, password: hash, image: req.file.filename, status: 0 })
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
                            res.render("register", { error: "User Already Registered", csrf: req.csrfToken() })
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
                    res.render('register', { nameErr: nameErr, passErr: passErr, emailErr: emailErr, csrf: req.csrfToken() })
                }
            }
        })
    }
    catch (err) {
        console.log(err);
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

const welcomePage = (req, res) => {
    try {
        let username = req.session.username;
        if (username) {
            userModel.findOne({ username: username }, (err, data) => {
                if (err) { }
                else {
                    return res.render("welcome", { username: username, path: data.image, successMsg: 'Login successfull' })
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

const postReset = async (req, res) => {
    try {
        let email = req.body.email;
        let user = await userModel.findOne({ email: email });
        if (user) {
            let token = await tokenModel.findOne({ userId: user._id });
            if (token) await tokenModel.deleteOne();
            let restToken = crypto.randomBytes(32).toString("hex");
            const hash = await bcrypt.hash(restToken, Number(saltRounds));
            await new tokenModel({
                userId: user._id,
                token: hash,
                createdAt: Date.now()
            }).save();
            let mailOptions = {
                from: 'sagargolhar46@gmail.com',
                to: email,
                subject: "Rest Link",
                template: 'resettemp',
                context: {
                    token: restToken,
                    id: user._id,
                    username: user.uname
                }
            }
            transporter.sendMail(mailOptions, (err, info) => {
                if (err) { console.log(err) }
                else {
                    return res.render("resetpassword", { succMsg: "Reset Link send to your email" });
                }
            })
        }
        else {
            return res.render("resetpassword", { errMsg: "Email is not exists", csrf: req.csrfToken() });
        }
    }
    catch (err) {
        console.log(err);
    }
}

const resetAccount = (req, res) => {
    try {
        res.render("resetaccount", { csrf: req.csrfToken(), uid: req.query.id, token: req.query.token });
    }
    catch (err) {
        console.log(err);
    }
}

const postresetpassword = async (req, res) => {
    try {
        let { id, token, password, _csrf } = req.body;
        let pass1 = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,24}$/;
        let passErr;
        if (pass1.test(password)) {

            let passToken = await tokenModel.findOne({ userId: id })
            if (!passToken) {
                return res.render("resetaccount", { errMsg: "Pass : Token Expire" })
            }

            const isValid = await bcrypt.compare(token, passToken.token);
            if (!isValid) {
                return res.render("resetaccount", { errMsg: "Pass 1 :Token Expire" })
            }
            const hash = await bcrypt.hash(password, Number(saltRounds));
            await userModel.updateOne({
                _id: id
            }, { $set: { password: hash } }, { new: true }
            );
            return res.redirect("/")
        }
        else {
            if (!pass1.test(password)) {
                passErr = 'password between 8 to 24 characters which contain at least one  uppercase,lowercase'
            }
            res.render("resetaccount", { csrf: _csrf, uid: id, token: token, passErr: passErr });

        }
    }
    catch (err) {
        console.log(err);
    }
}

const activateAccount = async (req, res) => {
    try {
        let id = req.params.id;
        const data = await userModel.findOne({ _id: id })
        if (!data) {
            res.send("Some Thing Went Wrong")
        }
        const d = await userModel.updateOne({ _id: id }, { $set: { status: 1 } })
        if (!d) {
            res.send("Some Thing Went Wrong")
        }
        res.send(`<script>
        alert('Your Account is Activated'); 
        window.location.assign('/login')
        </script>`);

    }

    catch (err) {
        console.log(err);
    }
}

const folderPath='public/uploads'
const downloadFile = async (req, res) => {
    let username = req.session.username;
    if (username) {
        userModel.findOne({ username: username }, (err, data) => {
            if (err) {
                res.send(err)
            }
            else {
                res.download(folderPath + `/${data.image}`, (err) = {
                    if(err) { }
                })
            }
        })
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
    postReset,
    resetAccount,
    postresetpassword,
    activateAccount,
    downloadFile
};