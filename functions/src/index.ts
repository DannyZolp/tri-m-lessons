import * as functions from "firebase-functions";
import admin from "firebase-admin";
import { defineSecret } from "firebase-functions/v2/params";
import { addMinutes, isEqual } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { SecretParam } from "firebase-functions/lib/v2/params/types";
import { sendUpdates } from "./sendUpdates";

const twilioApiKey = defineSecret("TWILIO_API_KEY");
const twilioAccountSid = defineSecret("TWILIO_ACCOUNT_SID");
const twilioMessageSid = defineSecret("TWILIO_MESSAGE_SID");

const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmail = defineSecret("SENDGRID_FROM_EMAIL");

const sendingEmailsAndTextSecrets = [
  twilioApiKey.name,
  twilioAccountSid.name,
  twilioMessageSid.name,
  sendgridApiKey.name,
  sendgridFromEmail.name
];

const secrets = {
  twilioApiKey,
  twilioAccountSid,
  twilioMessageSid,
  sendgridApiKey,
  sendgridFromEmail
};

export interface ISecrets {
  twilioApiKey: SecretParam;
  twilioAccountSid: SecretParam;
  twilioMessageSid: SecretParam;
  sendgridApiKey: SecretParam;
  sendgridFromEmail: SecretParam;
}

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

export const deleteOverlappingLessons = functions
  .runWith({ secrets: [manageTeachersPassword.name] })
  .https.onCall(async (data, ctx) => {
    if (
      ctx.auth?.token.admin &&
      data.password === manageTeachersPassword.value()
    ) {
      const teacherLessons = await admin
        .firestore()
        .collection("lessons")
        .where("teacherId", "==", data.teacherId)
        .get();

      const startTimes: Date[] = [];
      const deletingLessons: string[] = [];

      for (let i = 0; i < teacherLessons.size; i++) {
        if (
          startTimes.findIndex((t) =>
            isEqual(t, teacherLessons.docs[i].data().startTime)
          ) > -1
        ) {
          deletingLessons.push(teacherLessons.docs[i].id);
        } else {
          startTimes.push(teacherLessons.docs[i].data().startTime);
        }
      }

      for (let i = 0; i < deletingLessons.length; i++) {
        await admin
          .firestore()
          .collection("lessons")
          .doc(deletingLessons[i])
          .delete();
      }

      return true;
    } else {
      return false;
    }
  });

export const notifyUserOnCancel = functions
  .runWith({ secrets: [...sendingEmailsAndTextSecrets] })
  .firestore.document("lessons/{lessonId}")
  .onDelete(async (lesson) => {
    const student = await admin
      .firestore()
      .collection("users")
      .doc(lesson.data().studentId)
      .get();
    const teacher = await admin
      .firestore()
      .collection("users")
      .doc(lesson.data().teacherId)
      .get();

    sendUpdates(
      student.data(),
      `We're sorry, but ${
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
      "Lesson Cancelation",
      secrets
    );
  });

export const notifyTeacherOfLessonUpdate = functions
  .runWith({ secrets: [...sendingEmailsAndTextSecrets] })
  .firestore.document("lessons/{lessonId}")
  .onUpdate(async (change) => {
    const teacher = await admin
      .firestore()
      .collection("users")
      .doc(change.before.data().teacherId)
      .get();

    if (change.before.data().studentId === null) {
      // a user just signed up for this lesson
      const student = await admin
        .firestore()
        .collection("users")
        .doc(change.after.data().studentId)
        .get();

      sendUpdates(
        teacher.data(),
        `${student.data()?.name} just signed up for your ${
          change.before.data().simpleTime
        } lesson on ${formatInTimeZone(
          change.before.data().startTime.toDate(),
          "America/Chicago",
          "MMMM do"
        )}`,
        "New Signup",
        secrets
      );
    } else {
      // a user just cancelled this lesson
      const student = await admin
        .firestore()
        .collection("users")
        .doc(change.before.data().studentId)
        .get();

      sendUpdates(
        teacher.data(),
        `${student.data()?.name} just cancelled their ${
          change.before.data().simpleTime
        } lesson on ${formatInTimeZone(
          change.before.data().startTime.toDate(),
          "America/Chicago",
          "MMMM do"
        )}`,
        "Lesson Cancellation",
        secrets
      );
    }
  });

export const notifyUsersOfLessons = functions
  .runWith({ secrets: [...sendingEmailsAndTextSecrets] })
  .pubsub.schedule("every 5 minutes")
  .onRun(async () => {
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

        sendUpdates(
          student.data(),
          `Reminder: You have a lesson with ${teacher.data()?.name} starting ${
            doc.simpleTime
          } (${formatInTimeZone(
            doc.startTime.toDate(),
            "America/Chicago",
            "hh:mm a"
          )}) in the ${doc.location}`,
          "Lesson Reminder",
          secrets
        );

        sendUpdates(
          teacher.data(),
          `You have a lesson with ${student.data()?.name} (${
            student.data()?.pronouns
          }) starting at ${formatInTimeZone(
            doc.startTime.toDate(),
            "America/Chicago",
            "hh:mm a"
          )}`,
          "Lesson Reminder",
          secrets
        );

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
