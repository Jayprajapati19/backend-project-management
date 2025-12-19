import mongoose, { Schema } from "mongoose";
import brcypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Fallback expiries if env vars are missing/invalid
const ACCESS_TOKEN_EXPIRY =
  process.env.ACCESS_TOKEN_EXPIRY &&
  typeof process.env.ACCESS_TOKEN_EXPIRY === "string"
    ? process.env.ACCESS_TOKEN_EXPIRY
    : "15m";

const REFRESH_TOKEN_EXPIRY =
  process.env.REFRESH_TOKEN_EXPIRY &&
  typeof process.env.REFRESH_TOKEN_EXPIRY === "string"
    ? process.env.REFRESH_TOKEN_EXPIRY
    : "7d";

const userSchema = new Schema(
  {
    avatar: {
      type: {
        url: String,
        localPath: String,
      },
      default: {
        url: `https://placehold.co/200x200`,
        localPath: "",
      },
    },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: {
      type: String,
    },
    forgotPasswordToken: {
      type: String,
    },
    forgotPasswordExpiry: {
      type: Date,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpiry: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await brcypt.hash(this.password, 10);
});

// userSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();

//   this.password = await brcypt.hash(this.password, 10);
//   next();
// });

userSchema.methods.isPasswordCorrect = async function (password) {
  return await brcypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      username: this.username,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRY },
  );
};

userSchema.methods.generateTemporaryToken = function () {
  const unHashedToken = crypto.randomBytes(20).toString("hex");

  const hashedToken = crypto
    .createHash("sha256")
    .update(unHashedToken)
    .digest("hex");

  const tokenExpiry = Date.now() + 20 * 60 * 1000; //20 mins
  return { unHashedToken, hashedToken, tokenExpiry };
};

export const User = mongoose.model("User", userSchema);
