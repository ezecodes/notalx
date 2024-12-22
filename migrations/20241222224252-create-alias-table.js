module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable("Alias", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING, unique: true, allowNull: false },
      email: { type: DataTypes.STRING, unique: true, allowNull: true },
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable("Alias");
  },
};
