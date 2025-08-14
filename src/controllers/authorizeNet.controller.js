import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import prisma from '../db/index.js';
import authorizenet from 'authorizenet';
const { APIContracts, APIControllers } = authorizenet;


export const processAuthorizeNetPayment = asyncHandler(async (req, res) => {
    console.log("Processing Authorize.Net payment..."); 
    const { employeeId, vpcCount, amount, cardNumber, expMonth, expYear, cvv } = req.body;
    const userId = req.user?.id;

    if (!userId) throw new ApiError(401, "User not authenticated.");
    if (!employeeId) throw new ApiError(400, "Employee ID is required.");
    if (!amount || amount <= 0) throw new ApiError(400, "Valid amount is required.");
    if (!cardNumber || !expMonth || !expYear || !cvv) throw new ApiError(400, "Card details are required.");

    // 1. Merchant Authentication
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHNET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHNET_TRANSACTION_KEY);

    // 2. Payment Data
    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(cardNumber);
    creditCard.setExpirationDate(`${expYear}-${expMonth}`);
    creditCard.setCardCode(cvv);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    // 3. Transaction Request
    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    // 4. Execute transaction
    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());
    ctrl.setEnvironment(process.env.AUTHNET_ENVIRONMENT === 'production'
        ? APIContracts.endpoint.production
        : APIContracts.endpoint.sandbox
    );

    ctrl.execute(async () => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (response && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
            const transId = response.getTransactionResponse().getTransId();

            // Fulfillment logic: similar to your Stripe code
            await prisma.clientContractor.upsert({
                where: {
                    clientId_contractorId: {
                        clientId: userId,
                        contractorId: employeeId,
                    }
                },
                update: {
                    active: true,
                    endedAt: null,
                    paymentIntentId: transId,
                    paymentAmount: amount,
                    paymentStatus: "paid",
                    hiredAt: new Date(),
                },
                create: {
                    clientId: userId,
                    contractorId: employeeId,
                    paymentIntentId: transId,
                    paymentAmount: amount,
                    paymentStatus: "paid",
                    active: true,
                },
            });

            // VPC credits
            if (vpcCount > 0) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { vpcCredits: { increment: vpcCount } },
                });
            }

            // Record payment
            await prisma.payment.create({
                data: {
                    userId,
                    authorizeNetTransactionId: transId,
                    amount,
                    currency: "USD",
                    status: "paid",
                    description: `Purchase of employee profile (${employeeId}) and ${vpcCount} VPCs`,
                }
            });

            return res.status(200).json(new ApiResponse(200, { transactionId: transId }, "Payment successful."));
        } else {
            const errorMsg = response.getTransactionResponse()?.getErrors()?.getError()[0]?.getErrorText() || "Transaction failed";
            throw new ApiError(400, errorMsg);
        }
    });
});

export const testAuthorizeNetPayment = async (req, res) => {
    console.log("Processing test Authorize.Net payment...");

    const { amount, cardNumber, expMonth, expYear, cvv } = req.body;

    if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valid amount is required." });
    }
    if (!cardNumber || !expMonth || !expYear || !cvv) {
        return res.status(400).json({ error: "Card details are required." });
    }

    // 1. Merchant Authentication
    const merchantAuthenticationType = new APIContracts.MerchantAuthenticationType();
    merchantAuthenticationType.setName(process.env.AUTHNET_API_LOGIN_ID);
    merchantAuthenticationType.setTransactionKey(process.env.AUTHNET_TRANSACTION_KEY);

    // 2. Payment Data
    const creditCard = new APIContracts.CreditCardType();
    creditCard.setCardNumber(cardNumber);
    creditCard.setExpirationDate(`${expYear}-${expMonth}`);
    creditCard.setCardCode(cvv);

    const paymentType = new APIContracts.PaymentType();
    paymentType.setCreditCard(creditCard);

    // 3. Transaction Request
    const transactionRequestType = new APIContracts.TransactionRequestType();
    transactionRequestType.setTransactionType(APIContracts.TransactionTypeEnum.AUTHCAPTURETRANSACTION);
    transactionRequestType.setPayment(paymentType);
    transactionRequestType.setAmount(amount);

    const createRequest = new APIContracts.CreateTransactionRequest();
    createRequest.setMerchantAuthentication(merchantAuthenticationType);
    createRequest.setTransactionRequest(transactionRequestType);

    // 4. Execute transaction
    const ctrl = new APIControllers.CreateTransactionController(createRequest.getJSON());

    // FIX: Directly set the API URL
    ctrl.setEnvironment(
        process.env.AUTHNET_ENVIRONMENT === 'production'
            ? 'https://api2.authorize.net/xml/v1/request.api'
            : 'https://apitest.authorize.net/xml/v1/request.api'
    );

    ctrl.execute(() => {
        const apiResponse = ctrl.getResponse();
        const response = new APIContracts.CreateTransactionResponse(apiResponse);

        if (response && response.getMessages().getResultCode() === APIContracts.MessageTypeEnum.OK) {
            const transId = response.getTransactionResponse().getTransId();
            return res.status(200).json({
                success: true,
                transactionId: transId,
                message: "Payment successful."
            });
        } else {
            const errorMsg =
                response.getTransactionResponse()?.getErrors()?.getError()[0]?.getErrorText() ||
                "Transaction failed";
            return res.status(400).json({
                success: false,
                message: errorMsg
            });
        }
    });
};
