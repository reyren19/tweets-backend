import mongoose from "mongoose";

const connectDB = async() =>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}`);
        console.log(`Successfully connected to mongodb! Connection instance, ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("Encountered an error while connecting to DB ", error);
        process.exit(1); // this immediately exits the code even if there are some async operations pending
    }
}

export default connectDB;