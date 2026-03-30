import mongoose from "mongoose";
import dotenv from 'dotenv'

dotenv.config()

const conn = mongoose
  .connect(process.env.MONGO_URL)
  .then(() => console.log("Database connected"))
  .catch((err) => console.log(err.message));

export default conn;