import connectDB from "./db/index.js";
import dotenv from 'dotenv'
import app from "./app.js";
dotenv.config({
    path: './.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT|| 8000, ()=>{
        console.log(`Listening on port ${process.env.PORT}`);
    })
    app.on('error', (error)=>{
        console.error(error);
        throw error;
    })
})
.catch((err)=>{
    console.error("MONGODB CONNECTION ERROR: ", err);
})