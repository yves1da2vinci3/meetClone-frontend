import { Avatar, Button, LoadingOverlay, PasswordInput, TextInput } from "@mantine/core";
import { FormEvent, useRef, useState } from "react";
import { BsArrowLeft, BsPlus } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import httpClient from "../config/ApiUrl";
import MeetMark from "../assets/MeetMark";

function AuthSidePanel({
  title,
  bullets,
}: {
  title: string;
  bullets: string[];
}) {
  return (
    <div className="hidden md:flex w-[42%] min-h-screen bg-[#1a2332] text-white flex-col justify-center px-12">
      <div className="flex items-center gap-3 mb-8">
        <MeetMark className="h-8 w-8" />
        <span className="text-xl font-semibold">Meet</span>
      </div>
      <h1 className="text-3xl font-semibold leading-tight mb-8">{title}</h1>
      <ul className="space-y-3 text-slate-300 text-sm">
        {bullets.map((b) => (
          <li key={b} className="flex gap-2">
            <span className="text-[#1B73E8] mt-0.5">•</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Signup() {
  const [file, setFile] = useState<File | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const goStep2 = () => {
    let ok = true;
    if (!username.trim() || username.trim().length < 3) {
      setNameError("Min. 3 caractères");
      ok = false;
    } else setNameError("");
    if (!email || !isValidEmail(email)) {
      setEmailError("Email invalide");
      ok = false;
    } else setEmailError("");
    if (ok) setStep(2);
  };

  const passwordsMatch =
    password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;

  const SignupHandler = async () => {
    if (!password || password.length < 8) {
      notifications.show({
        title: "Inscription",
        color: "red",
        message: "Mot de passe : 8 caractères minimum.",
      });
      return;
    }
    if (password !== confirmPassword) {
      notifications.show({
        title: "Inscription",
        color: "red",
        message: "Les mots de passe ne correspondent pas.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      if (file) formData.append("image", file);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("fullName", username.trim());

      const response = await httpClient.post("/auth/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.status === 201) {
        notifications.show({
          title: "Inscription",
          color: "green",
          message: "Compte créé. Connectez-vous.",
        });
        navigate("/login");
      } else {
        notifications.show({
          title: "Inscription",
          color: "red",
          message: response.data?.message || "Échec",
        });
      }
    } catch (error: any) {
      notifications.show({
        title: "Inscription",
        color: "red",
        message: error?.response?.data?.message || "Erreur serveur",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6f8]">
      <AuthSidePanel
        title="Créez votre compte Meet"
        bullets={[
          "Rejoignez ou créez une salle en quelques secondes",
          "Contrôles organisateur (mute, kick, admission)",
          "Chat, sondages et partage d’écran",
        ]}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <MeetMark className="h-7 w-7" />
            <span className="font-semibold">Meet</span>
          </div>
          <h2 className="text-2xl font-semibold mb-1">Inscription</h2>
          <p className="text-sm text-gray-500 mb-4">Étape {step} sur 2</p>
          <div className="h-1 w-full bg-gray-100 rounded mb-6 overflow-hidden">
            <div
              className="h-full bg-[#1B73E8] transition-all"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>

          {step === 1 ? (
            <div className="flex flex-col gap-4">
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="relative h-[88px] w-[88px]">
                  <Avatar
                    size={88}
                    radius={88}
                    src={
                      file
                        ? URL.createObjectURL(file)
                        : "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                  />
                  <button
                    type="button"
                    onClick={() => fileInput.current?.click()}
                    className="absolute bottom-0 right-0 h-8 w-8 bg-[#1B73E8] rounded-full flex items-center justify-center"
                  >
                    <BsPlus size={22} color="white" />
                  </button>
                </div>
                <p className="text-xs text-gray-400">Photo optionnelle</p>
              </div>
              <TextInput
                label="Nom complet"
                placeholder="Votre nom"
                value={username}
                error={nameError || undefined}
                onChange={(e: FormEvent<HTMLInputElement>) => {
                  setUsername(e.currentTarget.value);
                  setNameError("");
                }}
              />
              <TextInput
                label="Email"
                placeholder="vous@email.com"
                value={email}
                error={emailError || undefined}
                onChange={(e: FormEvent<HTMLInputElement>) => {
                  setEmail(e.currentTarget.value);
                  setEmailError("");
                }}
              />
              <Button
                onClick={goStep2}
                className="bg-[#1B73E8] hover:bg-[#1558b0] h-11 mt-1"
                radius="md"
                fullWidth
              >
                Continuer
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="self-start flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <BsArrowLeft size={18} />
                Retour
              </button>
              <PasswordInput
                label="Mot de passe"
                description="8 caractères minimum"
                placeholder="••••••••"
                value={password}
                onChange={(e: FormEvent<HTMLInputElement>) =>
                  setPassword(e.currentTarget.value)
                }
              />
              <PasswordInput
                label="Confirmation"
                placeholder="Répétez le mot de passe"
                value={confirmPassword}
                error={
                  confirmPassword.length > 0 && !passwordsMatch
                    ? "Les mots de passe ne correspondent pas"
                    : undefined
                }
                onChange={(e: FormEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.currentTarget.value)
                }
              />
              {passwordsMatch && (
                <p className="text-xs text-green-600 -mt-2">
                  Mots de passe identiques
                </p>
              )}
              <Button
                onClick={SignupHandler}
                className="bg-[#1B73E8] hover:bg-[#1558b0] h-11 mt-1"
                radius="md"
                fullWidth
              >
                S'enregistrer
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            Déjà un compte ?{" "}
            <Link className="text-[#1B73E8] font-medium" to="/login">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
