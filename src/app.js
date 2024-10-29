import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser';
const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN
}));
app.use(express.json({
    limit: '16kb',
}))

// this helps parse strings like name?=Raunak%20Raj%20 and converts it to a json object that is accessible using req.body
app.use(express.urlencoded({
    extended: true
}));

// this just states that my static files (images/videos etc) are being served in public folder
app.use(express.static("public"));

app.use(cookieParser());

export default app