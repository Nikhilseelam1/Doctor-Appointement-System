const mongoose=require("mongoose")
const initdata=require("./data")
const doctor=require("../models/doctors")
main()
    .then(()=>{
        console.log("mongo connected")
    })
    .catch((err)=>{
        console.log("error",err)
    })

async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/mydb")
}

const Initdb=async()=>{
    await doctor.deleteMany({})
    await doctor.insertMany(initdata.data)
    console.log("database was inializes")
}
Initdb()

