const User = require("../model/User");

class UserService {
  async createUser(createUserDTO) {
    try {
      const existingUser = await User.findOne({
        where: { email: createUserDTO.email },
      });
      if (existingUser) {
        throw new Error("Email already exists");
      }

      const user = await User.create({
        name: createUserDTO.name,
        email: createUserDTO.email,
      });

      return user;
    } catch (error) {
      throw error;
    }
  }

  async getUserById(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }
      return user;
    } catch (error) {
      throw error;
    }
  }

  async getAllUsers() {
    try {
      const users = await User.findAll();
      return users;
    } catch (error) {
      throw error;
    }
  }

  async updateUser(userId, updateData) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }

      if (updateData.email && updateData.email !== user.email) {
        const existingUser = await User.findOne({
          where: { email: updateData.email },
        });
        if (existingUser) {
          throw new Error("Email already exists");
        }
      }

      await user.update(updateData);
      return user;
    } catch (error) {
      throw error;
    }
  }

  async deleteUser(userId) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new Error("User not found");
      }
      await user.destroy();
      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserService();
