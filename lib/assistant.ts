import { Op } from "sequelize";

import { UserModel } from "@app/lib/models/User";

export const ASSISTANT_EMAIL = "assistant@cracouchat.local";
export const ASSISTANT_PROVIDER = "system";
export const ASSISTANT_PROVIDER_ID = "cracoufrat-assistant";
export const ASSISTANT_DISPLAY_NAME = "Cracoufrat Assistant";

export async function ensureAssistantUser() {
  const [assistant] = await UserModel.findOrCreate({
    where: {
      email: {
        [Op.iLike]: ASSISTANT_EMAIL,
      },
    },
    defaults: {
      email: ASSISTANT_EMAIL,
      name: ASSISTANT_DISPLAY_NAME,
      provider: ASSISTANT_PROVIDER,
      providerAccountId: ASSISTANT_PROVIDER_ID,
    },
  });

  return assistant;
}

export function isAssistantEmail(email: string | null | undefined) {
  return (email ?? "").toLowerCase() === ASSISTANT_EMAIL;
}


