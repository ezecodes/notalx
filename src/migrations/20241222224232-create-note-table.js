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
        type: Sequelize.UUID,
        allowNull: false,
      },
      slug: { type: Sequelize.STRING, unique: true, allowNull: false },
      content: { type: Sequelize.STRING, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      is_hidden: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      will_self_destroy: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
        defaultValue: false,
      },
      secret: { type: Sequelize.STRING, allowNull: true },
      self_destroy_time: {
        type: Sequelize.STRING,
        allowNull: true,
      },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Note");
  },
};
