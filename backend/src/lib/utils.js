import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  if (process.env.NODE_ENV === "production") {
    // Set cookie for production with proper cross-site settings
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "none", // allow cross-site cookies
      secure: true,
      domain: ".vercel.app", // allow cookies between frontend and backend on Vercel
    });
    return token;
  }

  // For development, use cookies with less strict settings
  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: "strict",
    secure: false,
  });

  return token;
};
