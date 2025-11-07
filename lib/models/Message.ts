import type { CreationOptional, InferAttributes, InferCreationAttributes } from "sequelize";
import { DataTypes, Model } from "sequelize";

import { ConversationModel } from "@app/lib/models/Conversation";
import { UserModel } from "@app/lib/models/User";

import { sequelize } from "../database";

export class MessageModel extends Model<
  InferAttributes<MessageModel>,
  InferCreationAttributes<MessageModel>
> {
  declare id: CreationOptional<number>;
  declare sId: CreationOptional<string>;
  declare content: string;
  declare authorId: string;
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
    sId: {
      type: DataTypes.UUID,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
      unique: true,
    },
    authorId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    conversationId: {
      type: DataTypes.STRING,
      allowNull: false,
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
        fields: ["authorId"],
      },
      {
        fields: ["createdAt"],
      },
      {
        fields: ["sId"],
        unique: true,
      },
    ],
  }
);

MessageModel.belongsTo(ConversationModel, {
  foreignKey: "conversationId",
  as: "conversation",
});

MessageModel.belongsTo(UserModel, {
  foreignKey: "authorId",
  as: "author",
});


