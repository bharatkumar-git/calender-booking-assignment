// User DTOs

class CreateUserDTO {
  constructor(data) {
    this.name = data.name;
    this.email = data.email;
  }
}

class UserResponseDTO {
  constructor(user) {
    this.id = user.id;
    this.name = user.name;
    this.email = user.email;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }
}

module.exports = {
  CreateUserDTO,
  UserResponseDTO,
};
