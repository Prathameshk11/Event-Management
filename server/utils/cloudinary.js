const cloudinary = require("cloudinary").v2
const dotenv = require("dotenv")

dotenv.config()

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Upload image to Cloudinary
const uploadImage = async (filePath) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: "eventpro",
    })
    return result
  } catch (error) {
    throw new Error(`Error uploading to Cloudinary: ${error.message}`)
  }
}

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId)
    return { success: true }
  } catch (error) {
    throw new Error(`Error deleting from Cloudinary: ${error.message}`)
  }
}

module.exports = {
  uploadImage,
  deleteImage,
}
