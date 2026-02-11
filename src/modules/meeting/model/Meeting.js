const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("../../user/model/User");

const Meeting = sequelize.define(
  "Meeting",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: "id",
      },
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    tableName: "meetings",
    timestamps: true,
    indexes: [
      {
        fields: ["userId", "startTime"],
      },
      {
        fields: ["startTime", "endTime"],
      },
    ],
  },
);

// Define associations
User.hasMany(Meeting, { foreignKey: "userId", onDelete: "CASCADE" });
Meeting.belongsTo(User, { foreignKey: "userId" });

module.exports = Meeting;
