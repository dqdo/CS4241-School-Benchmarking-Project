import express from "express";
import ViteExpress from "vite-express";
import * as dotenv from "dotenv";
import { Db, MongoClient, ServerApiVersion } from "mongodb";
import { auth } from "express-openid-connect";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import chatbot, { setDb } from "./chatbot-ai.js";

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
  baseURL: process.env.NODE_ENV === "production" ? "https://cs4241-school-benchmarking-project-1.onrender.com" : "http://localhost:3000",
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
app.use("/", chatbot);

let db: Db | undefined = undefined;
const SCHOOL_NAMESPACE = "https://cs4241-school-benchmarking-project-1.onrender.com/schoolId";

/*
  Users:
  admin@gmail.com AdminUser!
  school-user@gmail.com SchoolUser!
 */

app.get("/currentUser", (req, res) => {
    const user = req.oidc.user;
    res.status(200).json({email: user?.email });
});

app.get("/admissions", async (req, res) => {
  if(!db){
    return res.status(500).send("Database connection error");
  }
  const school = req.query.school ? Number(req.query.school) : undefined;
  const year = req.query.year ? Number(req.query.year) : undefined;
  const field = req.query.field ? req.query.field : undefined;

  let projection = {};

  switch (field) {
    case "ACCEPTANCES":
      projection = {
        _id: 0,
        DATA: "$ACCEPTANCES_TOTAL",
        DESCRIPTION: "$grade.DESCRIPTION_TX"
      }
      break;
    case "ENROLLMENTS":
      projection = {
        _id: 0,
        DATA: "$NEW_ENROLLMENTS_TOTAL",
        DESCRIPTION: "$grade.DESCRIPTION_TX"
      }
      break;
    case "ENROLL CAPACITY":
      projection = {
        _id: 0,
        DATA: "$CAPACITY_ENROLL",
        DESCRIPTION: "$grade.DESCRIPTION_TX"
      }
      break;
    case "COMPLETED APPLICATION":
      projection = {
        _id: 0,
        DATA: "$COMPLETED_APPLICATION_TOTAL",
        DESCRIPTION: "$grade.DESCRIPTION_TX"
      }
      break;
  }

  const data = await db.collection("AdmissionActivity").aggregate([
    {
      $match: {
        SCHOOL_ID: school,
        SCHOOL_YR_ID: year
      }
    },
    {
      $lookup: {
        from: "GradeDefinitions",
        localField: "GRADE_DEF_ID",
        foreignField: "ID",
        as: "grade"
      }
    },
    {
      $unwind: "$grade"
    },
    {
      $sort: { "grade.ID": 1 }
    },
    {
      $project: projection
    }
  ]).toArray();
  return res.status(200).json(data);
})

app.get("/schools", async (req, res) => {
  if(!db)
    return res.status(500).send("Database connection error");
  if(!req.oidc.user)
    return res.status(403).send("Not Authenticated");
  const schoolId = req.oidc.user[SCHOOL_NAMESPACE];

  const data = await db.collection("School").find(
      schoolId !== "Admin" ? {ID: schoolId} : {},
      { projection: { _id: false, ID: true, NAME_TX: true } }
  ).toArray();
  return res.status(200).json(data);
});

app.get("/years", async (req, res) => {
  if(!db)
    return res.status(500).send("Database connection error");

  const data = await db.collection("SchoolYear").find(
      {},
      { projection: { _id: false, ID: true, SCHOOL_YEAR: true } }
  ).sort({ SCHOOL_YEAR: -1 }).toArray();
  return res.status(200).json(data);
});


app.get("/loggedIn", (req, res) => {
    res.status(200).json({ status: req.oidc.isAuthenticated() });
});

app.get("/belongsToSchool", (req, res) => {
  if (!req.oidc.user) {
    return res.status(401).json({ message: "Not authenticated" });
  }
  const schoolId = req.oidc.user[SCHOOL_NAMESPACE];
  return res.status(200).json({ SCHOOL_ID: schoolId });
})


app.post("/api/submit-admissions", async (req, res) => {
  if(!client) { return res.status(500).json({ message: "Failed to connect to DB" }); }
  try {
    //Set up initial collections/dbs
    const benchmarkDb = client.db("Test-School-Benchmark")

    //Get the current user email
    const userEmail = req.oidc.user?.email
    if (!userEmail) {
      return res.status(401).json({message: "Unauthorized: No user email found"});
    }

    //Find the school the user belongs to
    const userMapping = await benchmarkDb.collection("Users").findOne({email: userEmail})
    if (!userMapping || !userMapping.SCHOOL_ID) {
      return res.status(403).json({message: "Forbidden: User is not linked to a school"});
    }

    //Verify school year and grade exist
    if (!req.body.SCHOOL_YR_ID || !req.body.GRADE_DEF_ID) {
      return res.status(400).json({message: "School Year and Grade Level are required."});
    }

    const schoolID = userMapping.SCHOOL_ID
    const schoolYearID = parseInt(req.body.SCHOOL_YR_ID, 10);
    const gradeDefID = parseInt(req.body.GRADE_DEF_ID, 10);

    //Set up the db fields to update
    const baseFields = [
      "CAPACITY_ENROLL", "COMPLETED_APPLICATION_TOTAL", "NEW_ENROLLMENTS_TOTAL", "ACCEPTANCES_TOTAL", "CONTRACTED_ENROLL_BOYS",
      "CONTRACTED_ENROLL_GIRLS", "CONTRACTED_ENROLL_NB"
    ];
    const socFields = baseFields.map(field => field + '_SOC')

    //Any fields we are updating, add to the variable, also make sure they are valid numbers
    const updateFields = parseNumericFields(req.body, baseFields);
    const updateFieldsSOC = parseNumericFields(req.body, socFields);

    //Define the fallback values for new rows
    //This way, new columns will match the old columns data format, but will not include the useless/unnecessary info
    //Also sets a unique ID
    const insertFields: any = {
      ID: Date.now(),
      LOCK_ID: 1,
      UPDATE_USER_TX: null,
      UPDATE_DT: null,
      COMPLETED_APPLICATION_BOYS: null,
      COMPLETED_APPLICATION_GIRLS: null,
      COMPLETED_APPLICATION_NB: null,
      NEW_ENROLLMENTS_BOYS: null,
      NEW_ENROLLMENTS_GIRLS: null,
      NEW_ENROLLMENTS_NB: null,
      ACCEPTANCES_BOYS: null,
      ACCEPTANCES_GIRLS: null,
      ACCEPTANCES_NB: null,
      INQUIRIES_BOYS: null,
      INQUIRIES_GIRLS: null
    };

    //For the exact school and year, update the fields we were given
    await Promise.all([
      benchmarkDb.collection("AdmissionActivity").updateOne(
          {SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID, GRADE_DEF_ID: gradeDefID},
          {$set: updateFields, $setOnInsert: insertFields},
          {upsert: true}
      ),
      benchmarkDb.collection("AdmissionActivitySOC").updateOne(
          {SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID, GRADE_DEF_ID: gradeDefID},
          //Map the SOC names back to the default names that they use in the actual db tables
          {
            $set: Object.fromEntries(
                Object.entries(updateFieldsSOC).map(([k, v]) => [k.replace('_SOC', ''), v])
            ),
            //Give SOC a unique ID too, different from the other entry
            $setOnInsert: {...insertFields, ID: Date.now() + 1}
          },
          {upsert: true}
      )
    ]);
    res.status(200).json({message: "Successfully saved Standard and SOC data"});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
})

app.post("/api/submit-enrollment", async (req, res) => {
  if(!client) { return res.status(500).json({ message: "Failed to connect to DB" }); }
  try {
    //Set up initial collections/dbs
    const benchmarkDb = client.db("Test-School-Benchmark")

    //Get the current user email
    const userEmail = req.oidc.user?.email
    if (!userEmail) {
      return res.status(401).json({message: "Unauthorized: No user email found"});
    }

    //Find the school the user belongs to
    const userMapping = await benchmarkDb.collection("Users").findOne({email: userEmail})
    if (!userMapping || !userMapping.SCHOOL_ID) {
      return res.status(403).json({message: "Forbidden: User is not linked to a school"});
    }

    //Verify school year and grade exist
    if (!req.body.SCHOOL_YR_ID || !req.body.GRADE_DEF_ID) {
      return res.status(400).json({message: "School Year and Grade Level are required."});
    }

    const schoolID = userMapping.SCHOOL_ID
    const schoolYearID = parseInt(req.body.SCHOOL_YR_ID, 10);
    const gradeDefID = parseInt(req.body.GRADE_DEF_ID, 10);

    //Set up the db fields to update
    const baseFields = [
      "STUDENTS_ADDED_DURING_YEAR", "STUDENTS_GRADUATED", "EXCH_STUD_REPS",
      "STUD_DISS_WTHD", "STUD_NOT_INV", "STUD_NOT_RETURN"
    ];
    const socFields = baseFields.map(field => field + '_SOC')

    //Any fields we are updating, add to the variable, also make sure they are valid numbers
    const updateFields = parseNumericFields(req.body, baseFields);
    const updateFieldsSOC = parseNumericFields(req.body, socFields);

    //Define the fallback values for new rows
    //This way, new columns will match the old columns data format, but will not include the useless/unnecessary info
    //Also sets a unique ID
    const insertFields: any = {
      ID: Date.now(),
      LOCK_ID: 1,
      UPDATE_USER_TX: null,
      UPDATE_DT: null,
    };

    //For the exact school and year, update the fields we were given
    await Promise.all([
      benchmarkDb.collection("EnrollAttrition").updateOne(
          {SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID, GRADE_DEF_ID: gradeDefID},
          {$set: updateFields, $setOnInsert: insertFields},
          {upsert: true}
      ),
      benchmarkDb.collection("EnrollAttritionSOC").updateOne(
          {SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID, GRADE_DEF_ID: gradeDefID},
          //Map the SOC names back to the default names that they use in the actual db tables
          {
            $set: Object.fromEntries(
                Object.entries(updateFieldsSOC).map(([k, v]) => [k.replace('_SOC', ''), v])
            ),
            //Give SOC a unique ID too, different from the other entry
            $setOnInsert: {...insertFields, ID: Date.now() + 1}
          },
          {upsert: true}
      )
    ]);
    res.status(200).json({message: "Successfully saved Standard and SOC data"});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
})

function parseNumericFields(body: any, fields: string[]){
  const result: any = {};
  fields.forEach(field => {
    //Only parse it if it actually exists in the request
    if (body[field] !== undefined && body[field] !== "") {
      const parsed = parseInt(body[field], 10);
      if (isNaN(parsed)) {
        throw new Error(`Invalid number format for field: ${field}`);
      }
      result[field] = parsed;
    }
  });
  return result;
};

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

    //Get the data for standard and SOC data
    const filterQuery = { SCHOOL_ID: userMapping.SCHOOL_ID, SCHOOL_YR_ID: yearId, GRADE_DEF_ID: gradeId };
    const [standardData, socData] = await Promise.all([
      benchmarkDb.collection("AdmissionActivity").findOne(filterQuery),
      benchmarkDb.collection("AdmissionActivitySOC").findOne(filterQuery)
    ]);
    //Add standardData to the combined data
    const combinedData: any = { ...(standardData || {}) };
    //If there's an SOC entry, add that too
    if (socData) {
      Object.keys(socData).forEach(key => {
        //Add _SOC to the data fields needed for the forms, but not for the other elements
        if (!["_id", "ID", "SCHOOL_ID", "SCHOOL_YR_ID", "GRADE_DEF_ID", "LOCK_ID", "UPDATE_USER_TX", "UPDATE_DT"].includes(key)) {
          combinedData[`${key}_SOC`] = socData[key];
        }
      });
    }

    //Send it back to autofill
    res.status(200).json(combinedData);

  } catch (error) {
    console.error("Autofill error:", error);
    res.status(500).json({ message: "Error fetching existing data" });
  }
});

app.get("/api/enrollment-data", async (req, res) => {
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

    //Get the data for standard and SOC data
    const filterQuery = { SCHOOL_ID: userMapping.SCHOOL_ID, SCHOOL_YR_ID: yearId, GRADE_DEF_ID: gradeId };
    const [standardData, socData] = await Promise.all([
      benchmarkDb.collection("EnrollAttrition").findOne(filterQuery),
      benchmarkDb.collection("EnrollAttritionSOC").findOne(filterQuery)
    ]);
    //Add standardData to the combined data
    const combinedData: any = { ...(standardData || {}) };
    //If there's an SOC entry, add that too
    if (socData) {
      Object.keys(socData).forEach(key => {
        //Add _SOC to the data fields needed for the forms, but not for the other elements
        if (!["_id", "ID", "SCHOOL_ID", "SCHOOL_YR_ID", "GRADE_DEF_ID", "LOCK_ID", "UPDATE_USER_TX", "UPDATE_DT"].includes(key)) {
          combinedData[`${key}_SOC`] = socData[key];
        }
      });
    }

    //Send it back to autofill
    res.status(200).json(combinedData || {});

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

app.post("/api/save-draft", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");

    //Get user's email
    const userEmail = req.oidc?.user?.email;
    if (!userEmail) return res.status(400).json({ message: "Could not find user's email" });
    //From message, get all the data to save the form
    const formType = req.body.formType;
    const draftData = req.body.draftData;
    if (!formType || !draftData) return res.status(400).json({ message: "Missing required data" });

    //Update the form drafts collection with the necessary data
    await benchmarkDb.collection("FormDrafts").updateOne(
        {USER_EMAIL: userEmail, FORM_TYPE: formType, SCHOOL_YR_ID: draftData.SCHOOL_YR_ID, GRADE_DEF_ID: draftData.GRADE_DEF_ID},
        { $set: {DRAFT_DATA: draftData, UPDATED_AT: Date.now()} },
        {upsert: true}
    )
    res.status(200).json({message: "Successfully saved draft data"});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating data" });
  }
});

app.get("/api/get-draft", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");

    //Get user's email
    const userEmail = req.oidc?.user?.email;
    if (!userEmail) return res.status(400).json({ message: "Could not find user's email" });
    //Get necessary data from the message
    const formType = req.query.formType as string;
    const schoolYearId = parseInt(req.query.SCHOOL_YR_ID as string, 10);
    const gradeDefId = parseInt(req.query.GRADE_DEF_ID as string, 10);
    if (!formType || !schoolYearId || !gradeDefId) return res.status(400).json({ message: "Missing required data" });

    //Get the form data from the database
    const draftDocument = await benchmarkDb.collection("FormDrafts").findOne(
        {USER_EMAIL: userEmail, FORM_TYPE: formType, SCHOOL_YR_ID: schoolYearId, GRADE_DEF_ID: gradeDefId},
        { projection: { DRAFT_DATA: 1, _id: 0 }}
    )
    if (draftDocument && draftDocument.DRAFT_DATA) {
      res.status(200).json(draftDocument.DRAFT_DATA);
    } else {
      res.status(200).json(null);
    }
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error getting draft data" });
  }
});

app.post("/api/submit-employee", async (req, res) => {
  if(!client) { return res.status(500).json({ message: "Failed to connect to DB" }); }
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");
    const userEmail = req.oidc.user?.email;

    if (!userEmail) return res.status(401).json({message: "Unauthorized: No user email found"});

    const userMapping = await benchmarkDb.collection("Users").findOne({email: userEmail});
    if (!userMapping || !userMapping.SCHOOL_ID) {
      return res.status(403).json({message: "Forbidden: User is not linked to a school"});
    }

    if (!req.body.SCHOOL_YR_ID) {
      return res.status(400).json({message: "School Year is required."});
    }

    const schoolID = userMapping.SCHOOL_ID;
    const schoolYearID = parseInt(req.body.SCHOOL_YR_ID, 10);

    const personnelFields = ["TOTAL_EMPLOYEES", "FT_EMPLOYEES", "POC_EMPLOYEES", "SUBCONTRACT_NUM", "SUBCONTRACT_FTE", "FTE_ONLY_NUM"];
    const adminFields = ["NR_EXEMPT", "NR_NONEXEMPT", "FTE_EXEMPT", "FTE_NONEXEMPT"];

    const updatePersonnel = parseNumericFields(req.body, personnelFields);
    const updateAdmin = parseNumericFields(req.body, adminFields);

    const insertFields: any = {
      ID: Date.now(),
      LOCK_ID: 1,
      UPDATE_USER_TX: null,
      UPDATE_DT: null,
    };

    await Promise.all([
      benchmarkDb.collection("EmployeePersonnel").updateOne(
          { SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID },
          {
            $set: { ...updatePersonnel, EMP_CAT_CD: 'ALL' },
            $setOnInsert: insertFields
          },
          { upsert: true }
      ),
      benchmarkDb.collection("EmployeeAdminSupport").updateOne(
          { SCHOOL_ID: schoolID, SCHOOL_YR_ID: schoolYearID },
          {
            $set: { ...updateAdmin, ADMIN_STAFF_FUNC_CD: 'ALL' },
            $setOnInsert: { ...insertFields, ID: Date.now() + 1 }
          },
          { upsert: true }
      )
    ]);
    res.status(200).json({message: "Successfully saved Employee data"});
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.get("/api/employee-data", async (req, res) => {
  if(!client) return res.status(500).json({ message: "No DB connection" });
  try {
    const benchmarkDb = client.db("Test-School-Benchmark");

    const userEmail = req.oidc?.user?.email;
    const userMapping = await benchmarkDb.collection("Users").findOne({ email: userEmail });
    if (!userMapping || !userMapping.SCHOOL_ID) return res.status(403).json({ message: "No school linked" });

    const yearId = parseInt(req.query.yearId as string, 10);
    if (!yearId) return res.status(400).json({ message: "Missing Year ID" });

    const filterQuery = { SCHOOL_ID: userMapping.SCHOOL_ID, SCHOOL_YR_ID: yearId };
    const [personnelData, adminData] = await Promise.all([
      benchmarkDb.collection("EmployeePersonnel").findOne(filterQuery),
      benchmarkDb.collection("EmployeeAdminSupport").findOne(filterQuery)
    ]);

    //Merge both tables into one object for the form
    const combinedData: any = { ...(personnelData || {}), ...(adminData || {}) };

    res.status(200).json(combinedData || {});
  } catch (error) {
    console.error("Autofill error:", error);
    res.status(500).json({ message: "Error fetching existing data" });
  }
});

ViteExpress.listen(app, 3000, async () => {
  await client.connect();
  console.log("Connected to MongoDB");
  db = client.db("School-Benchmark");
  setDb(db); // give the chatbot router access to the live db
  console.log("Server is listening on port 3000...");
});