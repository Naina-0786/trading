import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import prisma from "../../config/prisma.js";
// REGISTER ADMIN
export const registerAdmin = async (req, res) => {
    try {
        const { email, password, role } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Email & Password are required" });
        }
        const adminExists = await prisma.admin.findUnique({
            where: { email },
        });
        if (adminExists) {
            return res.status(400).json({ message: "Admin already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                role, // optional
            },
        });
        res.status(201).json({
            message: "Admin registered successfully",
            admin: { id: admin.id, email: admin.email, role: admin.role },
        });
    }
    catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// LOGIN ADMIN
export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;
        const admin = await prisma.admin.findUnique({
            where: { email },
        });
        if (!admin) {
            return res.status(404).json({ message: "Invalid Email or Password" });
        }
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(404).json({ message: "Invalid Email or Password" });
        }
        const token = jwt.sign({ id: admin.id, email: admin.email, role: admin.role }, "your_jwt_secret_key", { expiresIn: "7d" });
        res.json({
            message: "Login successful",
            token,
            admin: {
                id: admin.id,
                email: admin.email,
                role: admin.role,
            },
        });
    }
    catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// GET ALL ADMINS
export const getAllAdmins = async (req, res) => {
    try {
        const admins = await prisma.admin.findMany({
            select: { id: true, email: true, role: true, createdAt: true },
        });
        res.json(admins);
    }
    catch (error) {
        console.error("Fetch Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
// DELETE ADMIN
export const deleteAdmin = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.admin.delete({
            where: { id },
        });
        res.json({ message: "Admin deleted successfully" });
    }
    catch (error) {
        console.error("Delete Error:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};
//# sourceMappingURL=admin.js.map