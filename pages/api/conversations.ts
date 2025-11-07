import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { Op } from "sequelize";

import { ensureAssistantUser, isAssistantEmail } from "@app/lib/assistant";
import { connectDatabase, syncDatabase } from "@app/lib/database";
import {
  ConversationModel,
  ConversationParticipantModel,
} from "@app/lib/models/Conversation";
import { UserModel } from "@app/lib/models/User";

import { authOptions } from "./auth/[...nextauth]";

async function ensureDatabaseReady() {
  await connectDatabase();
  await syncDatabase();
}

function buildConversationTitle(params: {
  conversation: ConversationModel;
  currentUserId: string;
}) {
  if (params.conversation.title) {
    return params.conversation.title;
  }

  const participants = params.conversation.get("participants") as
    | ConversationParticipantModel[]
    | undefined;

  if (!participants) {
    return "Conversation";
  }

  const participantUsers = participants
    .map((participant) => participant.get("participant") as UserModel | undefined)
    .filter((user): user is UserModel => Boolean(user));

  const otherParticipant = participantUsers.find(
    (user) => user.id !== params.currentUserId && !isAssistantEmail(user.email)
  );

  return (
    otherParticipant?.name ??
    otherParticipant?.email ??
    "Conversation"
  );
}

function serializeConversation(params: {
  conversation: ConversationModel;
  currentUserId: string;
}) {
  const participants = params.conversation.get("participants") as
    | ConversationParticipantModel[]
    | undefined;

  const serializedParticipants = (participants ?? []).map((participant) => {
    const user = participant.get("participant") as UserModel | undefined;

    return {
      id: user?.id ?? participant.userId,
      email: user?.email ?? null,
      name: user?.name ?? null,
      imageUrl: user?.imageUrl ?? null,
    };
  });

  return {
    id: params.conversation.id,
    title: buildConversationTitle(params),
    participants: serializedParticipants,
    updatedAt: params.conversation.updatedAt,
  };
}

async function ensureAssistantConversationForUser(userId: string) {
  const assistantUser = await ensureAssistantUser();

  const existingParticipations = await ConversationParticipantModel.findAll({
    where: {
      userId,
    },
  });

  const conversationIds = existingParticipations.map(
    (participation) => participation.conversationId
  );

  if (conversationIds.length > 0) {
    const sharedParticipation = await ConversationParticipantModel.findOne({
      where: {
        conversationId: {
          [Op.in]: conversationIds,
        },
        userId: assistantUser.id,
      },
    });

    if (sharedParticipation) {
      const conversation = await ConversationModel.findByPk(
        sharedParticipation.conversationId,
        {
          include: [
            {
              model: ConversationParticipantModel,
              as: "participants",
              include: [
                {
                  model: UserModel,
                  as: "participant",
                },
              ],
            },
          ],
        }
      );

      if (conversation) {
        return conversation;
      }
    }
  }

  const conversation = await ConversationModel.create();

  await ConversationParticipantModel.bulkCreate([
    {
      conversationId: conversation.id,
      userId,
    },
    {
      conversationId: conversation.id,
      userId: assistantUser.id,
    },
  ]);

  return ConversationModel.findByPk(conversation.id, {
    include: [
      {
        model: ConversationParticipantModel,
        as: "participants",
        include: [
          {
            model: UserModel,
            as: "participant",
          },
        ],
      },
    ],
  });
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  try {
    await ensureDatabaseReady();
  } catch (error) {
    console.error("Database connection error:", error);
    return response.status(500).json({
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  const session = await getServerSession(request, response, authOptions);

  if (!session?.user?.id) {
    return response.status(401).json({ error: "Authentication required" });
  }

  switch (request.method) {
    case "GET": {
      try {
        const assistantConversation = await ensureAssistantConversationForUser(
          session.user.id
        );

        const participations = await ConversationParticipantModel.findAll({
          where: {
            userId: session.user.id,
          },
          include: [
            {
              model: ConversationModel,
              as: "conversation",
              include: [
                {
                  model: ConversationParticipantModel,
                  as: "participants",
                  include: [
                    {
                      model: UserModel,
                      as: "participant",
                    },
                  ],
                },
              ],
            },
          ],
          order: [[{ model: ConversationModel, as: "conversation" }, "updatedAt", "DESC"]],
        });

        const conversations = participations
          .map((participation) => participation.get("conversation") as ConversationModel | undefined)
          .filter((conversation): conversation is ConversationModel => Boolean(conversation))
          .map((conversation) =>
            serializeConversation({
              conversation,
              currentUserId: session.user.id,
            })
          );

        if (
          assistantConversation &&
          !conversations.some((item) => item.id === assistantConversation.id)
        ) {
          conversations.unshift(
            serializeConversation({
              conversation: assistantConversation,
              currentUserId: session.user.id,
            })
          );
        }

        return response.status(200).json({ conversations });
      } catch (error) {
        console.error("Error fetching conversations:", error);
        return response.status(500).json({ error: "Failed to fetch conversations" });
      }
    }

    case "POST": {
      try {
        const { participantEmail } = request.body as {
          participantEmail?: unknown;
        };

        if (typeof participantEmail !== "string") {
          return response
            .status(400)
            .json({ error: "participantEmail must be provided" });
        }

        const trimmedEmail = participantEmail.trim().toLowerCase();

        if (trimmedEmail.length === 0) {
          return response
            .status(400)
            .json({ error: "participantEmail must not be empty" });
        }

        const assistantUser = await ensureAssistantUser();

        const otherUser = isAssistantEmail(trimmedEmail)
          ? assistantUser
          : await UserModel.findOne({
              where: {
                email: {
                  [Op.iLike]: trimmedEmail,
                },
              },
            });

        if (!otherUser) {
          return response.status(404).json({ error: "User not found" });
        }

        if (otherUser.id === session.user.id) {
          return response
            .status(400)
            .json({ error: "Cannot create a conversation with yourself" });
        }

        const currentUserParticipations = await ConversationParticipantModel.findAll({
          where: {
            userId: session.user.id,
          },
        });

        const potentialConversationIds = currentUserParticipations.map(
          (participation) => participation.conversationId
        );

        let conversation: ConversationModel | null = null;

        if (potentialConversationIds.length > 0) {
          const existingSharedParticipation = await ConversationParticipantModel.findOne({
            where: {
              conversationId: {
                [Op.in]: potentialConversationIds,
              },
              userId: otherUser.id,
            },
          });

          if (existingSharedParticipation) {
            conversation = await ConversationModel.findByPk(
              existingSharedParticipation.conversationId,
              {
                include: [
                  {
                    model: ConversationParticipantModel,
                    as: "participants",
                    include: [
                      {
                        model: UserModel,
                        as: "participant",
                      },
                    ],
                  },
                ],
              }
            );
          }
        }

        if (!conversation) {
          conversation = await ConversationModel.create();

          await ConversationParticipantModel.bulkCreate([
            {
              conversationId: conversation.id,
              userId: session.user.id,
            },
            {
              conversationId: conversation.id,
              userId: otherUser.id,
            },
            {
              conversationId: conversation.id,
              userId: assistantUser.id,
            },
          ]);

          conversation = await ConversationModel.findByPk(conversation.id, {
            include: [
              {
                model: ConversationParticipantModel,
                as: "participants",
                include: [
                  {
                    model: UserModel,
                    as: "participant",
                  },
                ],
              },
            ],
          });
        }

        if (!conversation) {
          return response
            .status(500)
            .json({ error: "Unable to create conversation" });
        }

        await ConversationParticipantModel.findOrCreate({
          where: {
            conversationId: conversation.id,
            userId: assistantUser.id,
          },
          defaults: {
            conversationId: conversation.id,
            userId: assistantUser.id,
          },
        });

        await conversation.reload({
          include: [
            {
              model: ConversationParticipantModel,
              as: "participants",
              include: [
                {
                  model: UserModel,
                  as: "participant",
                },
              ],
            },
          ],
        });

        const serialized = serializeConversation({
          conversation,
          currentUserId: session.user.id,
        });

        return response.status(201).json(serialized);
      } catch (error) {
        console.error("Error creating conversation:", error);
        return response.status(500).json({ error: "Failed to create conversation" });
      }
    }

    default: {
      response.setHeader("Allow", ["GET", "POST"]);
      return response.status(405).json({ error: "Method not allowed" });
    }
  }
}


