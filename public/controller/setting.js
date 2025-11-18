const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// Get all settings
const getAllSettings = async (req, res) => {
    try {
        const settings = await prisma.setting.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.status(200).json({
            success: true,
            data: settings,
        });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch settings',
            error: error.message,
        });
    }
};
// Get a single setting by ID
const getSettingById = async (req, res) => {
    try {
        const { id } = req.params;
        const setting = await prisma.setting.findUnique({
            where: { id },
        });
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found',
            });
        }
        res.status(200).json({
            success: true,
            data: setting,
        });
    }
    catch (error) {
        console.error('Error fetching setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch setting',
            error: error.message,
        });
    }
};
// Get a single setting by email
const getSettingByEmail = async (req, res) => {
    try {
        const { email } = req.params;
        const setting = await prisma.setting.findUnique({
            where: { email },
        });
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found',
            });
        }
        res.status(200).json({
            success: true,
            data: setting,
        });
    }
    catch (error) {
        console.error('Error fetching setting by email:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch setting',
            error: error.message,
        });
    }
};
// Create a new setting
const createSetting = async (req, res) => {
    try {
        const { phoneNumber, email } = req.body;
        if (!phoneNumber || !email) {
            return res.status(400).json({
                success: false,
                message: 'phoneNumber and email are required',
            });
        }
        const existingSetting = await prisma.setting.findUnique({
            where: { email },
        });
        if (existingSetting) {
            return res.status(409).json({
                success: false,
                message: 'A setting with this email already exists',
            });
        }
        const setting = await prisma.setting.create({
            data: {
                phoneNumber,
                email,
            },
        });
        res.status(201).json({
            success: true,
            data: setting,
        });
    }
    catch (error) {
        console.error('Error creating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create setting',
            error: error.message,
        });
    }
};
// Update a setting
const updateSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const { phoneNumber, email } = req.body;
        const existingSetting = await prisma.setting.findUnique({
            where: { id },
        });
        if (!existingSetting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found',
            });
        }
        // Check for email uniqueness if provided
        if (email && email !== existingSetting.email) {
            const emailExists = await prisma.setting.findUnique({
                where: { email },
            });
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'A setting with this email already exists',
                });
            }
        }
        const setting = await prisma.setting.update({
            where: { id },
            data: {
                phoneNumber,
                email,
            },
        });
        res.status(200).json({
            success: true,
            data: setting,
        });
    }
    catch (error) {
        console.error('Error updating setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update setting',
            error: error.message,
        });
    }
};
// Delete a setting
const deleteSetting = async (req, res) => {
    try {
        const { id } = req.params;
        const setting = await prisma.setting.findUnique({
            where: { id },
        });
        if (!setting) {
            return res.status(404).json({
                success: false,
                message: 'Setting not found',
            });
        }
        await prisma.setting.delete({
            where: { id },
        });
        res.status(200).json({
            success: true,
            message: 'Setting deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting setting:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete setting',
            error: error.message,
        });
    }
};
module.exports = {
    getAllSettings,
    getSettingById,
    getSettingByEmail,
    createSetting,
    updateSetting,
    deleteSetting,
};
export {};
//# sourceMappingURL=setting.js.map