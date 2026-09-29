import multer from 'multer';
import fs from 'fs';
import path from 'path';

const ensureDir = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let dest = 'uploads/';
    if (file.fieldname === 'avatar') {
      dest = 'uploads/avatars/';
    } else if (file.fieldname === 'photo') {
      dest = 'uploads/timelogs/';
    }
    ensureDir(dest);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  },
});

export const upload = multer({ storage });

export const saveBase64Image = (base64String: string, type: 'avatar' | 'timelog'): string => {
  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  let ext = 'jpg';
  let buffer: Buffer;

  if (matches && matches.length === 3) {
    ext = matches[1];
    buffer = Buffer.from(matches[2], 'base64');
  } else {
    buffer = Buffer.from(base64String, 'base64');
  }

  const destDir = type === 'avatar' ? 'uploads/avatars/' : 'uploads/timelogs/';
  ensureDir(destDir);

  const filename = `${type}-${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext === 'jpeg' ? 'jpg' : ext}`;
  const filepath = path.join(destDir, filename);
  
  fs.writeFileSync(filepath, buffer);
  
  // Return the path with forward slashes for URLs
  return filepath.split(path.sep).join('/');
};
