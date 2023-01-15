import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { defineSecret } from "firebase-functions/v2/params";
import twilio from "twilio";
import { addMinutes } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
const twilioApiKey = defineSecret("TWILIO_API_KEY");
const manageTeachersPassword = defineSecret("MANAGE_TEACHERS_PASSWORD");

admin.initializeApp(functions.config().firebase);

export const deleteTeacher = functions
  .runWith({ secrets: [manageTeachersPassword.name] })
  .https.onCall(async (data, ctx) => {
    if (
      ctx.auth?.token.admin &&
      data.password === manageTeachersPassword.value()
    ) {
      await admin.firestore().collection("teachers").doc(data.id).delete();

      await admin.auth().setCustomUserClaims(data.id, { admin: false });

      return true;
    } else {
      return false;
    }
  });

export const addTeacher = functions
  .runWith({ secrets: [manageTeachersPassword.name] })
  .https.onCall(async (data, ctx) => {
    if (
      ctx.auth?.token.admin &&
      data.password === manageTeachersPassword.value()
    ) {
      await admin.firestore().collection("teachers").doc(data.id).create({
        description: data.description,
        image: data.image,
        instruments: data.instruments,
        name: data.name
      });

      await admin.auth().setCustomUserClaims(data.id, { admin: true });

      return true;
    } else {
      return false;
    }
  });

export const notifyUserOnCancel = functions
  .runWith({ secrets: [twilioApiKey.name] })
  .firestore.document("lessons/{lessonId}")
  .onDelete(async (lesson) => {
    const sms = twilio(
      "ACc922019f043701fb28aa3b0b5219e538",
      twilioApiKey.value()
    );

    const student = await admin
      .firestore()
      .collection("users")
      .doc(lesson.data().studentId)
      .get();

    if (student.data()?.phoneNumber) {
      const teacher = await admin
        .firestore()
        .collection("users")
        .doc(lesson.data().teacherId)
        .get();

      await sms.messages.create({
        body: `We're sorry, but ${
          teacher.data()?.name
        } had to cancel your lesson during ${
          lesson.data().simpleTime
        } (${formatInTimeZone(
          lesson.data().startTime.toDate(),
          "America/Chicago",
          "hh:mm a"
        )}) on ${formatInTimeZone(
          lesson.data().startTime.toDate(),
          "America/Chicago",
          "MMMM do"
        )}. Please contact them for further information on your cancellation`,
        messagingServiceSid: "MG8c76558f671d5bd05434de03b54584ba",
        to: student.data()?.phoneNumber
      });
    }
  });

export const notifyTeacherOfLessonUpdate = functions
  .runWith({ secrets: [twilioApiKey.name] })
  .firestore.document("lessons/{lessonId}")
  .onUpdate(async (change) => {
    const teacher = await admin
      .firestore()
      .collection("users")
      .doc(change.before.data().teacherId)
      .get();

    const sms = twilio(
      "ACc922019f043701fb28aa3b0b5219e538",
      twilioApiKey.value()
    );

    if (change.before.data().studentId === null) {
      // a user just signed up for this lesson
      const student = await admin
        .firestore()
        .collection("users")
        .doc(change.after.data().studentId)
        .get();

      await sms.messages.create({
        body: `${student.data()?.name} just signed up for your ${
          change.before.data().simpleTime
        } lesson on ${formatInTimeZone(
          change.before.data().startTime.toDate(),
          "America/Chicago",
          "MMMM do"
        )}`,
        messagingServiceSid: "MG8c76558f671d5bd05434de03b54584ba",
        to: teacher.data()?.phoneNumber
      });
    } else {
      // a user just cancelled this lesson
      const student = await admin
        .firestore()
        .collection("users")
        .doc(change.after.data().studentId)
        .get();

      await sms.messages.create({
        body: `${student.data()?.name} just cancelled their ${
          change.before.data().simpleTime
        } lesson on ${formatInTimeZone(
          change.before.data().startTime.toDate(),
          "America/Chicago",
          "MMMM do"
        )}`,
        messagingServiceSid: "MG8c76558f671d5bd05434de03b54584ba",
        to: teacher.data()?.phoneNumber
      });
    }
  });

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
            body: `Reminder: You have a lesson with ${
              teacher.data()?.name
            } starting ${doc.simpleTime} (${formatInTimeZone(
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
