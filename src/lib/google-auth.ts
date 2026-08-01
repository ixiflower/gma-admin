import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.AUTH_REDIRECT_URL,
);

export function getGoogleAuthUrl() {
  return client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  });
}

export async function getGoogleUser(code: string) {
  const { tokens } = await client.getToken(code);
  if (!tokens.id_token) throw new Error("No id_token from Google");

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload) throw new Error("No payload from Google");

  return {
    email: payload.email!,
    name: payload.name ?? payload.email!.split("@")[0],
    picture: payload.picture,
  };
}
