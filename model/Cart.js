const mongoose = require('mongoose');
const cartSchema = new mongoose.Schema(
    {
    user_id:
    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ,
    product_id:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    qty:{
        type:Number,
        default:1
    },
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
module.exports = mongoose.model("cart", cartSchema);