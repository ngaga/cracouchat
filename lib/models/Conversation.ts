import type {
  CreationOptional,
  InferAttributes,
  InferCreationAttributes,
} from "sequelize";
import { DataTypes, Model } from "sequelize";

import { sequelize } from "@app/lib/database";
import { UserModel } from "@app/lib/models/User";

export class ConversationModel extends Model<
  InferAttributes<ConversationModel>,
  InferCreationAttributes<ConversationModel>
> {
  declare id: CreationOptional<string>;
  declare title: CreationOptional<string | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ConversationModel.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: true,
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
    modelName: "Conversation",
    tableName: "conversations",
    sequelize,
    indexes: [
      {
        fields: ["updatedAt"],
      },
    ],
  }
);

export class ConversationParticipantModel extends Model<
  InferAttributes<ConversationParticipantModel>,
  InferCreationAttributes<ConversationParticipantModel>
> {
  declare id: CreationOptional<number>;
  declare conversationId: string;
  declare userId: string;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

ConversationParticipantModel.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    conversationId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
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
    modelName: "ConversationParticipant",
    tableName: "conversation_participants",
    sequelize,
    indexes: [
      {
        fields: ["conversationId", "userId"],
        unique: true,
      },
    ],
  }
);

ConversationModel.belongsToMany(UserModel, {
  through: ConversationParticipantModel,
  foreignKey: "conversationId",
  otherKey: "userId",
  as: "users",
});

UserModel.belongsToMany(ConversationModel, {
  through: ConversationParticipantModel,
  foreignKey: "userId",
  otherKey: "conversationId",
  as: "conversations",
});

ConversationModel.hasMany(ConversationParticipantModel, {
  foreignKey: "conversationId",
  as: "participants",
});

ConversationParticipantModel.belongsTo(UserModel, {
  foreignKey: "userId",
  as: "participant",
});

ConversationParticipantModel.belongsTo(ConversationModel, {
  foreignKey: "conversationId",
  as: "conversation",
});


