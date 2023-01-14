import {
  AppShell,
  Center,
  Header,
  MediaQuery,
  Tabs,
  Image,
  Group,
  Title,
  Grid,
  Card,
  Button,
  Text,
  Timeline,
  TextInput,
  Paper,
  Flex,
  Avatar,
  Tooltip,
  Divider,
  Popover,
  ActionIcon
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconClock,
  IconCross,
  IconPlus,
  IconUser,
  IconUserPlus,
  IconX
} from "@tabler/icons";
import { FirebaseApp } from "firebase/app";
import { StudentView } from "./StudentView";
import { Calendar, DatePicker, TimeRangeInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  onSnapshot,
  query,
  setDoc,
  where
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { ILesson } from "../types/ILesson";
import { useForm } from "@mantine/form";
import { getPartOfDay } from "../utils/getPartOfDay";
import {
  addHours,
  addMinutes,
  format,
  getMinutes,
  setHours,
  setMinutes,
  sub
} from "date-fns";
import { showNotification } from "@mantine/notifications";
import { IUser } from "../types/IUser";
import { openConfirmModal } from "@mantine/modals";

export interface AdminViewProps {
  app: FirebaseApp;
}

export const AdminView = ({ app }: AdminViewProps) => {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<IUser[]>([]);

  const [creatingLesson, setCreatingLesson] = useState<boolean>(false);

  useEffect(() => {
    if (auth.currentUser) {
      onSnapshot(
        query(
          collection(db, "lessons"),
          where("teacherId", "==", auth.currentUser.uid)
        ),
        (l) => {
          setLessons(
            l.docs.map((l) => ({
              id: l.id,
              location: l.data().location,
              teacherId: l.data().teacherId,
              studentId: l.data().studentId,
              simpleTime: l.data().simpleTime,
              startTime: l.data().startTime.toDate(),
              endTime: l.data().endTime.toDate()
            }))
          );

          setStudentIds([
            ...new Set(
              l.docs.map((d) => d.data().studentId).filter((s) => s !== null)
            )
          ]);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (studentIds.length > 0) {
      Promise.all(studentIds.map((id) => getDoc(doc(db, "users", id)))).then(
        (students) => {
          setStudents(
            students.map((s) => ({
              id: s.id,
              name: s.data()?.name,
              pronouns: s.data()?.pronouns,
              instrument: s.data()?.instrument,
              phoneNumber: s.data()?.phoneNumber
            }))
          );
        }
      );
    }
  }, [studentIds]);

  const form = useForm({
    initialValues: {
      day: new Date(),
      time: [new Date(), addMinutes(new Date(), 30)],
      location: "Band Room"
    }
  });

  return (
    <Tabs defaultValue="lessons">
      <Tabs.List>
        <Tabs.Tab value="student" icon={<IconUser />}>
          Student View
        </Tabs.Tab>
        <Tabs.Tab value="lessons" icon={<IconCalendarEvent />}>
          Lesson Schedule
        </Tabs.Tab>
        <Tabs.Tab value="add" icon={<IconPlus />}>
          Add Lessons
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="student" pt="xs">
        <StudentView app={app} />
      </Tabs.Panel>

      <Tabs.Panel value="lessons" pt="xs">
        <Title>Upcoming Lessons</Title>

        <Grid mt="sm">
          {lessons
            .filter((l) => l.studentId !== null)
            .map((l) => (
              <Grid.Col sm={12} md="content" key={l.id}>
                <Paper withBorder p="lg" key={l.id}>
                  <Group position="apart">
                    <Title size={20}>
                      {l.simpleTime}, {format(l.startTime, "MMMM do")}
                    </Title>
                    <Text>
                      with{" "}
                      <Popover shadow="md" withArrow position="top">
                        <Popover.Target>
                          <Text td="underline" component="span">
                            {students.find((s) => s.id === l.studentId)?.name}
                          </Text>
                        </Popover.Target>
                        <Popover.Dropdown>
                          <Text>
                            {
                              students.find((s) => s.id === l.studentId)
                                ?.pronouns
                            }
                            ,{" "}
                            {
                              students.find((s) => s.id === l.studentId)
                                ?.instrument
                            }
                          </Text>
                        </Popover.Dropdown>
                      </Popover>{" "}
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
                    <ActionIcon
                      color="red"
                      onClick={() => {
                        openConfirmModal({
                          title: "Cancel Lesson",
                          centered: true,
                          children: (
                            <Text size="sm">
                              Are you sure that you want to cancel this lesson?
                              If this lesson is registered to a user, they will
                              be notified.
                            </Text>
                          ),
                          labels: {
                            confirm: "Cancel Lesson",
                            cancel: "Nevermind"
                          },
                          confirmProps: { color: "red" },
                          onConfirm: () => deleteDoc(doc(db, "lessons", l.id))
                        });
                      }}
                    >
                      <IconX />
                    </ActionIcon>
                  </Group>
                </Paper>
              </Grid.Col>
            ))}
        </Grid>
        <Divider my="md" />
        <Title size={20}>Empty Lessons</Title>
      </Tabs.Panel>

      <Tabs.Panel value="add" pt="xs">
        <Title>Add Lessons Spots</Title>
        <Grid>
          <Grid.Col sm={12} md={6}>
            <Paper withBorder p="lg" mb="md" mt="xl">
              <Grid>
                <Grid.Col span={4}>
                  <Avatar style={{ height: "100%", width: "100%" }} />
                </Grid.Col>
                <Grid.Col span={8}>
                  <Title size={20}>
                    {getPartOfDay(form.values.time[0])},{" "}
                    {format(form.values.day, "MMMM do")}
                  </Title>
                  <Text>In the {form.values.location}</Text>
                  <Text color="dimmed">
                    <Group spacing="xs">
                      <IconClock />{" "}
                      <Text m={0}>
                        {getMinutes(
                          form.values.time[1].getTime() -
                            form.values.time[0].getTime()
                        )}{" "}
                        mins
                      </Text>
                    </Group>
                  </Text>
                </Grid.Col>
              </Grid>
            </Paper>
            <Center>
              <Text>Preview</Text>
            </Center>
          </Grid.Col>
          <Grid.Col sm={12} md={6}>
            <form
              onSubmit={form.onSubmit((data) => {
                setCreatingLesson(true);
                addDoc(collection(db, "lessons"), {
                  location: data.location,
                  teacherId: auth.currentUser?.uid,
                  studentId: null,
                  simpleTime: getPartOfDay(form.values.time[0]),
                  startTime: setHours(
                    setMinutes(
                      form.values.day,
                      form.values.time[0].getMinutes()
                    ),
                    form.values.time[0].getHours()
                  ),
                  endTime: setHours(
                    setMinutes(
                      form.values.day,
                      form.values.time[1].getMinutes()
                    ),
                    form.values.time[1].getHours()
                  )
                } as ILesson).then(() => {
                  showNotification({
                    title: "Lesson Created Successfully!",
                    message: "The lesson has been sent out for public viewing!"
                  });
                  setCreatingLesson(false);
                  form.reset();
                });
              })}
            >
              <DatePicker
                placeholder="Pick date"
                label="Day"
                withAsterisk
                firstDayOfWeek="sunday"
                {...form.getInputProps("day")}
              />
              <TimeRangeInput
                label="Time"
                format="12"
                {...form.getInputProps("time")}
              />

              <TextInput
                label="Location"
                placeholder="Band Room"
                {...form.getInputProps("location")}
              />

              <Group position="right" mt="sm">
                <Button
                  type="submit"
                  loading={creatingLesson}
                  disabled={creatingLesson}
                >
                  Create Lesson
                </Button>
              </Group>
            </form>
          </Grid.Col>
        </Grid>
      </Tabs.Panel>
    </Tabs>
  );
};
