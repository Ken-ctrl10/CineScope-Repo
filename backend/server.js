import "dotenv/config";
import express from 'express';
import cors from 'cors';

import { router as authRoutes} from "./src/routes/auth.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
})

// Mounting Auth routes 
app.use('/auth', authRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    error: err.message || 'Internal Server Error'
  });
});

app.listen(process.env.PORT, () => {
  console.log(`Server is runnting on port ${process.env.PORT}`);
});