import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Invalid email address format']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  displayName: {
    type: String,
    required: [true, 'Display name is required'],
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  },
  role: {
    type: String,
    enum: ['listener', 'co-dj', 'host', 'admin'],
    default: 'listener'
  },
  musicPreferences: {
    favoriteGenres: {
      type: [String],
      default: ['Deep House', 'Tech House', 'Melodic Techno']
    },
    preferredBpmRange: {
      min: { type: Number, default: 120 },
      max: { type: Number, default: 130 }
    },
    preferredCamelotKeys: {
      type: [String],
      default: ['8A', '9A', '8B']
    },
    preferredEnergy: {
      type: Number,
      default: 0.75,
      min: 0,
      max: 1
    },
    preferredValence: {
      type: Number,
      default: 0.65,
      min: 0,
      max: 1
    }
  },
  refreshToken: {
    type: String,
    select: false
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { id: this._id, email: this.email, role: this.role, displayName: this.displayName },
    process.env.JWT_SECRET || 'fallback_dev_jwt_secret_key_32_chars_min',
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    { id: this._id },
    process.env.JWT_REFRESH_SECRET || 'fallback_dev_refresh_secret_key_32_chars_min',
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
};

export const User = mongoose.model('User', userSchema);
