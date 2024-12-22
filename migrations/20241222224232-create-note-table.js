module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Note", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      alias_id: {
        type: DataTypes.UUID,
        allowNull: false,
      },
      slug: { type: DataTypes.STRING, unique: true, allowNull: false },
      content: { type: DataTypes.STRING, allowNull: false },
      title: { type: DataTypes.STRING, allowNull: false },
      is_hidden: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      will_self_destroy: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      secret: { type: DataTypes.STRING, allowNull: true },
      self_destroy_time: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Note");
  },
};
