const mongoose=require("mongoose")
const Schema=mongoose.Schema

const AppointementSchema=new Schema({
    doctorId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"doctors",
    },
    patientName:{
        type:String,
        required:true,
    },
    patientEmail:{
        type:String,
        required:true,
        unique:true,
    },
    patientPhone:{
        type:String,
        required:true,
    },
    date:{
        type:Date,
        required:true,
    },
    time:{
        type:String,
        required:true,
    },
    status:{
        type:String,
        enum:["Pending","Accepted","Rejected"],
        default:"Pending",
    }
})

const appointements=mongoose.model("appointements",AppointementSchema)
module.exports=appointements