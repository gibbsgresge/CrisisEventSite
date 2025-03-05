// pages/api/register.js
import clientPromise from '../../src/lib/mongodb';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      const { firstName, lastName, email, password, confirmPassword } = req.body;
      if (password !== confirmPassword) {
        console.error(`Error: Passwords don't match for email: ${email}`);
        return res.status(400).json({ error: "Passwords don't match" });
      }

      const client = await clientPromise;
      const db = client.db();

      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        console.error(`Error: User already exists with email: ${email}`);
        return res.status(400).json({ error: "User already exists" });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);

      await db.collection('users').insertOne({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        createdAt: new Date(),
      });

      console.log(`User registered successfully with email: ${email}`);
      res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
      console.error("Error during registration:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    console.error("Error: Method not allowed");
    res.status(405).json({ error: "Method not allowed" });
  }
}
