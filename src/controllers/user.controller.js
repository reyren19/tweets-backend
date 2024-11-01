import {asyncHandler} from '../utils/asyncHandler.js'
import {ApiError} from '../utils/ApiError.js'
import {User} from '../models/user.models.js'
import {uploadFileToCloudinary} from '../utils/cloudinary.js'
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req,res)=>{
    /* 
        1. Get the email, username and password and other fields required from the user/frontend
        2. Validation-fields should not be empty
        3. Check if user already exists - username/email
        4. Check for images,avatar
        5. Upload them to cloudinary,avatar
        6. Create User object-create entry in db
        7. Remove password and refresh token from response
        8. Send Response to frontend    
    */
    const {email, fullName, username, password} = req.body;
    console.log("email", email);

    // validation
    // NOTE-> If only one param is present we can write arrow functions like this without an implicit return
    if([email,fullName,username,password].some(field=>field?.trim()==="")){
        throw new ApiError(400, "All fields are required!");
    }

    const existingUser = await User.findOne({
        $or:[{username}, {email}]
    })

    if(existingUser){
        throw new ApiError(409, "User with same email or username already exists!")
    }

    // multer provides us with a req.files method that allows to check for files
    const avatarLocalFilePath = req.files.avatar[0].path;
    const coverImageLocalFilePath = req.files?.coverImage[0].path;

    // checking if avatar is successfully uploaded
    if(!avatarLocalFilePath){
        throw new ApiError(400, "Avatar is required");
    }

    // uploading to cloudinary
    const avatar = await uploadFileToCloudinary(avatarLocalFilePath);
    const coverImage = await uploadFileToCloudinary(coverImageLocalFilePath);

    // checking again if avatar has been uploaded to cloudinary successfully
    if(!avatar){
        throw new ApiError(400, "Avatar is required in cloudinary!");
    }

    const user = await User.create({
        fullName,
        email,
        username: username.toLowerCase(),
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        password,
    })

    // check if user is saved successfully
    const checkUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    if(!checkUser){
        throw new ApiError(500, "User not formed! Try again");
    }
    return res.status(201).json(
      new ApiResponse(200, checkUser, "User registered successfully.")
    )
})

const loginUser = asyncHandler(async(req,res)=>{
    res.status(200).json({message: "ok"});
})

export {registerUser,loginUser}