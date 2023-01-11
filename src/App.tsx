import {
  AppShell,
  Avatar,
  Box,
  Container,
  Flex,
  Grid,
  Group,
  Header,
  LoadingOverlay,
  Navbar,
  Paper,
  Text,
  Title,
  UnstyledButton
} from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithRedirect
} from "firebase/auth";
import { useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore
} from "firebase/firestore";
import { User } from "./components/User";
import { NewUserModal } from "./modals/NewUser";

export interface AppProps {
  app: FirebaseApp;
}

export const App = ({ app }: AppProps) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();

  const [loading, setLoading] = useState<boolean>(true);
  const [newUser, setNewUser] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>();
  const [teachers, setTeachers] = useState<any[]>();

  onAuthStateChanged(auth, (user) => {
    if (user) {
      getDoc(doc(collection(db, "users"), user.uid)).then((res) => {
        if (res.exists()) {
          setUserData(res.data());

          getDocs(collection(db, "teachers")).then((teachers) => {
            setTeachers(teachers.docs);
            setLoading(false);
          });
        } else {
          setNewUser(true);
          setLoading(false);
        }
      });
    } else {
      signInWithRedirect(auth, provider);
    }
  });

  return (
    <Container>
      <LoadingOverlay visible={loading} />
      <NewUserModal setOpened={setNewUser} opened={newUser} app={app} />
      <AppShell
        padding="md"
        header={
          <Header height={80} p="xs">
            <Group sx={{ height: "100%" }} px={20} position="apart">
              <img
                src={"logo.png"}
                alt="west bend high school bands tri m logo"
                height="100%"
              />

              <User
                image={auth.currentUser?.photoURL ?? ""}
                name={userData.name ?? ""}
                instrument={userData.instrument ?? ""}
              />
            </Group>
          </Header>
        }
      >
        <Title>Schedule a Lesson</Title>
        <Text>
          You can schedule a lesson with any one of our Tri-M members from this
          page
        </Text>
        <Grid>
          {teachers?.map((t) => (
            <Paper p="sm" withBorder></Paper>
          ))}
        </Grid>
      </AppShell>
    </Container>
  );
};
