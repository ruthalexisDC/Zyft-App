
import mongoose from "mongoose";
import dotenv from "dotenv";
import { cleanupExpiredReportSnapshots } from "./services/reportCleanupService.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI;

async function testReportCleanup() {
  try {
    if (!MONGO_URI) {
      throw new Error("MONGO_URI is missing from your .env file");
    }

    await mongoose.connect(MONGO_URI);

    console.log("Connected to local MongoDB.");

    const result = await cleanupExpiredReportSnapshots();

    console.log("Cleanup test result:", {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });
  } catch (error) {
    console.error("Cleanup test failed:", error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log("MongoDB connection closed.");
  }
}

testReportCleanup();
