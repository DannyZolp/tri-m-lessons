import { Button, Grid, Group, Modal, Select, TextInput } from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { doc, setDoc, getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";

interface NewUserModalProps {
  app: FirebaseApp;
  opened: boolean;
  setOpened: (to: boolean) => void;
}

const instruments = [
  "Flute",
  "Oboe",
  "Clarinet",
  "Bass Clarinet",
  "Alto Saxophone",
  "Tenor Saxophone",
  "Bari Saxophone",
  "Trumpet",
  "F Horn",
  "Trombone",
  "Baritone",
  "Tuba",
  "General Percussion",
  "Mallets"
];

export const NewUserModal = ({ app, opened, setOpened }: NewUserModalProps) => {
  const db = getFirestore(app);
  const auth = getAuth(app);

  const [personalPronounOne, setPersonalPronounOne] = useState([
    "He",
    "She",
    "They"
  ]);
  const [personalPronounTwo, setPersonalPronounTwo] = useState([
    "Him",
    "Her",
    "Them"
  ]);
  const [saving, setSaving] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      name: "",
      pronounOne: "",
      pronounTwo: "",
      instrument: ""
    },
    validate: {
      name: (v) => (v.length > 0 ? null : "Please provide a name"),
      pronounOne: (v) =>
        v.length > 0 ? null : "Please select a preferred pronoun",
      pronounTwo: (v) =>
        v.length > 0 ? null : "Please select a preferred pronoun",
      instrument: (v) => (v.length > 0 ? null : "Please select your instrument")
    }
  });

  const handleSubmit = (values: any) => {
    setSaving(true);
    setDoc(doc(collection(db, "users"), auth.currentUser?.uid ?? ""), {
      id: auth.currentUser?.uid,
      ...values
    }).then(() => {
      setOpened(false);
    });
  };

  return (
    <Modal opened={opened} onClose={() => null} title="Setup Profile">
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <TextInput
          withAsterisk
          label="Preferred Name"
          placeholder="e.g., John instead of Johnathan"
          {...form.getInputProps("name")}
        />

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Personal Pronoun 1"
              data={personalPronounOne}
              placeholder="Select one"
              nothingFound="Nothing found"
              searchable
              creatable
              getCreateLabel={(query) => `+ Create ${query}`}
              onCreate={(query) => {
                setPersonalPronounOne([...personalPronounOne, query]);
                return query;
              }}
              {...form.getInputProps("pronounOne")}
            />
          </Grid.Col>

          <Grid.Col span={6}>
            <Select
              label="Personal Pronoun 2"
              data={personalPronounTwo}
              placeholder="Select one"
              nothingFound="Nothing found"
              searchable
              creatable
              getCreateLabel={(query) => `+ Create ${query}`}
              onCreate={(query) => {
                setPersonalPronounTwo([...personalPronounTwo, query]);
                return query;
              }}
              {...form.getInputProps("pronounTwo")}
            />
          </Grid.Col>
        </Grid>

        <Select
          label="Main Instrument"
          withAsterisk
          placeholder="Pick one"
          data={instruments}
          {...form.getInputProps("instrument")}
        />

        <Button type="submit" mt="sm" loading={saving}>
          Save
        </Button>
      </form>
    </Modal>
  );
};
