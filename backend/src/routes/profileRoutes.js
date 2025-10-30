import { registerRoute } from "../router.js";
import { sendJson, HttpError } from "../utils/http.js";
import { serializeSeller, updateSellerProfile, deleteSellerAndData } from "../services/sellerService.js";
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

