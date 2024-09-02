const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require('dotenv').config();

const userSchema = require("../schemas/userModel");
const courseSchema = require("../schemas/courseModel");
const enrolledCourseSchema = require("../schemas/enrolledCourseModel");
const coursePaymentSchema = require("../schemas/coursePaymentModel");

const registerController = async (req, res) => {
  try {
    const existsUser = await userSchema.findOne({ email: req.body.email });
    if (existsUser) {
      return res.status(200).send({ message: "User already exists", success: false });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    req.body.password = hashedPassword;

    const newUser = new userSchema(req.body);
    await newUser.save();

    return res.status(201).send({ message: "Register Success", success: true });
  } catch (error) {
    console.error("Error in registering user:", error);
    return res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const loginController = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.body.email });
    if (!user) {
      return res.status(200).send({ message: "User not found", success: false });
    }

    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res.status(200).send({ message: "Invalid email or password", success: false });
    }

    const secretKey = process.env.JWT_KEY;
    if (!secretKey) {
      throw new Error('JWT secret key is not defined');
    }

    const token = jwt.sign({ id: user._id }, secretKey, { expiresIn: "1d" });
    user.password = undefined;

    return res.status(200).send({
      message: "Login successful",
      success: true,
      token,
      userData: user,
    });
  } catch (error) {
    console.error("Error in login:", error);
    return res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const getAllCoursesController = async (req, res) => {
  try {
    const allCourses = await courseSchema.find();
    if (!allCourses || allCourses.length === 0) {
      return res.status(404).send({ success: false, message: "No Courses Found" });
    }

    return res.status(200).send({
      success: true,
      data: allCourses,
    });
  } catch (error) {
    console.error("Error in fetching courses:", error);
    res.status(500).send({ success: false, message: "Failed to fetch courses" });
  }
};


 
const postCourseController = async (req, res) => {
  try {
    console.log("Request Body:", req.body); // Log the request body
    console.log("Uploaded Files:", req.files); // Log the uploaded files

    const {
      userId,
      C_educator,
      C_title,
      C_categories,
      C_price,
      C_description,
    } = req.body;

    // Validate input data
    if (!userId || !C_title || !C_categories || !C_description) {
      console.error("Incomplete course data");
      return res.status(400).send({ success: false, message: "Incomplete course data" });
    }

    // Handle sections from the request body
    let { S_title, S_description } = req.body;

    // Ensure S_title and S_description are arrays
    if (!Array.isArray(S_title)) S_title = [S_title];
    if (!Array.isArray(S_description)) S_description = [S_description];

    // Check if files were uploaded
    let S_content = [];
    if (req.files && req.files.length > 0) {
      S_content = req.files.map((file) => ({
        filename: file.filename,
        path: `/uploads/${file.filename}`,
      }));
    }

    // Validate sections data length
    if (S_title.length !== S_description.length) {
      console.error("Invalid sections data");
      return res.status(400).send({ success: false, message: "Invalid sections data" });
    }

    // Construct course sections
    const sections = S_title.map((title, index) => ({
      S_title: title,
      S_description: S_description[index],
      S_content: S_content[index] || null, // Attach corresponding file object if available
    }));

    // Create new course instance
    const course = new courseSchema({
      userId,
      C_educator,
      C_title,
      C_categories,
      C_price: C_price === '0' ? "free" : C_price,
      C_description,
      sections,
    });

    // Save course to database
    await course.save();

    res.status(201).send({ success: true, message: "Course created successfully" });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).send({ success: false, message: "Failed to create course" });
  }
};

 

 

 

const getAllCoursesUserController = async (req, res) => {
  try {
    const allCourses = await courseSchema.find({ userId: req.body.userId });
    if (!allCourses || allCourses.length === 0) {
      return res.status(404).send({ success: false, message: "No Courses Found" });
    }

    return res.status(200).send({
      success: true,
      message: "All Courses Fetched Successfully",
      data: allCourses,
    });
  } catch (error) {
    console.error("Error in fetching courses:", error);
    res.status(500).send({ success: false, message: "Failed to fetch courses" });
  }
};

const deleteCourseController = async (req, res) => {
  const { courseid } = req.params;
  try {
    const course = await courseSchema.findByIdAndDelete({ _id: courseid });

    if (course) {
      res.status(200).send({ success: true, message: "Course deleted successfully" });
    } else {
      res.status(404).send({ success: false, message: "Course not found" });
    }
  } catch (error) {
    console.error("Error in deleting course:", error);
    res.status(500).send({ success: false, message: "Failed to delete course" });
  }
};

const enrolledCourseController = async (req, res) => {
  const { courseid } = req.params;
  const { userId } = req.body;
  try {
    const course = await courseSchema.findById(courseid);
    if (!course) {
      return res.status(404).send({ success: false, message: "Course Not Found!" });
    }

    const course_Length = course.sections.length;

    const enrolledCourse = await enrolledCourseSchema.findOne({
      courseId: courseid,
      userId,
      course_Length,
    });

    if (!enrolledCourse) {
      const enrolledCourseInstance = new enrolledCourseSchema({
        courseId: courseid,
        userId,
        course_Length,
      });

      const coursePayment = new coursePaymentSchema({
        userId,
        courseId: courseid,
        ...req.body,
      });

      await coursePayment.save();
      await enrolledCourseInstance.save();

      course.enrolled += 1;
      await course.save();

      res.status(200).send({
        success: true,
        message: "Enroll Successfully",
        course: { id: course._id, Title: course.C_title },
      });
    } else {
      res.status(200).send({
        success: false,
        message: "You are already enrolled in this Course!",
        course: { id: course._id, Title: course.C_title },
      });
    }
  } catch (error) {
    console.error("Error in enrolling course:", error);
    res.status(500).send({ success: false, message: "Failed to enroll in the course" });
  }
};

const sendCourseContentController = async (req, res) => {
  const { courseid } = req.params;
  try {
    const course = await courseSchema.findById(courseid);
    if (!course) {
      return res.status(404).send({ success: false, message: "No such course found" });
    }

    const user = await enrolledCourseSchema.findOne({
      userId: req.body.userId,
      courseId: courseid,
    });

    if (!user) {
      return res.status(404).send({ success: false, message: "User not found" });
    } else {
      return res.status(200).send({
        success: true,
        courseContent: course.sections,
        completeModule: user.progress,
        certificateData: user,
      });
    }
  } catch (error) {
    console.error("An error occurred:", error);
    return res.status(500).send({ success: false, message: "Internal server error" });
  }
};

const completeSectionController = async (req, res) => {
  const { courseId, sectionId } = req.body;
  try {
    const enrolledCourseContent = await enrolledCourseSchema.findOne({
      courseId,
      userId: req.body.userId,
    });

    if (!enrolledCourseContent) {
      return res.status(400).send({ message: "User is not enrolled in the course" });
    }

    const updatedProgress = enrolledCourseContent.progress || [];
    updatedProgress.push({ sectionId });

    await enrolledCourseSchema.findOneAndUpdate(
      { _id: enrolledCourseContent._id },
      { progress: updatedProgress },
      { new: true }
    );

    res.status(200).send({ message: "Section completed successfully" });
  } catch (error) {
    console.error("Error in completing section:", error);
    res.status(500).send({ message: "Internal server error" });
  }
};

const sendAllCoursesUserController = async (req, res) => {
  const { userId } = req.body;
  try {
    const enrolledCourses = await enrolledCourseSchema.find({ userId });

    const coursesDetails = await Promise.all(
      enrolledCourses.map(async (enrolledCourse) => {
        const courseDetails = await courseSchema.findOne({ _id: enrolledCourse.courseId });
        return courseDetails;
      })
    );

    return res.status(200).send({
      success: true,
      data: coursesDetails.filter(course => course !== null),
    });
  } catch (error) {
    console.error("Error in sending all user courses:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = {
  registerController,
  loginController,
  getAllCoursesController,
  postCourseController,
  getAllCoursesUserController,
  deleteCourseController,
  enrolledCourseController,
  sendCourseContentController,
  completeSectionController,
  sendAllCoursesUserController,
};
