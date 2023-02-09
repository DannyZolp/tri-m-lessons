import {
  Grid,
  Title,
  Text,
  Card,
  Image,
  Button,
  LoadingOverlay,
  Group,
  Badge,
  Center,
  Paper,
  Divider,
  ActionIcon,
  Container
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { grammaticallyCorrectJoin } from "../utils/gramaticallyCorrectJoin";
import { useEffect, useState } from "react";
import { ITeacher } from "../types/ITeacher";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref } from "firebase/storage";
import { ViewLessonsModal } from "../modals/ViewLessons";
import { ILesson } from "../types/ILesson";
import { format, getMinutes, subDays } from "date-fns";
import { IconClock, IconX } from "@tabler/icons";
import { showNotification } from "@mantine/notifications";
import { openConfirmModal } from "@mantine/modals";

interface StudentViewProps {
  app: FirebaseApp;
}

export const StudentView = ({ app }: StudentViewProps) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<string[]>([]);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [viewingTeacher, setViewingTeacher] = useState<ITeacher>();
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    getDocs(collection(db, "teachers")).then((res) => {
      Promise.all(
        res.docs.map(async (t) => ({
          ...t.data(),
          id: t.id,
          image: await getDownloadURL(ref(storage, t.data().image))
        }))
      ).then((t) => {
        setTeachers(t as ITeacher[]);

        onSnapshot(
          query(
            collection(db, "lessons"),
            where("studentId", "==", null),
            where("startTime", ">", new Date())
          ),
          (res) => {
            const teachersAvailable = [] as string[];

            for (const lesson of res.docs) {
              if (!teachersAvailable.includes(lesson.data().teacherId)) {
                teachersAvailable.push(lesson.data().teacherId);
              }
            }

            setAvailableTeachers(teachersAvailable);
          }
        );

        onSnapshot(
          query(
            collection(db, "lessons"),
            where("studentId", "==", auth.currentUser?.uid),
            where("startTime", ">", subDays(new Date(), 1))
          ),
          (res) => {
            setLessons(
              res.docs.map(
                (d) =>
                  ({
                    ...d.data(),
                    startTime: d.data().startTime.toDate(),
                    endTime: d.data().endTime.toDate(),
                    id: d.id
                  } as any)
              )
            );
            setLoading(false);
          }
        );
      });
    });
  }, []);

  const cancelLesson = (id: string) => {
    updateDoc(doc(db, "lessons", id), {
      studentId: null
    }).then(() => {
      showNotification({
        message: "Lesson cancelled"
      });
    });
  };

  return (
    <Container>
      <ViewLessonsModal
        app={app}
        teacher={viewingTeacher}
        opened={viewingTeacher !== undefined}
        setOpened={() => setViewingTeacher(undefined)}
      />
      {lessons.length <= 0 ? (
        <Center>
          <Text color="dimmed">Currently no lessons scheduled</Text>
        </Center>
      ) : (
        <>
          <Title>Upcoming Lessons</Title>

          <Grid mt="sm">
            {lessons.map((l) => (
              <Grid.Col sm={12} md={6} key={l.id}>
                <Paper withBorder p="lg" key={l.id}>
                  <Grid>
                    <Grid.Col span={3}>
                      <Image
                        radius="sm"
                        src={teachers.find((t) => t.id === l.teacherId)?.image}
                        height={80}
                      />
                    </Grid.Col>
                    <Grid.Col span="content">
                      <Title size={20}>
                        {l.simpleTime}, {format(l.startTime, "MMMM do")}
                      </Title>
                      <Text>
                        with {teachers.find((t) => t.id === l.teacherId)?.name}{" "}
                        @ {l.location}
                      </Text>
                      <Text color="dimmed">
                        <Group spacing="xs">
                          <IconClock />{" "}
                          <Text m={0}>
                            {getMinutes(
                              l.endTime.getTime() - l.startTime.getTime()
                            )}{" "}
                            mins ({format(l.startTime, "h:mm a")} -{" "}
                            {format(l.endTime, "h:mm a")})
                          </Text>
                        </Group>
                      </Text>
                    </Grid.Col>
                    <Grid.Col span="content">
                      <ActionIcon
                        color="red"
                        onClick={() => {
                          openConfirmModal({
                            title: "Cancel Lesson",
                            centered: true,
                            children: (
                              <Text size="sm">
                                Are you sure that you want to cancel this
                                lesson?
                              </Text>
                            ),
                            labels: {
                              confirm: "Cancel Lesson",
                              cancel: "Nevermind"
                            },
                            confirmProps: { color: "red" },
                            onConfirm: () => cancelLesson(l.id)
                          });
                        }}
                      >
                        <IconX />
                      </ActionIcon>
                    </Grid.Col>
                  </Grid>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </>
      )}
      <Divider my="lg" />
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
                {availableTeachers.includes(t.id) ? (
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
                disabled={!availableTeachers.includes(t.id)}
              >
                View Open Lessons
              </Button>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    </Container>
  );
};
