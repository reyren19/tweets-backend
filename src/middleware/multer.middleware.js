import multer from "multer"

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // setting the destination of our file storage
      cb(null, './public/temp')
    },
    // generating the filename
    filename: function (req, file, cb) {
      // callback that allows to add a unique suffix to a filename that we have uploaded using multer
      cb(null, file.originalname)
    }
  })
  
export const upload = multer({ storage, })