import {
  AppShell,
  Button,
  Center,
  Container,
  Divider,
  Flex,
  Group,
  Header,
  Image,
  LoadingOverlay,
  MediaQuery,
  Title
} from "@mantine/core";
import { FirebaseApp, initializeApp } from "firebase/app";
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup
} from "firebase/auth";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getFirestore } from "firebase/firestore";
import { User } from "./components/User";
import { NewUserModal } from "./modals/NewUser";
import { StudentView } from "./views/StudentView";
import { AdminView } from "./views/AdminView";
import { ManageTeachersView } from "./views/ManageTeachersView";

export interface AppProps {
  app: FirebaseApp;
}

const LoadedApp = ({ app }: AppProps) => {
  const auth = getAuth(app);
  const db = getFirestore(app);
  const provider = new GoogleAuthProvider();

  const [loggedIn, setLoggedIn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [newUser, setNewUser] = useState<boolean>(false);
  const [userData, setUserData] = useState<any>();
  const [adminView, setAdminView] = useState<boolean>(false);

  onAuthStateChanged(auth, (user) => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
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
    } else {
      setLoading(false);
    }
  }, [loggedIn]);

  return (
    <>
      <LoadingOverlay visible={loading} />
      <NewUserModal setOpened={setNewUser} opened={newUser} app={app} />
      {loggedIn ? (
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
                      logout={() => auth.signOut()}
                    />
                  )}
                </Group>
              </MediaQuery>
            </Header>
          }
        >
          {window.location.pathname === "/teachers" && adminView ? (
            <ManageTeachersView app={app} />
          ) : adminView ? (
            <AdminView app={app} />
          ) : (
            <StudentView app={app} />
          )}
        </AppShell>
      ) : (
        <Flex
          style={{ height: "100vh" }}
          justify="center"
          align="center"
          direction="column"
        >
          <Image
            src={"logo.png"}
            alt="west bend high school bands tri m logo"
            width={200}
          />
          <Button
            mt="md"
            onClick={() => {
              signInWithPopup(auth, provider);
            }}
          >
            Sign in with Google
          </Button>
        </Flex>
      )}
    </>
  );
};

export const App = () => {
  const [app, setApp] = useState<FirebaseApp>();

  useEffect(() => {
    if (import.meta.env.DEV) {
      setApp(
        initializeApp({
          apiKey: import.meta.env.VITE_API_KEY,
          authDomain: import.meta.env.VITE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_APP_ID,
          measurementId: import.meta.env.VITE_MEASUREMENT_ID
        })
      );
    } else {
      fetch("/__/firebase/init.json")
        .then((res) => res.json())
        .then((json) => {
          setApp(initializeApp(json));
        });
    }
  }, []);

  return app ? <LoadedApp app={app} /> : null;
};
