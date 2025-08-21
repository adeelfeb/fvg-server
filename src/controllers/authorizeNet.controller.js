import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import prisma from '../db/index.js';
import { nanoid } from "nanoid"; 

const AUTHORIZE_API_LOGIN_ID = process.env.AUTHORIZE_API_LOGIN_ID;
const AUTHORIZE_TRANSACTION_KEY = process.env.AUTHORIZE_TRANSACTION_KEY;
const AUTHORIZE_API_URL = 'https://apitest.authorize.net/xml/v1/request.api'; 

/**
 * Get dynamic amount for employee based on their ID
/**
 * Calculate the final amount for an employee hire request
 * @param {string} employeeId
 * @param {Object} hireDetails
 * @param {number} hireDetails.weeks - number of weeks (1–4)
 * @param {number} hireDetails.months - number of months (1–6)
 */
export async function calculateEmployeeAmount(employeeId, { unit, value, vpcCount }) {
  if (!employeeId) {
    throw new ApiError(400, "Employee ID is required");
  }

  // Fetch employee profile
  const profile = await prisma.profile.findUnique({
    where: { id: employeeId },
    select: { finalCost: true },
  });

  if (!profile) {
    throw new ApiError(404, `Profile with ID ${employeeId} not found`);
  }
  if (profile.finalCost == null) {
    throw new ApiError(400, `Employee ${employeeId} has no final cost set`);
  }

  if (!unit || !value) {
    throw new ApiError(400, "Duration must include a unit and value");
  }

  // ---- Calculate base employee amount ----
  let baseAmount = 0;

  if (unit === "weeks") {
    if (value < 1 || value > 52) {
      throw new ApiError(400, "Weeks must be between 1 and 52");
    }
    baseAmount = profile.finalCost * 40 * value; // hourly × 40 hrs/week × weeks
  } else if (unit === "months") {
    if (value < 1 || value > 12) {
      throw new ApiError(400, "Months must be between 1 and 12");
    }
    baseAmount = profile.finalCost * value; // monthly flat × months
  } else {
    throw new ApiError(400, "Invalid duration unit (must be 'weeks' or 'months')");
  }

  // ---- Fetch VPC Pricing from DB ----
  let vpcPriceRecord = await prisma.vpcPricing.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: "desc" }, // in case multiple, use latest
  });

  let vpcUnitPrice = vpcPriceRecord ? vpcPriceRecord.unitPrice / 100 : 50; 
  // fallback to $50 if no record

  const vpcTotal = (parseInt(vpcCount, 10) || 0) * vpcUnitPrice;

  const total = baseAmount + vpcTotal;

  return parseFloat(total.toFixed(2));
}



export const processAuthorizePayment = asyncHandler(async (req, res) => {
  const { employeeId, opaqueData, duration } = req.body;
  const userId = req.user?.id;

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!employeeId) throw new ApiError(400, 'Employee ID required');
  if (!opaqueData?.dataValue || !opaqueData?.dataDescriptor) {
    throw new ApiError(400, 'Missing payment token data');
  }

  const amount = await calculateEmployeeAmount(employeeId, duration);
  // Example: dynamic amount
    const payload = {
    createTransactionRequest: {
      merchantAuthentication: {
        name: AUTHORIZE_API_LOGIN_ID,
        transactionKey: AUTHORIZE_TRANSACTION_KEY,
      },
      transactionRequest: {
        transactionType: 'authCaptureTransaction',
        amount,
        payment: {
          opaqueData: {
            dataDescriptor: opaqueData.dataDescriptor,
            dataValue: opaqueData.dataValue,
          },
        },
      },
    },
  };

  // Send request to Authorize.net
  const authNetResponse = await fetch(AUTHORIZE_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).then(r => r.json());

  // console.log("the rep0osen aftre changing :", authNetResponse)
  // console.log("Authorize.Net full response:", JSON.stringify(authNetResponse, null, 2));


  const resultCode = authNetResponse?.transactionResponse?.responseCode;
  const transactionId = authNetResponse?.transactionResponse?.transId;

  if (resultCode !== '1') {
    const message =
      authNetResponse?.transactionResponse?.errors?.[0]?.errorText ||
      authNetResponse?.messages?.message?.[0]?.text ||
      'Payment failed';
    throw new ApiError(400, message);
  }

  // === Fulfillment logic ===
  await prisma.clientContractor.upsert({
    where: {
      clientId_contractorId: {
        clientId: userId,
        contractorId: employeeId,
      },
    },
    update: {
      active: true,
      endedAt: null,
      paymentIntentId: transactionId,
      paymentAmount: amount,
      paymentStatus: 'paid',
      hiredAt: new Date(),
    },
    create: {
      clientId: userId,
      contractorId: employeeId,
      paymentIntentId: transactionId,
      paymentAmount: amount,
      paymentStatus: 'paid',
      active: true,
    },
  });

  if (vpcCount !== 0) {
    await prisma.user.update({
        where: { id: userId },
        data: { vpcCredits: { increment: vpcCount } },
    });
  }

  await prisma.payment.create({
    data: {
      userId,
      stripeSessionId: null,
      stripePaymentIntentId: null,
      authorizeTransactionId: transactionId,
      amount: amount * 100, // store in cents
      currency: 'USD',
      status: 'paid',
      description: `Purchase of employee profile (${employeeId}) and ${vpcCount} VPCs`,
    },
  });

  res.status(200).json(new ApiResponse(true, 'Payment processed successfully'));
});
