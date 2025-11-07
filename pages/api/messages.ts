import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";

import { ensureAssistantUser, isAssistantEmail } from "@app/lib/assistant";
import { connectDatabase, syncDatabase } from "@app/lib/database";
import {
  ConversationModel,
  ConversationParticipantModel,
} from "@app/lib/models/Conversation";
import { MessageModel } from "@app/lib/models/Message";
import { UserModel } from "@app/lib/models/User";

import { authOptions } from "./auth/[...nextauth]";

async function ensureDatabaseReady() {
  await connectDatabase();
  await syncDatabase();
}

async function ensureUserInConversation(params: {
  conversationId: string;
  userId: string;
}) {
  const participation = await ConversationParticipantModel.findOne({
    where: {
      conversationId: params.conversationId,
      userId: params.userId,
    },
  });

  if (!participation) {
    return false;
  }

  return true;
}

async function serializeMessage(messageSId: string) {
  const message = await MessageModel.findOne({
    where: {
      sId: messageSId,
    },
    include: [
      {
        model: UserModel,
        as: "author",
      },
    ],
  });

  if (!message) {
    return null;
  }

  const author = message.get("author") as UserModel | undefined;

  return {
    id: message.sId,
    content: message.content,
    timestamp: message.createdAt,
    author: {
      id: message.authorId,
      name: author?.name ?? null,
      email: author?.email ?? null,
      imageUrl: author?.imageUrl ?? null,
    },
  };
}

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get all messages for the default conversation
 *     description: Returns all messages in the default conversation
 *     responses:
 *       200:
 *         description: List of messages
 *   post:
 *     summary: Create a new message
 *     description: Creates a new message in the default conversation
 *     responses:
 *       201:
 *         description: Message created successfully
 */
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
        const conversationIdParam = request.query.conversationId;

        if (typeof conversationIdParam !== "string") {
          return response
            .status(400)
            .json({ error: "conversationId query parameter is required" });
        }

        const userCanAccess = await ensureUserInConversation({
          conversationId: conversationIdParam,
          userId: session.user.id,
        });

        if (!userCanAccess) {
          return response.status(404).json({ error: "Conversation not found" });
        }

        const messages = await MessageModel.findAll({
          where: {
            conversationId: conversationIdParam,
          },
          include: [
            {
              model: UserModel,
              as: "author",
            },
          ],
          order: [["createdAt", "ASC"]],
        });

        const serializedMessages = messages.map((message) => {
          const author = message.get("author") as UserModel | undefined;

          return {
            id: message.sId,
            content: message.content,
            timestamp: message.createdAt,
            author: {
              id: message.authorId,
              name: author?.name ?? null,
              email: author?.email ?? null,
              imageUrl: author?.imageUrl ?? null,
            },
          };
        });

        return response.status(200).json({
          messages: serializedMessages,
        });
      } catch (error) {
        console.error("Error fetching messages:", error);
        return response.status(500).json({ error: "Failed to fetch messages" });
      }
    }

    case "POST": {
      try {
        const { content, conversationId } = request.body as {
          content?: unknown;
          conversationId?: unknown;
        };

        if (typeof content !== "string" || content.trim().length === 0) {
          return response
            .status(400)
            .json({ error: "Content must be a non-empty string" });
        }

        if (typeof conversationId !== "string") {
          return response
            .status(400)
            .json({ error: "conversationId must be provided" });
        }

        const userCanAccess = await ensureUserInConversation({
          conversationId,
          userId: session.user.id,
        });

        if (!userCanAccess) {
          return response.status(404).json({ error: "Conversation not found" });
        }

        const assistantUser = await ensureAssistantUser();

        const message = await MessageModel.create({
          content,
          conversationId,
          authorId: session.user.id,
        });

        await ConversationModel.update(
          {
            updatedAt: new Date(),
          },
          {
            where: {
              id: conversationId,
            },
          }
        );

        const serializedMessages = [] as Array<{
          id: string;
          content: string;
          timestamp: Date | string;
          author: {
            id: string;
            name: string | null;
            email: string | null;
            imageUrl: string | null;
          };
        }>;

        const primaryMessage = await serializeMessage(message.sId);

        if (primaryMessage) {
          serializedMessages.push(primaryMessage);
        }

        const assistantParticipation = await ConversationParticipantModel.findOne({
          where: {
            conversationId,
            userId: assistantUser.id,
          },
        });

        if (
          assistantParticipation &&
          session.user.id !== assistantUser.id &&
          !isAssistantEmail(session.user.email)
        ) {
          const assistantMessage = await MessageModel.create({
            content: "Cracoufrat!",
            conversationId,
            authorId: assistantUser.id,
          });

          const serializedAssistantMessage = await serializeMessage(assistantMessage.sId);

          if (serializedAssistantMessage) {
            serializedMessages.push(serializedAssistantMessage);
          }

          await ConversationModel.update(
            {
              updatedAt: new Date(),
            },
            {
              where: {
                id: conversationId,
              },
            }
          );
        }

        return response.status(201).json({
          messages: serializedMessages,
        });
      } catch (error) {
        console.error("Error creating message:", error);
        return response.status(500).json({ error: "Failed to create message" });
      }
    }

    default: {
      response.setHeader("Allow", ["GET", "POST"]);
      return response.status(405).json({ error: "Method not allowed" });
    }
  }
}

