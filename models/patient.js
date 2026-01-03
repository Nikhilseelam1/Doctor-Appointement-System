const mongoose=require('mongoose')
const Schema=mongoose.Schema;


const patientSchema=new Schema({
    patientName:{
        type:String,
        required:true,
    },
    patientEmail:{
        type:String,
        required:true,
        unique:true,
    },
    patientPassword:{
        type:String,
        required:true,
    },
})
const patients=mongoose.model("patients",patientSchema)
module.exports=patients