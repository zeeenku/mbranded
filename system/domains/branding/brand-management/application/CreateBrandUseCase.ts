import { UUID } from "crypto";

interface ICreateBrandDTO {
    name: string;
    userId: string;
}


interface ICreateBrandResult {
    brandId: UUID;
}

export interface IBrandRepository {
    save(brand: Brand) : Promise<boolean> {

    }
}

export class Brand {
    public constructor(public readonly name: string, public readonly userId: string, public readonly id: randomUUID()) {}
}
export class CreateBrandUseCase {

    public constructor(private readonly _brandRepo: IBrandRepository ) {

    }


    public async execute(input: ICreateBrandDTO) : Promise<ICreateBrandResult> {
        const brand = new Brand(input.name, input.userId);
        const result = await this._brandRepo.save(brand);

        if(!result){
            throw new Error("Could not save Brand");
        }

        return {
            brandId: brand.id
        };
    }
}