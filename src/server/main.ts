import express from "express";
import ViteExpress from "vite-express";
import * as dotenv from "dotenv"
import {Db, MongoClient, ServerApiVersion} from "mongodb";
import {auth} from "express-openid-connect"
import {requireAdmin, requireAuth} from "../middleware/auth.js";

const app = express();
dotenv.config();

const client = new MongoClient(process.env.MONGODB_URI ?? "", {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: false,
    deprecationErrors: true,
  },
});

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET,
  baseURL: process.env.NODE_ENV === 'production' ? 'https://cs4241-school-benchmarking-project-1.onrender.com' : 'http://localhost:3000',
  clientID: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
  issuerBaseURL: process.env.AUTH0_URL,
  authorizationParams: {
    response_type: 'code',
    scope: 'openid profile email read:roles',
    audience: process.env.AUTH0_AUDIENCE,
  },
};

app.use(express.json());
app.use(auth(config));
app.use("/", requireAuth); // get/post is always protected by being logged in. If not logged in, users are redirected to login page
app.use("/admin", requireAdmin); // get/post path should be /admin/xxx if the route should only be accessed my admins

let db: Db | undefined = undefined;

/*
  Users:
  admin@gmail.com AdminUser!
  school-user@gmail.com SchoolUser!
 */

app.get("/currentUser", (req, res) => {
    const user = req.oidc.user;
    res.status(200).json({email: user?.email });
});

app.get("/admin/test", async (req, res) => {
  if(!db){
    res.json({message: "Failed to connect to DB"}).status(500);
    return;
  }
  const data = await db.collection("TestData").findOne();
  if(!data){
    res.json({message: "Data not found"}).status(404);
    return;
  }
  res.json(data.Test1).status(200);
});

app.get("/test1", async (req, res) => {
  if(!db){
    res.json({message: "Failed to connect to DB"}).status(500);
    return;
  }
  const data = await db.collection("TestData").findOne();
  if(!data){
    res.json({message: "Data not found"}).status(404);
    return;
  }
  res.json(data.Test2).status(200);
});

app.get("/loggedIn", (req, res) => {
  res.status(200).json({status: req.oidc.isAuthenticated()});
})

app.post("/api/submit-admissions", async (req, res) => {
  if(!client) {
    return res.status(500).json({ message: "Failed to connect to DB" });
  }
  try {
    //Set up initial collections/dbs
    const benchmarkDb = client.db("Test-School-Benchmark")
    const collection = benchmarkDb.collection("AdmissionActivity")

    //Get the current user email
    const usersCollection = benchmarkDb.collection("Users")
    const userEmail = req.oidc.user?.email
    if (!userEmail) {
      return res.status(401).json({ message: "Unauthorized: No user email found" });
    }

    //Find the school the user belongs to
    const userMapping = await usersCollection.findOne({ email: userEmail })
    if (!userMapping || !userMapping.SCHOOL_ID) {
      return res.status(403).json({ message: "Forbidden: User is not linked to a school" });
    }
    const schoolID = userMapping.SCHOOL_ID

    //Get the school year and grade that we're entering data for
    if (!req.body.SCHOOL_YR_ID || !req.body.GRADE_DEF_ID) {
      return res.status(400).json({ message: "School Year and Grade Level are required." });
    }

    const schoolYearID = parseInt(req.body.SCHOOL_YR_ID, 10);
    const gradeDefID = parseInt(req.body.GRADE_DEF_ID, 10);

    console.log(`User ${userEmail} is submitting data for School ID: ${schoolID}`);

    //Add keys to this if we're updating those fields
    const updateFields: any = {};

    //FOR ALL FIELDS, CONVERT TO NUMBER
    if (req.body.CAPACITY_ENROLL !== undefined) {
      updateFields.CAPACITY_ENROLL = parseInt(req.body.CAPACITY_ENROLL, 10) || 0;
    }
    if (req.body.COMPLETED_APPLICATION_TOTAL !== undefined) {
      updateFields.COMPLETED_APPLICATION_TOTAL = parseInt(req.body.COMPLETED_APPLICATION_TOTAL, 10) || 0;
    }
    if (req.body.ACCEPTANCES_TOTAL !== undefined) {
      updateFields.ACCEPTANCES_TOTAL = parseInt(req.body.ACCEPTANCES_TOTAL, 10) || 0;
    }
    if (req.body.NEW_ENROLLMENTS_BOYS !== undefined) {
      updateFields.NEW_ENROLLMENTS_BOYS = parseInt(req.body.NEW_ENROLLMENTS_BOYS, 10) || 0;
    }
    if (req.body.NEW_ENROLLMENTS_GIRLS !== undefined) {
      updateFields.NEW_ENROLLMENTS_GIRLS = parseInt(req.body.NEW_ENROLLMENTS_GIRLS, 10) || 0;
    }

    //For the exact school and year, update the fields we were given. Only modify existing entries, don't make new oness
    const result = await collection.updateOne(
        { SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID, GRADE_DEF_ID: gradeDefID },
        { $set: updateFields }
    );

    //If we didn't update something, then say it failed
    if (result.matchedCount === 0) {
      return res.status(404).json({
        message: "No existing record found for this Grade and Year combination. Cannot update."
      });
    }

    res.status(200).json({ message: "Successfully saved data", result });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
})

app.get("/api/admissions-data", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");

    //Get user's school
    const userEmail = req.oidc?.user?.email;
    const userMapping = await benchmarkDb.collection("Users").findOne({ email: userEmail });
    if (!userMapping || !userMapping.SCHOOL_ID) return res.status(403).json({ message: "No school linked" });

    //Get the requested year and grade from the URL query
    const yearId = parseInt(req.query.yearId as string, 10);
    const gradeId = parseInt(req.query.gradeId as string, 10);

    if (!yearId || !gradeId) return res.status(400).json({ message: "Missing IDs" });

    //Look for the data
    const existingData = await benchmarkDb.collection("AdmissionActivity").findOne({
      SCHOOL_ID: userMapping.SCHOOL_ID,
      SCHOOL_YR_ID: yearId,
      GRADE_DEF_ID: gradeId
    });

    //Send it back, or empty data if none exists
    res.status(200).json(existingData || {});

  } catch (error) {
    console.error("Autofill error:", error);
    res.status(500).json({ message: "Error fetching existing data" });
  }
});

app.get("/api/available-years", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");
    //Fetch all years so the user can pick the current one to add new data
    const years = await benchmarkDb.collection("SchoolYear").find({}).sort({ ID: -1 }).toArray();
    res.status(200).json(years);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching years" });
  }
});

app.get("/api/available-grades", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");
    // Fetch all standard grades
    const grades = await benchmarkDb.collection("GradeDefinitions").find({}).sort({ ORDER_NO: 1 }).toArray();
    res.status(200).json(grades);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching grades" });
  }
});

ViteExpress.listen(app, 3000, async () => {
  await client.connect();
  console.log('Connected to MongoDB');

  db = client.db("Test");
  console.log("Server is listening on port 3000...");
});