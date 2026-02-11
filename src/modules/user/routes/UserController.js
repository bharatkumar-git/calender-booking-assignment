const UserService = require("../service/UserService");
const { CreateUserDTO, UserResponseDTO } = require("../dto/UserDTO");

class UserController {
  async createUser(req, res, next) {
    try {
      const createUserDTO = new CreateUserDTO(req.body);
      const user = await UserService.createUser(createUserDTO);
      const userResponse = new UserResponseDTO(user);

      return res.status(201).json({
        success: true,
        message: "User created successfully",
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await UserService.getUserById(userId);
      const userResponse = new UserResponseDTO(user);

      return res.status(200).json({
        success: true,
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAllUsers(req, res, next) {
    try {
      const users = await UserService.getAllUsers();
      const usersResponse = users.map((user) => new UserResponseDTO(user));

      return res.status(200).json({
        success: true,
        data: usersResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      const user = await UserService.updateUser(userId, req.body);
      const userResponse = new UserResponseDTO(user);

      return res.status(200).json({
        success: true,
        message: "User updated successfully",
        data: userResponse,
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteUser(req, res, next) {
    try {
      const userId = parseInt(req.params.id, 10);
      await UserService.deleteUser(userId);

      return res.status(204).json();
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
