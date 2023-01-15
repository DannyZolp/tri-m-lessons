import {
  Grid,
  Modal,
  Image,
  Card,
  Group,
  Text,
  ScrollArea,
  Paper,
  Title,
  Avatar,
  Badge
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { ITeacher } from "../types/ITeacher";
import { grammaticallyCorrectJoin } from "../utils/gramaticallyCorrectJoin";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  updateDoc,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ILesson } from "../types/ILesson";
import { getPartOfDay } from "../utils/getPartOfDay";
import { addWeeks, format, getMinutes } from "date-fns";
import { IconClock } from "@tabler/icons";
import { openConfirmModal } from "@mantine/modals";
import { getAuth } from "firebase/auth";

interface ViewLessonsModalProps {
  app: FirebaseApp;
  teacher?: ITeacher;
  opened: boolean;
  setOpened: (to: boolean) => void;
}

export const ViewLessonsModal = ({
  app,
  teacher,
  opened,
  setOpened
}: ViewLessonsModalProps) => {
  if (!teacher) return <></>;

  const db = getFirestore(app);
  const auth = getAuth(app);

  const [lessons, setLessons] = useState<ILesson[]>([]);

  const openModal = (lesson: ILesson) =>
    openConfirmModal({
      title: "Confirm Lesson",
      children: (
        <Text>
          Do you wish to sign up for a lesson with {teacher.name} from{" "}
          {format(lesson.startTime, "h:mm a")} -{" "}
          {format(lesson.endTime, "h:mm a")} on{" "}
          {format(lesson.startTime, "MMMM do")}?
        </Text>
      ),
      labels: { confirm: "Confirm", cancel: "Cancel" },
      onConfirm: async () => {
        await updateDoc(doc(collection(db, "lessons"), lesson.id), {
          studentId: auth.currentUser?.uid
        });
      }
    });

  useEffect(() => {
    if (opened) {
      onSnapshot(
        query(
          collection(db, "lessons"),
          where("teacherId", "==", teacher.id),
          where("studentId", "==", null),
          where("startTime", ">", new Date()),
          where("startTime", "<", addWeeks(new Date(), 2))
        ),
        (res) => {
          setLessons(
            res.docs.map(
              (d) =>
                ({
                  id: d.id,
                  ...d.data(),
                  startTime: d.data().startTime.toDate(),
                  endTime: d.data().endTime.toDate()
                } as any)
            )
          );
        }
      );
    }
  }, [teacher]);

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Get a Lesson"
    >
      <Badge
        sx={{ paddingLeft: 0 }}
        size="lg"
        radius="xl"
        color="teal"
        leftSection={
          <Avatar src={teacher.image} radius="xl" size={24} mr={5} />
        }
      >
        {teacher.name}
      </Badge>

      <Text ta="center" color="dimmed" my="md">
        Click a time to register for
      </Text>

      <Grid>
        {lessons.map((l) => (
          <Grid.Col span={12}>
            <Paper
              withBorder
              p="lg"
              onClick={() => openModal(l)}
              key={l.id}
              style={{ cursor: "pointer" }}
            >
              <Title size={20}>
                {l.simpleTime}, {format(l.startTime, "MMMM do")}
              </Title>
              <Text>{l.location}</Text>
              <Text color="dimmed">
                <Group spacing="xs">
                  <IconClock />{" "}
                  <Text m={0}>
                    {getMinutes(l.endTime.getTime() - l.startTime.getTime())}{" "}
                    mins ({format(l.startTime, "h:mm a")} -{" "}
                    {format(l.endTime, "h:mm a")})
                  </Text>
                </Group>
              </Text>
            </Paper>
          </Grid.Col>
        ))}
      </Grid>
    </Modal>
  );
};
