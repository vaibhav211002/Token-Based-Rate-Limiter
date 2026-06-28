const { PrivyClient } = require("@privy-io/server-auth");

const privy = new PrivyClient(
  process.env.PRIVY_APP_ID,
  process.env.PRIVY_APP_SECRET
);

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const accessToken = authHeader.replace("Bearer ", "");

    // Verify the JWT with Privy
    const claims = await privy.verifyAuthToken(accessToken);

    req.user = {
      id: claims.userId || claims.sub,
      sessionId: claims.sid,
      issuer: claims.iss,
    };

    next();
  } catch (error) {
    console.error("Privy Auth Error:", error);

    return res.status(401).json({
      success: false,
      message: "Invalid or expired access token",
    });
  }
};

module.exports = auth;