require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
// const redis = require("./config/redis");
const { connect } = require("mongoose");
// console.log(process.env.REDIS_URL);
const apiKeyRoutes =require("./routes/apiKeyRoutes");
const protectedRoutes = require("./routes/protectedRoutes");


const app = express() ;

connectDb() ;
app.use(cors(

));
app.use(express.json());

// routes 
app.use("/protected", protectedRoutes);

app.use(
  "/apikeys",
  apiKeyRoutes
);

app.get("/" ,(req,res)=>{
    res.json({
        status : " We are online"
    });
})




const PORT  = process.env.PORT || 5000 ;
app.listen(PORT , ()=> {
    console.log(`We are online at ${PORT}`);
    
})
