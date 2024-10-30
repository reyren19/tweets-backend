import mongoose, { Schema } from "mongoose";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const userSchema = new Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      index: true,
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required!"],
    },
    avatar: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: "Video",
      },
    ],
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
);

// we need to hash the password before saving it to db, for this we will make use of pre hook that mongoose provides 
// we also cant use arrow function syntax here because arrow functions dont work with this keyword
userSchema.pre("save", async function (next){
  // hash only if password has been modified, else it will hash every time any data is changed
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
})

// creating a method that validates the password using mongoose
userSchema.methods.isValidPassword = async function (password) {
  return bcrypt.compare(password, this.password);
}

// creating methods that will generate access and refresh tokens for auth
userSchema.methods.generateAccessToken = function(){
  // this will return the token when this function is called
  return jwt.sign(
    {
      _id: this._id,
      username: this.username,
      email: this.email,
      fullName: this.fullName
    },
    process.env.JWT_ACCESS_TOKEN,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
  // this will return the refresh token when this function is called
  return jwt.sign(
    {
      _id: this._id
    },
    process.env.JWT_REFRESH_TOKEN,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model('User', userSchema)