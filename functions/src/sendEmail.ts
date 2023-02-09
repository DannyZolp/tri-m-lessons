import sgMail from "@sendgrid/mail";

export const sendEmail = async (
  sgApiKey: string,
  to: string,
  from: string,
  subject: string,
  html: string
) => {
  try {
    sgMail.setApiKey(sgApiKey);

    await sgMail.send({
      to,
      from,
      subject,
      html
    });
    return true;
  } catch (e) {
    return false;
  }
};
