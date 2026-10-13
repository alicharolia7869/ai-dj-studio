import multer from 'multer';
import path from 'path';
import fs from 'fs';

const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads/audio');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/wave', 'audio/x-wav', 'audio/ogg', 'audio/aac', 'audio/mp4', 'audio/x-m4a'];
  if (allowedMimes.includes(file.mimetype) || file.originalname.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
    cb(null, true);
  } else {
    cb(new Error('Only valid audio formats (.mp3, .wav, .ogg, .m4a) are allowed.'), false);
  }
};

const maxMb = parseInt(process.env.MAX_AUDIO_UPLOAD_MB || '15', 10);

export const uploadAudio = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter
});
