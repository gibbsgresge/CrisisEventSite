import { MongoClient } from "mongodb";

const uri: string | undefined = process.env.MONGODB_URI;
if (!uri) {
  throw new Error("Please add your MongoDB URI to .env.local");
}

// Declare a global variable to persist the connection in development
declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  client = new MongoClient(uri);
  clientPromise = client.connect();
}

export default clientPromise;
