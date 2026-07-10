import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

// Read the service account from the secret
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT!);

const app = initializeApp({
  credential: cert(serviceAccount),
  projectId: serviceAccount.project_id,
});

export const auth = getAuth(app);
export default app;
