import { registerRoute } from "../router.js";
import { sendJson, HttpError } from "../utils/http.js";
import {
  serializeSeller,
  updateSellerProfile,
  deleteSellerAndData,
  verifySellerPassword,
  updateSellerPassword,
} from "../services/sellerService.js";
import { revokeSessionByAccessToken } from "../services/sessionService.js";

registerRoute(
  "GET",
  "/profile",
  async ({ res, seller }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    sendJson(res, 200, { profile: serializeSeller(seller) });
  },
  { requireAuth: true }
);

registerRoute(
  "PATCH",
  "/profile",
  async ({ res, seller, body }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    const updated = await updateSellerProfile(seller._id, {
      businessName: body.businessName ? String(body.businessName) : undefined,
      country: body.country ? String(body.country) : undefined,
    });
    sendJson(res, 200, { profile: serializeSeller(updated || seller) });
  },
  { requireAuth: true }
);

registerRoute(
  "DELETE",
  "/profile",
  async ({ res, seller, authToken }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    await deleteSellerAndData(seller._id);
    if (authToken) {
      await revokeSessionByAccessToken(authToken);
    }
    sendJson(res, 200, { message: "Profile deleted" });
  },
  { requireAuth: true }
);

registerRoute(
  "PATCH",
  "/profile/password",
  async ({ res, seller, body }) => {
    if (!seller) throw new HttpError(401, "Unauthorized");
    if (!body?.currentPassword || !body?.newPassword) {
      throw new HttpError(400, "Current and new passwords are required");
    }
    const valid = await verifySellerPassword(seller, String(body.currentPassword));
    if (!valid) {
      throw new HttpError(403, "Current password is incorrect");
    }
    await updateSellerPassword(seller._id, String(body.newPassword));
    sendJson(res, 200, { message: "Password updated" });
  },
  { requireAuth: true }
);
