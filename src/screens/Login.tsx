import { Button, LoadingOverlay, PasswordInput, TextInput } from "@mantine/core";
import { FormEvent, useState } from "react";
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

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const isValidEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const login = async () => {
    if (!isValidEmail(email)) {
      notifications.show({
        title: "Connexion",
        color: "red",
        message: "Entrez une adresse email valide.",
      });
      return;
    }
    if (!password) {
      notifications.show({
        title: "Connexion",
        color: "red",
        message: "Entrez votre mot de passe.",
      });
      return;
    }
    setIsLoading(true);
    try {
      const { data } = await httpClient.post("/auth/login", { email, password });
      localStorage.setItem("participant", JSON.stringify(data.user));
      navigate("/");
    } catch (error: any) {
      notifications.show({
        title: "Connexion",
        color: "red",
        message: error?.response?.data?.message || "Échec de connexion",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#f4f6f8]">
      <AuthSidePanel
        title="Rejoignez votre réunion en un clic"
        bullets={[
          "Prévisualisez micro et caméra avant d’entrer",
          "Salle d’attente contrôlée par l’organisateur",
          "Vidéo HD",
        ]}
      />
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="relative w-full max-w-md bg-white rounded-2xl border border-gray-200 p-8">
          <LoadingOverlay visible={isLoading} overlayBlur={2} />
          <div className="flex items-center gap-2 mb-6 md:hidden">
            <MeetMark className="h-7 w-7" />
            <span className="font-semibold">Meet</span>
          </div>
          <h2 className="text-2xl font-semibold mb-1">Connexion</h2>
          <p className="text-sm text-gray-500 mb-6">
            Entrez vos identifiants pour continuer
          </p>
          <div className="flex flex-col gap-4">
            <TextInput
              label="Email"
              placeholder="vous@email.com"
              value={email}
              onChange={(e: FormEvent<HTMLInputElement>) =>
                setEmail(e.currentTarget.value)
              }
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <PasswordInput
              label="Mot de passe"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(e: FormEvent<HTMLInputElement>) =>
                setPassword(e.currentTarget.value)
              }
              onKeyDown={(e) => e.key === "Enter" && login()}
            />
            <Button
              onClick={login}
              className="bg-[#1B73E8] hover:bg-[#1558b0] h-11 mt-1"
              radius="md"
              fullWidth
            >
              Se connecter
            </Button>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="h-11 w-full rounded-md border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Continuer en invité
            </button>
          </div>
          <p className="text-center text-sm text-gray-500 mt-6">
            Pas encore de compte ?{" "}
            <Link className="text-[#1B73E8] font-medium" to="/signup">
              S'inscrire
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
