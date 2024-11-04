/* this middleware allows us to do some things like-
1) Protect routes
2) Get the access of decoded user fields through req.user in the controller
3) Catch errors if token validation fails
 */

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async (req,res,next)=>{
  // get the token from cookies or auth header replaces Authorization: Bearer token with just the token
  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
  if(!token){
    throw new ApiError(401, "Unauthorized Request");
  }
  // decode the token if found it
  const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_TOKEN);
  const user = await User.findById(decodedToken._id);
  if(!user){
    throw new ApiError(401, "Invalid Access token");
  }
  //adding user to the request so it is accessible in controller
  req.user = user;
  next();
})