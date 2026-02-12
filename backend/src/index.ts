import express, { Request, Response } from 'express';
import {MongoClient, ServerApiVersion, Db} from 'mongodb';
import cors from 'cors';
import {config} from "dotenv"
config();

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const client = new MongoClient(process.env.MONGODB_URI ?? "", {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
let db: Db | undefined = undefined;

app.get('/api/test', async (req: Request, res: Response) => {
    if(!db){
        res.json({message: "Failed to connect to DB"}).status(500);
        return;
    }
    const data = await db.collection("TestData").findOne();
    res.json(data).status(200);
});

const PORT = 4000;
app.listen(PORT, async () => {
    await client.connect();
    console.log('Connected to MongoDB');

    db = client.db("Test");
    console.log(`Backend running on http://localhost:${PORT}`);
});
