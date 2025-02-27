import express from 'express'
import 'dotenv/config'
import logger from "./logger.js";
import morgan from "morgan";
import cors from 'cors';
import connectToDB from './src/dbConfig/dbConfig.js';
import propertyView from './src/views/propertyViews.js'
import userView from './src/views/userViews.js'
import cookieParser from "cookie-parser";
import limiter from "./src/middleware/rateLimiter.js";


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

app.use(limiter);
app.use(cors({
  origin: true, // ✅ Allows all origins
  credentials: true, // ✅ Required for cookies/sessions
}));

// ✅ Hello World Route for Testing
app.get("/", (req, res) => {
  res.json({ message: "Hello World! Your API is running 🚀" });
});

app.use("/api",propertyView)
app.use('/api',userView)


app.listen(port,() => {
    console.log(`Server is running on port ${port}`)
})