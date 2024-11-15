const verifyToken = (req, res, next) => {
  const token = req.session.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, "albinshiju", (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }
    req.user = decoded; // Attach decoded user info to the request object
    next();
  });
};

