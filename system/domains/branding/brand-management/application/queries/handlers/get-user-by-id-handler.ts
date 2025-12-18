import { GetUserByIdQuery } from "../queries/getUserByIdQuery";
import { IUserRepository } from "../../domain/repositories/userRepository";

export class GetUserByIdHandler {
    constructor(private userRepo: IUserRepository) {}

    async handle(query: GetUserByIdQuery) {
        return this.userRepo.findById(query.id);
    }
}
