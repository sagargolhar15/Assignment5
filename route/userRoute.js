const express=require('express')
const {homePage,registerPage,saveRegister,loginPage,postLogin,welcomePage,addtocart,cart,checkout,changeQtyByAjax,deletecart,postcheckout}=require('../controllers/userControllers')
const router=express.Router()

const csurf=require('csurf');
const path=require('path')
const seceret = "assd123^&*^&*ghghggh";
const oneDay = 1000 * 60 * 60 * 24;
const cookieParser = require('cookie-parser');
const sessions = require('express-session');

const saltRounds = 10;


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
    res.render("resetpassword");
})

router.get("/addtocart/:id",addtocart)
router.get("/cart",cart)
router.post("/changeQtyByAjax",changeQtyByAjax)

router.get('/deletecart/:id',deletecart)
router.get('/menu',(req,res)=>{
    res.redirect('/welcome')
})

router.get("/checkout",checkout)

router.post('/postcheckout',postcheckout)
router.get("/logout", (req, res) => {
 req.session.destroy(); return res.redirect("/");
})


module.exports=router;