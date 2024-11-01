import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // setting the destination of our file storage
      cb(null, '/public/temp')
    },
    // generating the filename
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      // callback that allows to add a unique suffix to a filename that we have uploaded using multer
      cb(null, file.originalname + '-' + uniqueSuffix)
    }
  })
  
export const upload = multer({ storage: storage })