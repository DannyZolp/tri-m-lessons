import {
  Grid,
  Modal,
  Image,
  Card,
  Group,
  Text,
  ScrollArea
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { ITeacher } from "../types/ITeacher";
import { grammaticallyCorrectJoin } from "../utils/gramaticallyCorrectJoin";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { ILesson } from "../types/ILesson";

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

  const [lessons, setLessons] = useState<ILesson[]>([]);

  useEffect(() => {
    if (teacher) {
      getDocs(
        query(
          collection(db, "lessons"),
          where("teacherId", "==", teacher.id),
          where("startDate", ">", new Date())
        )
      ).then((res) => {
        setLessons(res.docs as any);
        console.log(lessons);
      });
    }
  }, [teacher]);

  return (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title="Get a Lesson"
    >
      <Grid>
        <Grid.Col sm={12} md={6}>
          <Card shadow="sm" p="lg" radius="md" withBorder>
            <Card.Section>
              <Image
                src={teacher.image}
                height={250}
                alt={`${teacher.name} image`}
              />
            </Card.Section>
            <Group position="apart">
              <Text weight={500} mt="md">
                {teacher.name}
              </Text>
            </Group>
            <Text size="xs" color="dimmed" weight={600}>
              {grammaticallyCorrectJoin(teacher.instruments)}
            </Text>

            <Text size="xs" color="dimmed">
              {teacher.description}
            </Text>
          </Card>
        </Grid.Col>
        <Grid.Col span={6}>
          {lessons.length <= 0 ? (
            <Text>Currently not available for lessons.</Text>
          ) : (
            <ScrollArea></ScrollArea>
          )}
        </Grid.Col>
      </Grid>
    </Modal>
  );
};
