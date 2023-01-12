import {
  Grid,
  Title,
  Text,
  Card,
  Image,
  Button,
  LoadingOverlay,
  Group,
  Badge
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { grammaticallyCorrectJoin } from "../utils/gramaticallyCorrectJoin";
import { useEffect, useState } from "react";
import { ITeacher } from "../types/ITeacher";
import { getAuth } from "firebase/auth";
import {
  collection,
  getDocs,
  getFirestore,
  query,
  where
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ViewLessonsModal } from "../modals/ViewLessons";

interface StudentViewProps {
  app: FirebaseApp;
}

export const StudentView = ({ app }: StudentViewProps) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [viewingTeacher, setViewingTeacher] = useState<ITeacher>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getDocs(collection(db, "teachers")).then((res) => {
      Promise.all(
        res.docs.map(async (t) => ({
          ...t.data(),
          id: t.id,
          image: await getDownloadURL(ref(storage, t.data().image)),
          available:
            (
              await getDocs(
                query(
                  collection(db, "lessons"),
                  where("studentId", "==", null),
                  where("teacherId", "==", t.id),
                  where("startTime", ">", new Date())
                )
              )
            ).size > 0
        }))
      ).then((t) => {
        setTeachers(t as ITeacher[]);
        setLoading(false);
      });
    });
  }, []);

  return (
    <>
      <ViewLessonsModal
        app={app}
        teacher={viewingTeacher}
        opened={viewingTeacher !== undefined}
        setOpened={() => setViewingTeacher(undefined)}
      />
      <Title>Schedule a Lesson</Title>
      <Text>
        You can schedule a lesson with any one of our Tri-M members from this
        page
      </Text>
      <Grid mt="sm">
        <LoadingOverlay visible={loading} />
        {teachers?.map((t) => (
          <Grid.Col sm={12} md={4} key={t.id}>
            <Card shadow="sm" p="lg" radius="md" withBorder>
              <Card.Section>
                <Image src={t.image} height={250} alt={`${t.name} image`} />
              </Card.Section>
              <Group position="apart">
                <Text weight={500} mt="md">
                  {t.name}
                </Text>
                {t.available ? (
                  <Badge color="green">Available</Badge>
                ) : (
                  <Badge color="red">Booked</Badge>
                )}
              </Group>
              <Text size="xs" color="dimmed" weight={600}>
                {grammaticallyCorrectJoin(t.instruments)}
              </Text>

              <Text size="xs" color="dimmed">
                {t.description}
              </Text>

              <Button
                variant="light"
                color="blue"
                fullWidth
                mt="md"
                radius="md"
                onClick={() => {
                  setViewingTeacher(t);
                }}
                disabled={!t.available}
              >
                View Open Lessons
              </Button>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </>
  );
};
