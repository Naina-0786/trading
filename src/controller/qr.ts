import { uploadToCloudinary } from "../config/cloudinary.js";
import prisma from "../config/prisma.js";
import { SuccessResponse } from "../utils/response.util.js";

export const qrCode = async (req: any, res: any) => {
  try {
    // Safely destructure to avoid error if req.body is undefined
    const {wallentaddress} = req.body || {};
    const {qrCodeUrl} = req.file;

    if (!wallentaddress || !qrCodeUrl) {
      return res.status(400).json({
        success: false,
        message: "walletAddress and QR Code file are required",
      });
    }

    // Use the buffer directly from multer (assuming memory storage)
    const fileBuffer = qrCodeUrl.buffer;

    const uploadResult = await uploadToCloudinary(fileBuffer, "qr_codes");
    const uploadedQrCodeUrl = uploadResult.secure_url;

    // Fixed typo: wallentaddress -> walletAddress (assuming this matches your Prisma schema)
    const existingQr = await prisma.qrCode.findFirst({
      where: { wallentaddress: wallentaddress },
    });

    let result;
    if (existingQr) {
      result = await prisma.qrCode.update({
        where: { id: existingQr.id },
        data: { qrCodeUrl: uploadedQrCodeUrl },
      });
      SuccessResponse(res, "QR Code updated successfully", result, 200);
    } else {
      result = await prisma.qrCode.create({
        data: {
       wallentaddress:wallentaddress,
          qrCodeUrl: uploadedQrCodeUrl,
        },
      });
      SuccessResponse(res, "QR Code created successfully", result, 201);
    }
  } catch (error: any) {
    console.error("QR Code controller error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process QR Code: " + error.message,
    });
  }
};