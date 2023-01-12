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
  Avatar
} from "@mantine/core";
import {
  IconCalendarEvent,
  IconClock,
  IconPlus,
  IconUser
} from "@tabler/icons";
import { FirebaseApp } from "firebase/app";
import { StudentView } from "./StudentView";
import { Calendar, DatePicker, TimeRangeInput } from "@mantine/dates";
import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
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

export interface AdminViewProps {
  app: FirebaseApp;
}

export const AdminView = ({ app }: AdminViewProps) => {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [date, setDate] = useState<Date | null>(new Date());
  const [lessons, setLessons] = useState<ILesson[]>([]);

  useEffect(() => {
    if (auth.currentUser) {
      getDocs(
        query(
          collection(db, "lessons"),
          where("teacherId", "==", auth.currentUser.uid)
        )
      ).then((l) => {
        setLessons(l.docs as any);
      });
    }
  }, []);

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
        <Grid>
          <Grid.Col span={6}>
            <Center>
              <Calendar value={date} onChange={setDate} />
            </Center>
          </Grid.Col>
          <Grid.Col span={6}>
            <Text weight={600}>{date?.toDateString()}</Text>
            <Timeline>
              <Timeline.Item title=""></Timeline.Item>
            </Timeline>
          </Grid.Col>
        </Grid>
      </Tabs.Panel>

      <Tabs.Panel value="add" pt="xs">
        <Title>Add Lessons Spots</Title>
        <Grid>
          <Grid.Col span={6}>
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
          <Grid.Col span={6}>
            <form
              onSubmit={form.onSubmit((data) => {
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
                <Button type="submit">Create Lesson</Button>
              </Group>
            </form>
          </Grid.Col>
        </Grid>
      </Tabs.Panel>
    </Tabs>
  );
};
