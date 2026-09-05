import { generateKeyPairSync } from "node:crypto";

const { publicKey, privateKey } = generateKeyPairSync("ec", {
  namedCurve: "prime256v1",
});

const publicJwk = publicKey.export({ format: "jwk" });
const privateJwk = privateKey.export({ format: "jwk" });

if (!publicJwk.x || !publicJwk.y || !privateJwk.d) {
  throw new Error("No fue posible generar las claves VAPID.");
}

const publicVapidKey = Buffer.concat([
  Buffer.from([4]),
  Buffer.from(publicJwk.x, "base64url"),
  Buffer.from(publicJwk.y, "base64url"),
]).toString("base64url");

process.stdout.write(
  [
    `NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY="${publicVapidKey}"`,
    `WEB_PUSH_VAPID_PRIVATE_KEY="${privateJwk.d}"`,
    'WEB_PUSH_VAPID_SUBJECT="https://dimensiones.cloud"',
    "",
  ].join("\n"),
);
