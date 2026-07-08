import { Router } from "express";
import multer from "multer";
import { Client } from "@replit/object-storage";

const router = Router();
const client = new Client();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// POST /upload/image - upload a single image, returns its URL
router.post("/image", upload.single("image"), async (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "No image file provided" });
    return;
  }

  const ext = req.file.originalname.split(".").pop();
  const fileName = `posts/${req.user.id}-${Date.now()}.${ext}`;

  const { ok, error } = await client.uploadFromBytes(fileName, req.file.buffer);

  if (!ok) {
    console.error("Upload failed:", error);
    res.status(500).json({ error: "Failed to upload image" });
    return;
  }

  const imageUrl = `/api/upload/serve/${fileName}`;
  res.json({ imageUrl });
});

// GET /upload/serve/:path - serve an uploaded image
router.get("/serve/*", async (req, res) => {
  const fileName = req.params[0];
  const { ok, value, error } = await client.downloadAsBytes(fileName);

  if (!ok) {
    res.status(404).json({ error: "Image not found" });
    return;
  }

  res.set("Content-Type", "image/jpeg");
  res.send(value[0]);
});

export default router;
