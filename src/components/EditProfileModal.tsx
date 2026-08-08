import { Avatar, Button, FileInput, Modal, PasswordInput, Stack, Text, TextInput } from "@mantine/core";
import { useEffect, useState } from "react";
import { notifications } from "@mantine/notifications";
import httpClient, { apiUrl } from "../config/ApiUrl";

export interface ProfileUser {
  _id: string;
  fullname: string;
  email?: string;
  photoUrl?: string;
  isGuest?: boolean;
}

interface EditProfileModalProps {
  opened: boolean;
  onClose: () => void;
  user: ProfileUser | null;
  onSaved: (user: ProfileUser) => void;
}

function EditProfileModal({
  opened,
  onClose,
  user,
  onSaved,
}: EditProfileModalProps) {
  const isGuest = !!user?.isGuest;
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!opened || !user) return;
    setFullName(user.fullname || "");
    setEmail(user.email || "");
    setCurrentPassword("");
    setNewPassword("");
    setPhoto(null);
  }, [opened, user]);

  const save = async () => {
    if (!user) return;
    if (!fullName.trim() || fullName.trim().length < 3) {
      notifications.show({
        color: "red",
        message: "Nom trop court (min 3)",
      });
      return;
    }

    if (isGuest) {
      onSaved({ ...user, fullname: fullName.trim() });
      notifications.show({ color: "green", message: "Nom invité mis à jour" });
      onClose();
      return;
    }

    try {
      setLoading(true);
      const form = new FormData();
      form.append("userId", user._id);
      form.append("fullName", fullName.trim());
      form.append("email", email.trim());
      if (currentPassword) form.append("currentPassword", currentPassword);
      if (newPassword) form.append("newPassword", newPassword);
      if (photo) form.append("image", photo);

      const { data } = await httpClient.put("/auth/profile", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onSaved(data.user);
      notifications.show({ color: "green", message: "Profil mis à jour" });
      onClose();
    } catch (e: any) {
      notifications.show({
        color: "red",
        message: e?.response?.data?.message || "Échec mise à jour",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Modifier le profil" centered>
      <Stack>
        {user?.photoUrl && !isGuest && (
          <Avatar src={apiUrl + user.photoUrl} size={64} radius="xl" />
        )}
        <TextInput
          label="Nom"
          value={fullName}
          onChange={(e) => setFullName(e.currentTarget.value)}
        />
        {!isGuest && (
          <>
            <TextInput
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <FileInput
              label="Photo"
              accept="image/*"
              placeholder="Changer la photo"
              value={photo}
              onChange={setPhoto}
            />
            <PasswordInput
              label="Mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.currentTarget.value)}
            />
            <PasswordInput
              label="Nouveau mot de passe"
              value={newPassword}
              onChange={(e) => setNewPassword(e.currentTarget.value)}
            />
          </>
        )}
        {isGuest && (
          <Text size="sm" c="dimmed">
            Invité : seul le nom change (session locale).
          </Text>
        )}
        <Button className="bg-blue-600" loading={loading} onClick={save}>
          Enregistrer
        </Button>
      </Stack>
    </Modal>
  );
}

export default EditProfileModal;
