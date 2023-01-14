import {
  Button,
  Container,
  Divider,
  FileInput,
  Grid,
  Group,
  MultiSelect,
  PasswordInput,
  ScrollArea,
  Text,
  TextInput,
  Textarea,
  Title
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  getFirestore,
  setDoc
} from "firebase/firestore";
import { useEffect, useState } from "react";
import { IUser } from "../types/IUser";
import { ITeacher } from "../types/ITeacher";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { User } from "../components/User";
import { instruments } from "../modals/NewUser";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useForm } from "@mantine/form";
import { showNotification } from "@mantine/notifications";

interface ManageTeachersViewProps {
  app: FirebaseApp;
}

export const ManageTeachersView = ({ app }: ManageTeachersViewProps) => {
  const functions = getFunctions(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  const deleteTeacher = httpsCallable(functions, "deleteTeacher");
  const addTeacher = httpsCallable(functions, "addTeacher");

  const [users, setUsers] = useState<IUser[]>([]);
  const [teachers, setTeachers] = useState<ITeacher[]>([]);
  const [activeUser, setActiveUser] = useState<string>("");
  const [creatingTeacher, setCreatingTeacher] = useState<boolean>(false);
  const [password, setPassword] = useState<string>("");

  const form = useForm({
    initialValues: {
      name: "",
      description: "",
      instruments: [],
      imageFile: new File([], "")
    }
  });

  useEffect(() => {
    getDocs(collection(db, "users")).then((users) => {
      setUsers(users.docs.map((u) => ({ id: u.id, ...u.data() } as any)));

      getDocs(collection(db, "teachers")).then((teachers) => {
        Promise.all(
          teachers.docs.map(
            async (t) =>
              ({
                ...t.data(),
                id: t.id,
                image: await getDownloadURL(ref(storage, t.data().image))
              } as any)
          )
        ).then(setTeachers);
      });
    });
  }, []);

  return (
    <Container>
      <Title>Manage Teachers</Title>
      <PasswordInput
        label="Management Password"
        withAsterisk
        description="This is the password that allows users to save changes"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        mb="md"
      />
      <Grid>
        <Grid.Col span={6}>
          <ScrollArea>
            {users.map((u) => (
              <User
                image={teachers.find((t) => t.id === u.id)?.image ?? ""}
                name={u.name}
                instrument={
                  teachers.find((t) => t.id === u.id) !== undefined
                    ? "Teacher"
                    : "Student"
                }
                onClick={() => setActiveUser(u.id)}
              />
            ))}
          </ScrollArea>
        </Grid.Col>
        <Grid.Col span={6}>
          {activeUser === "" ? (
            <Text ta="center">Nothing selected</Text>
          ) : (
            <>
              <Title>
                {users.find((u) => u.id === activeUser)?.name} (
                {teachers.find((t) => t.id === activeUser) !== undefined
                  ? "Teacher"
                  : "Student"}
                )
              </Title>
              <Divider my="md" />
              {teachers.find((t) => t.id === activeUser) !== undefined ? (
                <>
                  <Title size={20}>Teacher Settings</Title>

                  <Button
                    color="red"
                    mt="sm"
                    loading={creatingTeacher}
                    disabled={creatingTeacher}
                    onClick={() => {
                      setCreatingTeacher(true);
                      deleteTeacher({
                        password,
                        id: activeUser
                      }).then((res) => {
                        if (res) {
                          showNotification({
                            message: "Successfully deleted teacher!"
                          });
                          setCreatingTeacher(false);
                        } else {
                          showNotification({
                            color: "red",
                            message: "Error deleting teacher"
                          });
                          setCreatingTeacher(false);
                        }
                      });
                    }}
                  >
                    Remove Teacher
                  </Button>
                </>
              ) : (
                <>
                  <Title size={20}>Create Teacher Profile</Title>
                  <form
                    onSubmit={form.onSubmit((data) => {
                      setCreatingTeacher(true);
                      uploadBytes(
                        ref(storage, `/teachers/${data.imageFile.name}`),
                        data.imageFile
                      ).then((file) => {
                        addTeacher({
                          id: activeUser,
                          name: data.name,
                          image: file.ref.toString(),
                          instruments: data.instruments,
                          description: data.description,
                          password
                        }).then((res) => {
                          if (res) {
                            showNotification({
                              message: "User Created Successfully!"
                            });
                            setCreatingTeacher(false);
                            form.reset();
                          } else {
                            showNotification({
                              color: "red",
                              message: "Error creating teacher"
                            });
                            setCreatingTeacher(false);
                          }
                        });
                      });
                    })}
                  >
                    <TextInput
                      label="Name"
                      placeholder="The name that will be displayed on the teacher's profile"
                      withAsterisk
                      {...form.getInputProps("name")}
                    />

                    <Textarea
                      label="Description"
                      withAsterisk
                      {...form.getInputProps("description")}
                    />

                    <MultiSelect
                      label="Instruments"
                      data={instruments}
                      searchable
                      withAsterisk
                      {...form.getInputProps("instruments")}
                    />

                    <FileInput
                      placeholder="Pick File"
                      label="Profile Picture"
                      withAsterisk
                      {...form.getInputProps("imageFile")}
                    />

                    <Group position="right" mt="sm">
                      <Button
                        type="submit"
                        loading={creatingTeacher}
                        disabled={creatingTeacher}
                      >
                        Upgrade to Teacher
                      </Button>
                    </Group>
                  </form>
                </>
              )}
            </>
          )}
        </Grid.Col>
      </Grid>
    </Container>
  );
};
