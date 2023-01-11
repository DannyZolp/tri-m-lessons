import { IconChevronRight, IconChevronLeft } from "@tabler/icons";
import {
  UnstyledButton,
  Group,
  Avatar,
  Text,
  Box,
  useMantineTheme
} from "@mantine/core";

interface UserProps {
  image: string;
  name: string;
  instrument: string;
}

export const User = ({ image, name, instrument }: UserProps) => {
  const theme = useMantineTheme();

  return (
    <Box>
      <UnstyledButton
        sx={{
          display: "block",
          width: "100%",
          padding: theme.spacing.xs,
          borderRadius: theme.radius.sm,
          color:
            theme.colorScheme === "dark" ? theme.colors.dark[0] : theme.black,

          "&:hover": {
            backgroundColor:
              theme.colorScheme === "dark"
                ? theme.colors.dark[6]
                : theme.colors.gray[0]
          }
        }}
      >
        <Group>
          <Avatar src={image} radius="xl" />
          <Box sx={{ flex: 1 }}>
            <Text size="sm" weight={500}>
              {name}
            </Text>
            <Text color="dimmed" size="xs">
              {instrument}
            </Text>
          </Box>
        </Group>
      </UnstyledButton>
    </Box>
  );
};
