import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import { DataTypes, Model } from "sequelize";

import { sequelize } from "../database";

export class MessageModel extends Model<
  InferAttributes<MessageModel>,
  InferCreationAttributes<MessageModel>
> {
  declare id: CreationOptional<number>;
  declare content: string;
  declare role: "user" | "assistant";
  declare conversationId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

MessageModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM("user", "assistant"),
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: "default",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    modelName: "Message",
    tableName: "messages",
    sequelize,
    indexes: [
      {
        fields: ["conversationId"],
      },
      {
        fields: ["createdAt"],
      },
    ],
  }
);

