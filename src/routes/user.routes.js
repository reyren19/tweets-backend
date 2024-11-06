import {Router} from 'express';
import { loginUser, logoutUser, registerUser, refreshAccessToken } from "../controllers/user.controller.js";
import { upload } from '../middleware/multer.middleware.js';
import { verifyJWT } from "../middleware/auth.middleware.js";
const router = Router();

// Right before register executes, we use the multer middleware to handle file uploads to server
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1,
        },
        {
            name: "coverImage",
            maxCount: 1,
        },
    ]),
    registerUser);

router.route("/login").post(loginUser);

// PROTECTED ROUTES
router.route("/logout").post(verifyJWT, logoutUser);
router.route("/refresh-token").post(refreshAccessToken);
export default router;