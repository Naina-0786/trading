import prisma from "../config/prisma.js";
import { asyncHandler } from "../middleware/error.middleware.js";
import { ErrorResponse, SuccessResponse } from "../utils/response.util.js";

const updateSetting = asyncHandler(async (req, res, next) => {
  const { phoneNumber, email, activeUser, totalUser, location } = req.body;

  if (!email && !phoneNumber && !activeUser && !totalUser && !location) {
    return next(new ErrorResponse("At least one field is required", 400));
  }

  const settingConfig = await prisma.setting.findFirst({});

  let updatedSetting;
  if (settingConfig) {
    updatedSetting = await prisma.setting.update({
      where: { id: settingConfig.id },
      data: {
        phoneNumber,
        email,
        activeUser,
        totalUser,
        location,
      },
    });
  } else {
    updatedSetting = await prisma.setting.create({
      data: {
        phoneNumber,
        email,
        activeUser,
        totalUser,
        location,
      },
    });
  }

  res.status(updatedSetting.id ? 200 : 201).json({
    success: true,
    data: updatedSetting,
  });
});


export const getSettingData = asyncHandler(async(req, res) => {
  const setting = await prisma.setting.findFirst()
  return SuccessResponse(res, "setting fetched successfully", setting, 200)
})

export  default updateSetting