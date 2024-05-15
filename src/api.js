const express = require("express");
const serverless = require("serverless-http") 
const router = express.Router();
const app = express();
const bodyParser = require("body-parser");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");
const mongoose = require("mongoose");
const compression = require("compression");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static("public"));
app.use(cors());
app.use(compression());

const mongoURI =
  "mongodb+srv://vaibhav:1234@cluster0.sk5rubx.mongodb.net/recrutoryBlogs?retryWrites=true&w=majority&appName=Cluster0";

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("MongoDB Connected");
  })
  .catch((err) => console.error(err));

const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));

// Define Schema and Model using Mongoose
const blogSchema = new mongoose.Schema({});

const Blog = mongoose.model("Blog", blogSchema);

router.get('/',(req,res)=>{
  res.send('App is running.. ');
})

// Testing API
router.get("/msgDisplay", (req, res) => {
  res.status(200).send({
    msg: "APIs are working successfully",
  });
});

// Get all blogs
router.get("/api/blogs", async (req, res) => {
  try {
    const blogs = await Blog.find({}).lean(); // Use lean() for plain JavaScript objects
    res.json(blogs);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
}); 

// Get blogs using Id
router.get("/api/blogs/:id", async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).lean(); // Use lean() for plain JavaScript objects
    if (!blog) {
      return res.status(404).send("Blog not found");
    }
    res.json(blog);
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Posting API for blogs
router.post("/sendBlogs", async (req, res) => {
  const formData = req.body;
  formData.date = getCurrentDate();

  try {
    const client = new MongoClient(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();

    const db = client.db("recrutoryBlogs");
    const collection1 = db.collection("blogs");

    await collection1.insertOne(formData);
    res.status(200).send("OK");

    await client.close();
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

// Patch API for blogs
router.patch("/api/blogs/:id", async (req, res) => {
  try {
    const updates = req.body;
    const id = req.params.id;

    // Check if the provided ID is valid
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid ID format" });
    }

    const updatedBlog = await Blog.findByIdAndUpdate(id, updates, {
      new: true,
    }).lean(); // Use lean() for plain JavaScript objects
    if (!updatedBlog) {
      return res.status(404).json({ error: "No matching document found" });
    }

    res.status(200).json({ message: "Update successful", updatedBlog });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).send("Internal Server Error");
  }
});

function getCurrentDate() {
  const currentDate = new Date();
  const day = currentDate.getDate();
  const monthNames = [
    "Jan",
    "Feb",
    "March",
    "April",
    "May",
    "Jun",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();
  return `${day} ${month} ${year}`;
}

// const port = process.env.PORT || 3000;
// app.listen(port, () => {
//   console.log(`Server is running on port ${port}`);
// });

app.use('/.netlify/functions/api',router);
module.exports.handler = serverless(app);
 