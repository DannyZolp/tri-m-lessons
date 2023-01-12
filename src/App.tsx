import {
  AppShell,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  Center,
  Container,
  Flex,
  Grid,
  Group,
  Header,
  Image,
  LoadingOverlay,
  MediaQuery,
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
import { useEffect, useState } from "react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore
} from "firebase/firestore";
import { User } from "./components/User";
import { NewUserModal } from "./modals/NewUser";
import { getStorage, ref, getDownloadURL } from "firebase/storage";
import { grammaticallyCorrectJoin } from "./utils/gramaticallyCorrectJoin";
import { useMediaQuery } from "@mantine/hooks";
import { StudentView } from "./views/StudentView";
import { AdminView } from "./views/AdminView";

export interface AppProps {
  app: FirebaseApp;
}

export const App = ({ app }: AppProps) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);
  const provider = new GoogleAuthProvider();

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [newUser, setNewUser] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>();
  const [adminView, setAdminView] = useState<boolean>(false);

  const largeScreen = useMediaQuery("(min-width: 900px)");

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setLoggedIn(true);
    } else {
      signInWithRedirect(auth, provider);
    }
  });

  useEffect(() => {
    if (loggedIn) {
      getDoc(doc(collection(db, "users"), auth.currentUser?.uid)).then(
        (res) => {
          if (res.exists()) {
            setUserData(res.data());
            auth.currentUser?.getIdTokenResult().then((res) => {
              if (res.claims.admin) {
                setAdminView(true);
                setLoading(false);
              } else {
                setAdminView(false);
                setLoading(false);
              }
            });
          } else {
            setNewUser(true);
            setLoading(false);
          }
        }
      );
    }
  }, [loggedIn]);

  return (
    <Container>
      <LoadingOverlay visible={loading} />
      <NewUserModal setOpened={setNewUser} opened={newUser} app={app} />
      <AppShell
        padding="md"
        header={
          <Header height={80} p="xs">
            <MediaQuery largerThan="md" styles={{ display: "none" }}>
              <Center>
                <Image
                  src={"logo.png"}
                  alt="west bend high school bands tri m logo"
                  height={50}
                  width={100}
                />
              </Center>
            </MediaQuery>

            <MediaQuery smallerThan="md" styles={{ display: "none" }}>
              <Group sx={{ height: "100%" }} px={20} position="apart">
                <img
                  src={"logo.png"}
                  alt="west bend high school bands tri m logo"
                  height="100%"
                />

                {loading ? null : (
                  <User
                    image={auth.currentUser?.photoURL ?? ""}
                    name={userData?.name ?? ""}
                    instrument={userData?.instrument ?? ""}
                  />
                )}
              </Group>
            </MediaQuery>
          </Header>
        }
      >
        {adminView ? <AdminView app={app} /> : <StudentView app={app} />}
      </AppShell>
    </Container>
  );
};
