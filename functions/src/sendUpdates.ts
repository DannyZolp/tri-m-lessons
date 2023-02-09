import { ISecrets } from ".";
import { sendEmail } from "./sendEmail";
import { sendText } from "./sendText";

export const sendUpdates = (
  student: any,
  message: string,
  subject: string,
  {
    twilioAccountSid,
    twilioMessageSid,
    twilioApiKey,
    sendgridApiKey,
    sendgridFromEmail
  }: ISecrets
) => {
  switch (student.updatesVia) {
    case "both":
      sendText(
        twilioAccountSid.value(),
        twilioMessageSid.value(),
        twilioApiKey.value(),
        message,
        student.phoneNumber
      );
      sendEmail(
        sendgridApiKey.value(),
        student.email,
        sendgridFromEmail.value(),
        subject,
        message
      );
      break;
    case "text":
      sendText(
        twilioAccountSid.value(),
        twilioMessageSid.value(),
        twilioApiKey.value(),
        message,
        student.phoneNumber
      );
      break;
    case "email":
      sendEmail(
        sendgridApiKey.value(),
        student.email,
        sendgridFromEmail.value(),
        subject,
        message
      );
      break;
    default: {
      sendText(
        twilioAccountSid.value(),
        twilioMessageSid.value(),
        twilioApiKey.value(),
        message,
        student.phoneNumber
      );
      break;
    }
  }
};
