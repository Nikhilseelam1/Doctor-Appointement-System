const mongoose=require("mongoose")
const Schema=mongoose.Schema;

const doctorsSchema=new Schema({
    Name:{
        type:String,
        required:true,
    },
    Specification:{
        type:String,
        required:true,
    },
   Image: {
  type: String,
  default: "/images/default-doctor.jpg" // relative to public folder
}
,
    Age:{
        type:Number,
        min:25,
        max:90,
    },
    email:{
        type:String,
        required:true,
        unique:true,
    },
    password:{
        type:String,
        required:true,
    },
})

const doctors=mongoose.model("doctors",doctorsSchema)
module.exports=doctors