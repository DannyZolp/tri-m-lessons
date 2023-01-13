import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { defineSecret } from "firebase-functions/v2/params";
import twilio from "twilio";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
const twilioApiKey = defineSecret("TWILIO_API_KEY");

admin.initializeApp(functions.config().firebase);

export const notifyUsersOfLessons = functions
  .runWith({ secrets: [twilioApiKey.name] })
  .pubsub.schedule("every 5 minutes")
  .onRun(async () => {
    const sms = twilio(
      "ACc922019f043701fb28aa3b0b5219e538",
      twilioApiKey.value()
    );

    const lessons = await admin
      .firestore()
      .collection("/lessons")
      .where("startTime", "<", addMinutes(new Date(), 20))
      .get();

    for (let i = 0; i < lessons.size; i++) {
      const doc = lessons.docs[i].data();

      if (doc.studentId === null) break;

      if (!doc.hasUserBeenNotified) {
        console.log(doc.startTime.toDate());

        // send the user a message
        const student = await admin
          .firestore()
          .collection("users")
          .doc(doc.studentId)
          .get();

        const teacher = await admin
          .firestore()
          .collection("users")
          .doc(doc.teacherId)
          .get();

        if (student.data()?.phoneNumber) {
          await sms.messages.create({
            body: `You have a lesson with ${teacher.data()?.name} starting ${
              doc.simpleTime
            } (${formatInTimeZone(
              doc.startTime.toDate(),
              "America/Chicago",
              "hh:mm a"
            )}) in the ${doc.location}`,
            messagingServiceSid: "MG8c76558f671d5bd05434de03b54584ba",
            to: student.data()?.phoneNumber
          });
        }

        if (teacher.data()?.phoneNumber) {
          await sms.messages.create({
            body: `You have a lesson with ${
              student.data()?.name
            } starting at ${formatInTimeZone(
              doc.startTime.toDate(),
              "America/Chicago",
              "hh:mm a"
            )}`,
            messagingServiceSid: "MG8c76558f671d5bd05434de03b54584ba",
            to: student.data()?.phoneNumber
          });
        }

        await admin
          .firestore()
          .collection("lessons")
          .doc(lessons.docs[i].id)
          .update({
            hasUserBeenNotified: true
          });
      }
    }

    return;
  });
