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
  ActionIcon,
  Select,
  SegmentedControl,
  Input
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
  addBusinessDays,
  addDays,
  addHours,
  addMinutes,
  addMonths,
  addWeeks,
  differenceInBusinessDays,
  differenceInMonths,
  differenceInWeeks,
  format,
  getMinutes,
  set,
  setHours,
  setMinutes,
  sub,
  subDays
} from "date-fns";
import { showNotification } from "@mantine/notifications";
import { IUser } from "../types/IUser";
import { openConfirmModal } from "@mantine/modals";
import { getHoursToStartEndTime } from "../utils/getHoursToStartEndTime";

export interface AdminViewProps {
  app: FirebaseApp;
}

const repeatOptions = ["never", "every day", "every week", "every month"];

export const AdminView = ({ app }: AdminViewProps) => {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [emptyLessonDay, setEmptyLessonDay] = useState<Date>(new Date());
  const [emptyLessons, setEmptyLessons] = useState<ILesson[]>([]);

  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [studentIds, setStudentIds] = useState<string[]>([]);
  const [students, setStudents] = useState<IUser[]>([]);
  const [simpleTime, setSimpleTime] = useState<string>("1st");

  const [creatingLesson, setCreatingLesson] = useState<boolean>(false);

  useEffect(() => {
    if (auth.currentUser) {
      onSnapshot(
        query(
          collection(db, "lessons"),
          where("teacherId", "==", auth.currentUser.uid),
          where("studentId", "!=", null)
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
    getDocs(
      query(
        collection(db, "lessons"),
        where("teacherId", "==", auth.currentUser?.uid),
        where("startTime", ">", set(emptyLessonDay, { hours: 0, minutes: 0 })),
        where("startTime", "<", set(emptyLessonDay, { hours: 23, minutes: 59 }))
      )
    ).then((res) => {
      setEmptyLessons(
        res.docs.map((l) => ({
          id: l.id,
          location: l.data().location,
          teacherId: l.data().teacherId,
          studentId: l.data().studentId,
          simpleTime: l.data().simpleTime,
          startTime: l.data().startTime.toDate(),
          endTime: l.data().endTime.toDate()
        }))
      );
    });
  }, [emptyLessonDay]);

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
      day: set(new Date(), { hours: 0, minutes: 0 }),
      time: [new Date(), addMinutes(new Date(), 30)],
      location: "Band Room",
      repeat: "never"
    },
    validate: {
      day: (v) =>
        v.getTime() >
        set(subDays(new Date(), 1), { hours: 23, minutes: 59 }).getTime()
          ? null
          : "The lesson must be scheduled for a time later than now",
      time: (v) =>
        v[1].getTime() > v[0].getTime()
          ? null
          : simpleTime !== "Custom"
          ? "The end time must be later than the start"
          : null,
      location: (v) =>
        v.length > 0 ? null : "Please enter a location for the lesson"
    }
  });

  const createLesson = async (
    startTime: Date,
    endTime: Date,
    location: string,
    repeat: string
  ) => {
    setCreatingLesson(true);

    const lessonStartTimes = [startTime];
    const lessonEndTimes = [endTime];

    switch (repeat) {
      case "every day":
        for (
          let i = 0;
          i < differenceInBusinessDays(new Date(2023, 5, 8), startTime);
          i++
        ) {
          lessonStartTimes.push(addBusinessDays(startTime, i));
          lessonEndTimes.push(addBusinessDays(endTime, i));
        }
        break;
      case "every week":
        for (
          let i = 0;
          i < differenceInWeeks(new Date(2023, 5, 8), startTime);
          i++
        ) {
          lessonStartTimes.push(addWeeks(startTime, i));
          lessonEndTimes.push(addWeeks(endTime, i));
        }
        break;
      case "every month":
        for (
          let i = 0;
          i < differenceInMonths(new Date(2023, 5, 8), startTime);
          i++
        ) {
          lessonStartTimes.push(addMonths(startTime, i));
          lessonEndTimes.push(addMonths(endTime, i));
        }
        break;
    }

    for (let i = 0; i < lessonStartTimes.length; i++) {
      await addDoc(collection(db, "lessons"), {
        location,
        teacherId: auth.currentUser?.uid,
        studentId: null,
        simpleTime: getPartOfDay(lessonStartTimes[i]),
        startTime: lessonStartTimes[i],
        endTime: lessonEndTimes[i]
      });
    }

    showNotification({
      message: `Successfully created lesson${
        lessonStartTimes.length > 1 ? "s" : ""
      }!`
    });
    setCreatingLesson(false);
  };

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
        {lessons.filter((l) => l.studentId !== null).length === 0 ? (
          <Text my="md" ta="center" color="dimmed">
            No lessons scheduled
          </Text>
        ) : null}

        <Grid mt="sm">
          {lessons
            .filter((l) => l.studentId !== null)
            .map((l) => (
              <Grid.Col sm={12} md="content" key={l.id}>
                <Paper withBorder p="lg" key={l.id}>
                  <Group position="apart">
                    <div>
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
                    </div>
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
        <Grid>
          <Grid.Col sm={12} md={4}>
            <Calendar
              value={emptyLessonDay}
              onChange={(d) => setEmptyLessonDay(d !== null ? d : new Date())}
              firstDayOfWeek="sunday"
            />
          </Grid.Col>
          <Grid.Col sm={12} md={8}>
            {emptyLessons.length <= 0 ? (
              <Text color="dimmed" ta="center">
                No lessons found for {format(emptyLessonDay, "MMMM do")}
              </Text>
            ) : null}
            <Grid mt="sm">
              {emptyLessons.map((l) => (
                <Grid.Col sm={12} md="content" key={l.id}>
                  <Paper withBorder p="sm" key={l.id}>
                    <Group position="apart">
                      <div>
                        <Title size={16}>
                          {l.simpleTime}, {format(l.startTime, "MMMM do")}
                        </Title>
                        <Text size="xs">
                          with{" "}
                          <Popover shadow="md" withArrow position="top">
                            <Popover.Target>
                              <Text td="underline" component="span">
                                {
                                  students.find((s) => s.id === l.studentId)
                                    ?.name
                                }
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
                        <Text size="xs" color="dimmed">
                          <Text m={0}>
                            {getMinutes(
                              l.endTime.getTime() - l.startTime.getTime()
                            )}{" "}
                            mins ({format(l.startTime, "h:mm a")} -{" "}
                            {format(l.endTime, "h:mm a")})
                          </Text>
                        </Text>
                      </div>
                      <ActionIcon
                        color="red"
                        onClick={() => {
                          openConfirmModal({
                            title: "Cancel Lesson",
                            centered: true,
                            children: (
                              <Text size="sm">
                                Are you sure that you want to cancel this
                                lesson? If this lesson is registered to a user,
                                they will be notified.
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
          </Grid.Col>
        </Grid>
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
                    {simpleTime === "Custom"
                      ? getPartOfDay(form.values.time[0])
                      : `${simpleTime}${
                          simpleTime === "Resource"
                            ? ""
                            : simpleTime === "Lunch"
                            ? ""
                            : " Hour"
                        }`}
                    , {format(form.values.day, "MMMM do")}
                  </Title>
                  <Text>In the {form.values.location}</Text>
                  <Text color="dimmed">
                    <Group spacing="xs">
                      <IconClock />{" "}
                      <Text m={0}>
                        {simpleTime === "Custom"
                          ? getMinutes(
                              form.values.time[1].getTime() -
                                form.values.time[0].getTime()
                            )
                          : simpleTime === "Resource"
                          ? "30"
                          : simpleTime === "Lunch"
                          ? "30"
                          : "45"}{" "}
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
                if (simpleTime === "Custom") {
                  createLesson(
                    setHours(
                      setMinutes(
                        form.values.day,
                        form.values.time[0].getMinutes()
                      ),
                      form.values.time[0].getHours()
                    ),
                    setHours(
                      setMinutes(
                        form.values.day,
                        form.values.time[1].getMinutes()
                      ),
                      form.values.time[1].getHours()
                    ),
                    data.location,
                    data.repeat
                  );
                } else {
                  const times = getHoursToStartEndTime(
                    data.day,
                    simpleTime as any
                  );
                  createLesson(times[0], times[1], data.location, data.repeat);
                }
              })}
            >
              <DatePicker
                placeholder="Pick date"
                label="Day"
                withAsterisk
                firstDayOfWeek="sunday"
                clearable={false}
                {...form.getInputProps("day")}
              />

              <Input.Wrapper label="Hour" withAsterisk>
                <SegmentedControl
                  size="xs"
                  fullWidth
                  data={[
                    "1st",
                    "2nd",
                    "Resource",
                    "3rd",
                    "4th",
                    "5th",
                    "Lunch",
                    "6th",
                    "7th",
                    "Custom"
                  ]}
                  onChange={(s) => setSimpleTime(s)}
                  value={simpleTime}
                />
              </Input.Wrapper>

              {simpleTime === "Custom" ? (
                <TimeRangeInput
                  label="Custom Time"
                  withAsterisk
                  format="12"
                  {...form.getInputProps("time")}
                />
              ) : null}

              <TextInput
                label="Location"
                placeholder="Band Room"
                withAsterisk
                {...form.getInputProps("location")}
              />

              <Select
                label="Repeat"
                placeholder="Week"
                data={repeatOptions}
                withAsterisk
                {...form.getInputProps("repeat")}
              />

              <Group position="right" mt="sm">
                <Button
                  type="submit"
                  loading={creatingLesson}
                  disabled={creatingLesson}
                >
                  Create Lesson{form.values.repeat !== "never" ? "s" : ""}
                </Button>
              </Group>
            </form>
          </Grid.Col>
        </Grid>
      </Tabs.Panel>
    </Tabs>
  );
};
