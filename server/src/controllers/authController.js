import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';

export async function register(req, res, next) {
  try {
    const { email, password, displayName, role = 'listener', musicPreferences } = req.body;

    if (!email || !password || !displayName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email, password, and display name.'
      });
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Role safety: only allow host/listener/co-dj during public registration (admin by seed or admin panel)
    const allowedRole = ['listener', 'co-dj', 'host'].includes(role) ? role : 'listener';

    const user = new User({
      email: email.toLowerCase(),
      password,
      displayName,
      role: allowedRole,
      musicPreferences: musicPreferences || undefined
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatar: user.avatar,
          musicPreferences: user.musicPreferences
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    res.json({
      success: true,
      message: 'Logged in successfully.',
      data: {
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          avatar: user.avatar,
          musicPreferences: user.musicPreferences
        },
        accessToken,
        refreshToken
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required.'
      });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || 'fallback_dev_refresh_secret_key_32_chars_min');
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or revoked refresh token.'
      });
    }

    // Token rotation
    const newAccessToken = user.generateAccessToken();
    const newRefreshToken = user.generateRefreshToken();
    user.refreshToken = newRefreshToken;
    await user.save();

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (err) {
    return res.status(401).json({
      success: false,
      message: 'Expired or invalid refresh token.'
    });
  }
}

export async function logout(req, res, next) {
  try {
    if (req.user) {
      req.user.refreshToken = undefined;
      await req.user.save();
    }
    res.json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res) {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        email: req.user.email,
        displayName: req.user.displayName,
        role: req.user.role,
        avatar: req.user.avatar,
        musicPreferences: req.user.musicPreferences
      }
    }
  });
}
