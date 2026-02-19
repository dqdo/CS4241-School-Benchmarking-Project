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
    strict: true,
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

ViteExpress.listen(app, 3000, async () => {
  await client.connect();
  console.log('Connected to MongoDB');

  db = client.db("Test");
  console.log("Server is listening on port 3000...");
});
