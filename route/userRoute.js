const express=require('express')
const {homePage,registerPage,saveRegister,loginPage,postLogin,welcomePage,postReset,resetAccount,postresetpassword,activateAccount,downloadFile}=require('../controllers/userControllers')
const router=express.Router()

const csurf=require('csurf');
const path=require('path')
const seceret = "assd123^&*^&*ghghggh";
const oneDay = 1000 * 60 * 60 * 24;
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

const saltRounds = 10;

const csrfMiddleware=csurf({
    cookie:true
})

router.use(cookieParser());
router.use(csrfMiddleware);
router.use(sessions({
    secret: seceret,
    saveUninitialized: true,
    cookie: { maxAge: oneDay },
    resave: false
}))

router.get("/",homePage)

router.get("/login",loginPage)
router.post("/loginPost",postLogin)
router.get("/welcome", welcomePage)

router.get("/register",registerPage)
router.post("/postRegister",saveRegister)

router.get("/resetpassword",(req,res)=>{
    res.render("resetpassword",{csrf:req.csrfToken()});
})

router.post("/postreset",postReset)
router.get("/resetaccount",resetAccount)
router.post("/postresetpassword",postresetpassword)

router.get("/activateaccount/:id",activateAccount)

router.get("/logout", (req, res) => {
 req.session.destroy(); return res.redirect("/");
})

router.get("/download", downloadFile)
module.exports=router;