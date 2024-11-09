import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadFileToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateRefreshAndAccessTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    // no need to handle !user error here as its already being handled in login route
    const refreshToken = user.generateRefreshToken();
    const accessToken = user.generateAccessToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { refreshToken, accessToken };
  } catch (e) {
    throw new ApiError(500, "Could not generate tokens", e.errors || []);
  }
};

const registerUser = asyncHandler(async (req, res) => {
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

  const { email, fullName, username, password } = req.body;

  // validation
  // NOTE-> If only one param is present we can write arrow functions like this without an implicit return
  if (
    [email, fullName, username, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required!");
  }

  const existingUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existingUser) {
    throw new ApiError(409, "User with same email or username already exists!");
  }

  // multer provides us with a req.files method that allows to check for files
  const avatarLocalFilePath = req.files.avatar[0].path;
  const coverImageLocalFilePath = req.files?.coverImage[0].path;

  // checking if avatar is successfully uploaded
  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar is required");
  }

  // uploading to cloudinary
  const avatar = await uploadFileToCloudinary(avatarLocalFilePath);
  const coverImage = await uploadFileToCloudinary(coverImageLocalFilePath);

  // checking again if avatar has been uploaded to cloudinary successfully
  if (!avatar) {
    throw new ApiError(400, "Avatar is required in cloudinary!");
  }

  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password,
  });

  // check if user is saved successfully
  const checkUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );
  if (!checkUser) {
    throw new ApiError(500, "User not formed! Try again");
  }
  return res
    .status(201)
    .json(new ApiResponse(200, checkUser, "User registered successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  /*
    STEPS FOR LOGIN
    * Get username/email and password from the req.body
    * Check if user exists
    * Check if password correct
    * Generate refresh and access tokens
    * send cookie
    * Send response
     */

  const { username, email, password } = req.body;
  if (!(username || email)) {
    throw new ApiError(400, "Email aur Username is required!");
  }
  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  if (!existingUser) {
    throw new ApiError(404, "User not found!");
  }
  const isValidPassword = await existingUser.isValidPassword(password);

  if (!isValidPassword) {
    throw new ApiError(401, "Password is invalid!");
  }

  const { accessToken, refreshToken } = await generateRefreshAndAccessTokens(
    existingUser._id
  );

  const loggedInUser = await User.findById(existingUser._id).select(
    "-password -refreshToken"
  );

  // use secure to make sure that user cannot modify cookie from frontend
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          // we are sending tokens here too because its good practice as many SPAs store them in the frontend localstorage/db
          user: loggedInUser,
          refreshToken,
          accessToken,
        },
        "User logged in successfully!"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: undefined },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "User logged out successfully!"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies.refreshToken;
    if (!incomingRefreshToken) {
      throw new ApiError(401, "No refresh token provided!");
    }

    // decode the token so that we can extract the ID
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.JWT_REFRESH_TOKEN
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used!");
    }

    const options = {
      httpOnly: true,
      secure: true,
    };

    const { accessToken, newRefreshToken } =
      await generateRefreshAndAccessTokens(user._id);

    return res
      .status(201)
      .cookies("accessToken", accessToken, options)
      .cookies("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken: newRefreshToken,
          },
          "Access Token Refreshed"
        )
      );
  } catch (e) {
    throw new ApiError(401, e?.message || "Invalid Refresh Token");
  }
});

const changeUserPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!user) {
    throw new ApiError(404, "User not found!");
  }
  const isPasswordCorrect = await user.isValidPassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Old password is not correct");
  }
  user.password = newPassword;
  user.save({validateBeforeSave: false});

  return res.status(200).json(201, {}, "Password set successfully!")
});

const changeUserUsername = asyncHandler((async (req,res)=>{
  const {oldUsername, newUsername } = req.body;
  const user = await User.findById(req.user._id);
  if(!user){
    throw new ApiError(404, "User not found!");
  }
  user.username = newUsername;
  user.save({validateBeforeSave: false});
  return res.status(200).json(201, {}, "Username changed successfully!");
}))

const getCurrentUser = asyncHandler((async (req,res)=>{
  const userId = req.user._id;
  const currentUser = await User.findById(userId);
  return res.status(200).json(201, {currentUser}, "Current user found!");
}))
const updateAccountDetails = asyncHandler(async (req,res)=>{
  const {email, fullName} = req.body;
  if(!(email || fullName)){
    throw new ApiError(401, "Email aur Fullname is mandatory!");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email
      }
    },
    // this will return the updated user
    {new: true}
  ).select("-password")
  return res.status(200).json(new ApiResponse(
    201,
    user,
    "Account details updated!"
  ))
})
const updateAvatar = asyncHandler(async (req,res)=>{
  const avatarLocalPath = req.file?.path;
  if(!avatarLocalPath){
    throw new ApiError(400, "Local avatar path not found!")
  }
  const avatar = uploadFileToCloudinary(avatarLocalPath);
  if(!avatar.url){
    throw new ApiError(400, "Avatar not uploaded to cloudinary!");
  }
const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {avatar: avatar.url}
    },
    {new: true}
  )

  return res.status(201).json(new ApiResponse(201, user, "Successfully changed avatar!"));
})
const updateCoverImage = asyncHandler(async (req,res)=>{
  const coverImageLocalPath = req.file?.path;
  if(!coverImageLocalPath){
    throw new ApiError(400, "Local cover path not found!")
  }
  const coverImage = uploadFileToCloudinary(coverImageLocalPath);
  if(!coverImage.url){
    throw new ApiError(400, "Cover file not uploaded to cloudinary!");
  }
  const user =  await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {coverImage: coverImage.url}
    },
    {new: true}
  )

  return res.status(201).json(new ApiResponse(201, user, "Successfully changed coverImage!!"));
})
export { registerUser, loginUser, logoutUser, refreshAccessToken, changeUserPassword, changeUserUsername, getCurrentUser, updateAccountDetails, updateCoverImage, updateAvatar };
