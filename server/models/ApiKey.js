const mongoose = require("mongoose");
const apikeyschema = new mongoose.Schema({
        userId: {
        type: String,
        required: true
    },
    apiKey : {
        required : true ,
        type : String ,
        unique : true
    },

    capacity : {
        type : Number ,
        required : true 

    },

    refillRate : {
        type : Number ,
        required : true 
    }
},
{
    timestamps : true
})


module.exports = mongoose.model("apiKey" , apikeyschema);