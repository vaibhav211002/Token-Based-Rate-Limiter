require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDb = require("./config/db");
// const redis = require("./config/redis");
const { connect } = require("mongoose");
// console.log(process.env.REDIS_URL);
const apiKeyRoutes =require("./routes/apikeyroutes");
const protectedRoutes = require("./routes/protectedRoutes");


const app = express() ;

connectDb() ;

app.use(
  cors({
    origin: "https://token-based-rate-limiter.vercel.app",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "x-api-key",
    ],
    credentials: true,
  })
);
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
