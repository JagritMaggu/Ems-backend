import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import employeeRoutes from './routes/employee.routes';
import organizationRoutes from './routes/organization.routes';
import dashboardRoutes from './routes/dashboard.routes';
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve uploaded profile images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/organization', organizationRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'EMS API is running' });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
