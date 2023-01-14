import { Button, Grid, Group, Modal, Select, TextInput } from "@mantine/core";
import { FirebaseApp } from "firebase/app";
import { useForm } from "@mantine/form";
import { useState } from "react";
import { doc, setDoc, getFirestore, collection } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import phone from "phone";

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

  const [pronounOptions, setPronounOptions] = useState([
    "he/him",
    "he/they",
    "she/her",
    "she/they",
    "they/them"
  ]);

  const [saving, setSaving] = useState<boolean>(false);

  const form = useForm({
    initialValues: {
      name: "",
      pronouns: "",
      phoneNumber: "",
      instrument: ""
    },
    validate: {
      name: (v) => (v.length > 0 ? null : "Please provide a name"),
      pronouns: (v) =>
        v.length > 0 ? null : "Please select or add your preferred pronouns",
      instrument: (v) =>
        v.length > 0 ? null : "Please select your instrument",
      phoneNumber: (v) =>
        phone(v).isValid ? null : "Please enter a valid phone number"
    }
  });

  const handleSubmit = (values: any) => {
    setSaving(true);
    setDoc(doc(collection(db, "users"), auth.currentUser?.uid ?? ""), {
      ...values,
      phoneNumber: phone(values.phoneNumber).phoneNumber
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

        <Select
          label="Preferred Pronouns"
          data={pronounOptions}
          placeholder="Select one"
          nothingFound="Nothing found"
          searchable
          creatable
          getCreateLabel={(query) => `+ Create ${query}`}
          onCreate={(query) => {
            setPronounOptions([...pronounOptions, query]);
            return query;
          }}
          {...form.getInputProps("pronouns")}
        />

        <TextInput
          label="Phone number"
          placeholder="262-123-4567"
          description="If you wish to receive updates of your lessons via text messages, enter your phone number here. Standard texting and data rates may apply."
          {...form.getInputProps("phoneNumber")}
        />

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
