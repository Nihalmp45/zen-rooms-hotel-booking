import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phone:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:['admin','user'],
        default:'user',
        required:true
    },
    address:{
        type:String,
        required:true
    },

},{timestamps:true})

export default mongoose.model("User",userSchema)