// dependencies

const express=require("express")
const app=express()
const mongoose=require("mongoose")
const bcrypt = require('bcryptjs');
const doctor=require("./models/doctors.js")
const path=require("path")
const ejs_mate=require("ejs-mate")
const { url } = require("inspector")
const patients=require("./models/patient.js")
const methodoverride=require("method-override")
const { log } = require("console")
const Expresserror=require('./utils/expresserror.js')
const wrapsync=require("./utils/wrapsync.js")
const appointements = require("./models/appointments.js")
app.set("view engine","ejs")
app.set("views",path.join(__dirname,"views"))
app.engine("ejs",ejs_mate)
app.use(express.static(path.join(__dirname,"/public")));
app.use(express.urlencoded({extended:true}))
app.use(express.json());
const session =require("express-session");

app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: true
}));
main()
    .then(() => console.log(" MongoDB Connected"))
    .catch(err => console.log(" Error: ", err));
async function main(){
    await mongoose.connect("mongodb://127.0.0.1:27017/mydb")
}


app.get("/",(req,res)=>{
    res.send("app is running")
})
// IsPatientRegister
function is_patient_logged_in(req, res, next) {
    if (!req.session.patientId) {
        req.session.redirectTo = req.originalUrl;
        return res.redirect("/patient/new");
    }
    next();
}

// register for patients
app.get("/patient/new",(req,res)=>{
    res.render("patients/patientregister.ejs")
})
app.post("/patient/register",async(req,res)=>{
    try {
        const {patientName,patientEmail,patientPassword}=req.body;
        const hashpassword=await bcrypt.hash(patientPassword,10);
        const newpatient=new patients({
            patientName,
            patientEmail,
            patientPassword:hashpassword,
            })
        await newpatient.save();
        req.session.patientId = newpatient._id;

        const redirectTo = req.session.redirectTo || "/doctors";
        delete req.session.redirectTo;
        res.redirect(redirectTo)
    } catch (error) {
        console.log(error);
        res.send(error)
        // res.send(500).status("error")
    }
    
})
// login for patients
app.get("/p/login",(req,res)=>{
    res.render("patients/patientlogin");
})
app.post("/patient/login",async(req,res)=>{
    try {
        const {patientEmail,patientPassword}=req.body
        const found_patient = await patients.findOne({ patientEmail })
        if(!found_patient){
            return res.send(500).status("patient.not found")
        }
        const validpassword=await bcrypt.compare(patientPassword,found_patient.patientPassword)
        if(!validpassword){
            return res.send(500).status("invalid password")
        }
        const appointement = await appointements
        .find({ patientEmail })
        .populate("doctorId"); 
        res.render("patients/patientdashboard.ejs",{appointement,found_patient})
    } catch (error) {
        console.log(error);
        res.send(error)
        // res.send(500).status("error");
    }
})
// cancel for appointement
app.post("/patient/cancel/:id",async(req,res)=>{
    const appid=req.params.id;
    await appointements.findByIdAndDelete(appid);
    res.redirect("/doctors")
})
// accept route
app.post("/appointements/:id/accept/:d_id",async(req,res)=>{
    let {id,d_id}=req.params;
    const appointement=await appointements.findByIdAndUpdate(id,{status:"Accepted"})
    res.redirect(`/doctors/${d_id}/appointements`)
})
// reject route
app.post("/appointements/:id/reject/:d_id",async(req,res)=>{
    let {id,d_id}=req.params;
    const appointement=await appointements.findByIdAndUpdate(id,{status:"Rejected"})
    res.redirect(`/doctors/${d_id}/appointements`)
})
// login for doctors
app.get("/doctors/login",(req,res)=>{
    res.render("doctors/doctorlogin.ejs")
})
app.post("/doctors/login",async(req,res)=>{
    let {email,password}=req.body.doctor;
    try {
        const doctor_det = await doctor.findOne({ email});
        const id=doctor_det._id;
        if (!doctor_det) {
            return res.status(400).send("doctor not found")
        }
        const validpassword=await bcrypt.compare(password,doctor_det.password)
        if(!validpassword) return res.send("invalid password")
        const appointement=await appointements.find({doctorId:id})
        res.render("doctors/appointements",{doctor_det,appointement})
    } catch (error) {
        console.log(err);
        res.send(error)
        // res.status(500).send("server error")
    }
    
})
// dashboard route
app.get("/doctors/:id/appointements",async(req,res)=>{
    try{
    let {id}=req.params;
    const doctor_det=await doctor.findById(id);
    const appointement =await appointements.find({doctorId:id});
    res.render("doctors/appointements.ejs",{doctor_det,appointement})
    }
    catch (err){
        console.log(err);
        res.status(500).send("error while fetching details please try again")
    }
   
})
// book appointement route
app.get("/doctors/:id/book",async(req,res)=>{
    let {id}=req.params;
    const doctors=await doctor.findById(id)
    res.render("doctors/book.ejs",{doctors});
})
app.post("/doctors/:id/book",async(req,res)=>{
     try {
        const doctorId = req.params.id;
        const { patientName, patientEmail,patientPassword, patientPhone, date, time} = req.body;
        const newAppointment = new appointements({
            doctorId,
            patientName,
            patientEmail,
            patientPassword,
            patientPhone,
            date,
            time,
        });
        await newAppointment.save()
        res.redirect("/doctors")
        // res.redirect(`/doctors/${doctorId}`)
    } catch (err) {
        console.error(err);
        res.status(500).send("error booking appointment please try again.");
    }
})
// search for doctor
app.get('/doctors/search', async (req, res) => {
    try {
        const { spec } = req.query ;
        let filter = {};
        if (spec) {
            filter.Specification = { $regex: spec, $options: "i" };
        }
        const alldoctors = await doctor.find(filter);
        res.render('doctors/doctorSearch', { alldoctors, spec })
    } catch (err) {
        console.error(err);
        res.status(500).send("Server error");
    }
});

// index route
app.get("/doctors",async(req,res)=>{
    const alldoctors=await doctor.find({})
    res.render("doctors/index.ejs",{alldoctors})
})
// new route
app.get("/doctors/new",(req,res)=>{
    res.render("doctors/new.ejs")
})
// show route
app.get("/doctors/:id",is_patient_logged_in,async(req,res)=>{
    let {id}=req.params;
    const doctor_d=await doctor.findById(id)
    res.render("doctors/show.ejs",{doctor_d})
})
// update route
app.post("/doctors/:id",async(req,res)=>{
    let {id}=req.params;
    await doctor.findByIdAndUpdate(id,{...req.body.doctor})
    res.redirect("/doctors")
})
// delete route
app.post("/doctors/:id/delete",async(req,res)=>{
    let {id}=req.params;
    await doctor.findByIdAndDelete(id);
    res.redirect("/doctors")
})
// create route
app.post("/doctors",wrapsync(async(req,res)=>{
    const { Name, Specification, Image, Age, email, password } = req.body.doctor;
    const hashpassword=await bcrypt.hash(password,10);
    const newDoctor=new doctor({
        Name,
        Specification,
        Image,    
        Age,
        email,
        password: hashpassword,
    }
    )
    await newDoctor.save();
    res.redirect("/doctors")
}))
// edit route
app.get("/doctors/:id/edit",async(req,res)=>{
    let {id}=req.params;
    const edit_doctor=await doctor.findById(id)
    res.render("doctors/edit.ejs",{edit_doctor})
})
// change password to hash value
async function hashpass() {
    const alldocs=await doctor.find();
    try {
        for(let doc of alldocs){
            if(!doc.password.startsWith("$2b$")){
                const hashed=await bcrypt.hash(doc.password,10);
                doc.password=hashed;
                await doc.save();
            }
        }
        console.log("successfully changed")
    } catch (error) {
        console.log("error");
    }
}
// hashpass();  function call
// error handler
app.use((err,req,res,next)=>{
    let{statuscode=505,message="something went wrong"}=err;
    res.status(statuscode).send(message);
})
//  port run in local host 8080
app.listen(8080,()=>{
    console.log("server is running on port 8080")
})