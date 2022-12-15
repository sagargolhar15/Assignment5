const mongoose=require('mongoose');
const userSchema=new mongoose.Schema({
    image:{
        type:String,
        unique:true,
        required:true,
    },
    name:{
        type:String,
        unique:true,
        required:true,
    },
    price:{
        type:Number,
        required:true
    }
});
module.exports=mongoose.model("product",userSchema);