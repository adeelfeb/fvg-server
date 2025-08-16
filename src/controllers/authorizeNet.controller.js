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
 * @param {string} employeeId 
 * @returns {Promise<number>} amount
 */
export async function getEmployeeAmount(employeeId) {
  // Fetch employee details (you decide what fields matter)
  const employee = await prisma.employee.findUnique({
    where: { id: employeeId },
    select: {
      hourlyRate: true,
      hoursWorked: true,
      fixedSalary: true,
    },
  });

  if (!employee) {
    throw new Error(`Employee with id ${employeeId} not found`);
  }

  // Example logic: If fixed salary exists, use that
  // Otherwise calculate using hourly rate * hoursWorked
  let amount = 0;

  if (employee.fixedSalary) {
    amount = employee.fixedSalary;
  } else if (employee.hourlyRate && employee.hoursWorked) {
    amount = employee.hourlyRate * employee.hoursWorked;
  } else {
    throw new Error(`No valid payment data for employee ${employeeId}`);
  }

  // Make sure it’s a float with 2 decimals
  return parseFloat(amount.toFixed(2));
}


export const processAuthorizePayment = asyncHandler(async (req, res) => {
  const { employeeId, vpcCount, opaqueData } = req.body;
  const userId = req.user?.id;

  // console.log("started working gon it:", vpcCount)

  if (!userId) throw new ApiError(401, 'Not authenticated');
  if (!employeeId) throw new ApiError(400, 'Employee ID required');
  if (vpcCount == null || vpcCount < 0) throw new ApiError(400, 'Invalid VPC count');
  if (!opaqueData?.dataValue || !opaqueData?.dataDescriptor) {
    throw new ApiError(400, 'Missing payment token data');
  }

  let amount = 40
  console.log("the keys are ", AUTHORIZE_API_LOGIN_ID, AUTHORIZE_TRANSACTION_KEY)

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
