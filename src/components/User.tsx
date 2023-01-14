import { IconChevronRight, IconChevronLeft, IconLogout } from "@tabler/icons";
import {
  UnstyledButton,
  Group,
  Avatar,
  Text,
  Box,
  useMantineTheme,
  Menu
} from "@mantine/core";

interface UserProps {
  image: string;
  name: string;
  instrument: string;
  logout?: () => void;
  onClick?: () => void;
}

export const User = ({
  image,
  name,
  instrument,
  logout,
  onClick
}: UserProps) => {
  const theme = useMantineTheme();

  return (
    <Menu shadow="md" width={200}>
      <Menu.Target>
        <Box>
          <UnstyledButton
            sx={{
              display: "block",
              width: "100%",
              padding: theme.spacing.xs,
              borderRadius: theme.radius.sm,
              color:
                theme.colorScheme === "dark"
                  ? theme.colors.dark[0]
                  : theme.black,

              "&:hover": {
                backgroundColor:
                  theme.colorScheme === "dark"
                    ? theme.colors.dark[6]
                    : theme.colors.gray[0]
              }
            }}
            onClick={onClick}
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
      </Menu.Target>

      {logout ? (
        <Menu.Dropdown>
          <Menu.Label>Settings</Menu.Label>
          <Menu.Item icon={<IconLogout size={14} />} onClick={logout}>
            Logout
          </Menu.Item>
        </Menu.Dropdown>
      ) : null}
    </Menu>
  );
};
