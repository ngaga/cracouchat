import type { NextApiRequest, NextApiResponse } from "next";

import { connectDatabase, syncDatabase } from "@app/lib/database";
import { MessageModel } from "@app/lib/models/Message";

const DEFAULT_CONVERSATION_ID = "default";

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
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    await connectDatabase();
    await syncDatabase();
  } catch (error) {
    console.error("Database connection error:", error);
    return res.status(500).json({
      error: "Database connection failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }

  if (req.method === "GET") {
    try {
      const messages = await MessageModel.findAll({
        where: {
          conversationId: DEFAULT_CONVERSATION_ID,
        },
        order: [["createdAt", "ASC"]],
      });

      return res.status(200).json({
        messages: messages.map((msg) => ({
          id: msg.id.toString(),
          role: msg.role,
          content: msg.content,
          timestamp: msg.createdAt,
        })),
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
      return res.status(500).json({ error: "Failed to fetch messages" });
    }
  }

  if (req.method === "POST") {
    try {
      const { content, role } = req.body;

      if (!content || typeof content !== "string") {
        return res.status(400).json({ error: "Content is required" });
      }

      if (!role || (role !== "user" && role !== "assistant")) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const message = await MessageModel.create({
        content,
        role,
        conversationId: DEFAULT_CONVERSATION_ID,
      });

      return res.status(201).json({
        id: message.id.toString(),
        role: message.role,
        content: message.content,
        timestamp: message.createdAt,
      });
    } catch (error) {
      console.error("Error creating message:", error);
      return res.status(500).json({ error: "Failed to create message" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: "Method not allowed" });
}

