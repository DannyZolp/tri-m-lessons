import twilio from "twilio";

export const sendText = async (
  accountSid: string,
  messagingSid: string,
  apiKey: string,
  message: string,
  to: string
) => {
  try {
    const sms = twilio(accountSid, apiKey);

    await sms.messages.create({
      body: message,
      messagingServiceSid: messagingSid,
      to
    });

    return true;
  } catch {
    return false;
  }
};
