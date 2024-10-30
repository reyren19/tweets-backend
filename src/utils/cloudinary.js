import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError';
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadFileToCloudinary = async function (localfilepath) {
    try {
        if (!localfilepath) {
            throw new ApiError(400, "No file path provided for upload");
        }

        // Upload to Cloudinary
        const uploadResult = await cloudinary.uploader.upload(localfilepath, {
            resource_type: "auto", // Auto-detects file type
        });

        console.log(`File uploaded successfully at ${uploadResult.url}`);
        return uploadResult;
    } catch (error) {
        // Remove the file from local storage to prevent inconsistencies
        fs.unlinkSync(localfilepath);

        // Throw an ApiError with specific details
        throw new ApiError(
            error.statusCode || 500,
            error.message || "Failed to upload file to Cloudinary",
            error.errors || []
        );
    }
};

export { uploadFileToCloudinary };
