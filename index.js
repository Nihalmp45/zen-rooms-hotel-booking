import express from 'express'
import 'dotenv/config'
import logger from "./logger.js";
import morgan from "morgan";
import cors from 'cors';
import connectToDB from './src/dbConfig/dbConfig.js';
import propertyView from './src/views/propertyViews.js'
import userView from './src/views/userViews.js'
import cookieParser from "cookie-parser";

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())
app.use(cookieParser());
connectToDB();

const morganFormat = ":method :url :status :response-time ms";

app.use(
  morgan(morganFormat, {
    stream: {
      write: (message) => {
        const logObject = {
          method: message.split(" ")[0],
          url: message.split(" ")[1],
          status: message.split(" ")[2],
          responseTime: message.split(" ")[3],
        };
        logger.info(JSON.stringify(logObject));
      },
    },
  })
);

app.use(cors({
  origin: "http://localhost:5173",  // ✅ Allow only your frontend
  credentials: true,  // ✅ Allow cookies & authentication headers
}));

app.use("/api",propertyView)
app.use('/api',userView)


app.listen(port,() => {
    console.log(`Server is running on port ${port}`)
})