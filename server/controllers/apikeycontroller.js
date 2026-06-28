const ApiKey = require("../models/ApiKey")

const generateApiKey = require("../utils/generateApiKey")


const createApikey = async(req , res ) =>{
    try{
        
        let {capacity , tokenInterval} = req.body ;
        // console.log(capacity+  " " + refillRate + " " + req.body);
        
        if (!capacity || !tokenInterval) {
            return res.status(400).json({
                message: "capacity and refillRate are required"
            });
        }
         let refillRate = 1/tokenInterval;
        const apiKey = generateApiKey();
        const newkey = await ApiKey.create({
            userId : req.user.id,
            apiKey , 
            capacity ,
            refillRate 
        });

        res.status(201).json(newkey)
    }catch(error){
        console.log(error);
        res.status(500).json({
            message : error.message 
        })
        
    }
};

module.exports = {createApikey}