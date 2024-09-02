const express = require("express");
const multer = require("multer");

const authMiddleware = require("../middlewares/authMiddleware");
const {
  registerController,
  loginController,
  postCourseController,
  getAllCoursesUserController,
  deleteCourseController,
  getAllCoursesController,
  enrolledCourseController,
  sendCourseContentController,
  completeSectionController,
  sendAllCoursesUserController,
} = require("../controllers/userControllers");

const router = express.Router();

// Multer configuration for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // Specify the destination folder for uploads
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename for storage
  },
});

// Multer instance for handling file uploads
const upload = multer({ storage: storage });

// Route definitions
router.post("/register", registerController);

router.post("/login", loginController);

router.post(
  "/addcourse",
  authMiddleware,
  upload.array('S_content'), // Handle multiple files with the field name 'S_content'
  postCourseController
);

router.get('/getallcourses', getAllCoursesController);

router.get('/getallcoursesteacher', authMiddleware, getAllCoursesUserController);

router.delete('/deletecourse/:courseid', authMiddleware, deleteCourseController);

router.post('/enrolledcourse/:courseid', authMiddleware, enrolledCourseController);

router.get('/coursecontent/:courseid', authMiddleware, sendCourseContentController);

router.post('/completemodule', authMiddleware, completeSectionController);

router.get('/getallcoursesuser', authMiddleware, sendAllCoursesUserController);

// Error handling middleware
router.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Internal Server Error');
});

module.exports = router;
