import jwt from 'jsonwebtoken';

export function verifyRefreshToken(req, res, next) {
  const token = req.cookies.refreshToken;
  try {
    const payload = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res
    .status(403).clearCookie("refreshToken", {
      httpOnly: true,
      secure: true,
      sameSite: "Strict",
      path: "/"
    })
    .json({ message: 'Invalid or expired refresh token' });
  }
}
