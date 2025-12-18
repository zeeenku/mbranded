import { IBrandRepository } from "../application/CreateBrandUseCase";

export class DbBrandRepository implements IBrandRepository{

    private readonly _brands: Brands[] = [];
    save(brand: Brand): Promise<boolean> {
        throw new Error("Method not implemented.");
        return true;
    }

}