import connectDB from "./db/index.js";
import app from "./app.js";
import dotenv from 'dotenv';
dotenv.config();
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