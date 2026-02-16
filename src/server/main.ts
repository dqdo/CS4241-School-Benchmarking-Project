import express from "express";
import ViteExpress from "vite-express";
import {config} from "dotenv"
import {Db, MongoClient, ServerApiVersion} from "mongodb";
const app = express();
config();

app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI ?? "", {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
let db: Db | undefined = undefined;

app.get("/test", async (_, res) => {
  if(!db){
    res.json({message: "Failed to connect to DB"}).status(500);
    return;
  }
  const data = await db.collection("TestData").findOne();
  res.json(data).status(200);
});

ViteExpress.listen(app, 3000, async () => {
  await client.connect();
  console.log('Connected to MongoDB');

  db = client.db("Test");
  console.log("Server is listening on port 3000...");
});
