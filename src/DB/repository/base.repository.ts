import { HydratedDocument, Model, PopulateOptions, ProjectionType, QueryFilter, QueryOptions, Types } from "mongoose";
import { tenantStorage } from "../../common/services/tenant.storage";

abstract class BaseRepository<TDocument> {
    constructor(protected readonly model: Model<TDocument>) { }

    protected getTenantFilter(filter: any = {}): any {
        const companyId = tenantStorage.getCompanyId();

        // console.log("Tenant CompanyId:", companyId);
        if (!companyId || this.model.modelName === "Company") {
            return filter;
        }
        return { ...filter, companyId };
    }

    // create
    async create(data: Partial<TDocument>): Promise<HydratedDocument<TDocument>> {
        const companyId = tenantStorage.getCompanyId();
        if (companyId && this.model.modelName !== "Company") {
            (data as any).companyId = new Types.ObjectId(companyId);
        }
        return this.model.create(data);
    }

    // findById
    async findById(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        return this.findOne({ filter: { _id: id } as any });
    }

    // findOne -> filter,projection,options
    async findOne({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>,
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument> | null> {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.findOne(tenantFilter, projection, options);
    }

    // find
    async find({
        filter,
        projection,
        options
    }: {
        filter: QueryFilter<TDocument>,
        projection?: ProjectionType<TDocument>
        options?: QueryOptions<TDocument>
    }): Promise<HydratedDocument<TDocument>[] | []> {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.find(tenantFilter, projection)
            .sort(options?.sort)
            .skip(options?.skip!)
            .limit(options?.limit!)
            .populate(options?.populate as PopulateOptions);
    }

    // update
    async update(
        filter: any,
        data: Partial<TDocument>
    ): Promise<HydratedDocument<TDocument> | null> {
        const tenantFilter = this.getTenantFilter(filter);
        return await this.model.findOneAndUpdate(
            tenantFilter,
            data,
            { new: true }
        ).exec();
    }

    // delete
    async delete(id: Types.ObjectId): Promise<HydratedDocument<TDocument> | null> {
        const companyId = tenantStorage.getCompanyId();
        if (companyId && this.model.modelName !== "Company") {
            return this.model.findOneAndDelete({ _id: id, companyId } as any);
        }
        return this.model.findByIdAndDelete(id);
    }

    // count
    async count(
        filter: QueryFilter<TDocument> = {}
    ): Promise<number> {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.countDocuments(tenantFilter);
    }

    // paginate
    async paginate<T>({
        page,
        limit,
        sort,
        populate,
        search
    }: {
        page?: number,
        limit?: number,
        sort?: any,
        populate?: any,
        search?: QueryFilter<T>
    }) {
        page = +page! || 1;
        limit = +limit! || 20;
        if (page < 0) page = 1;
        if (limit < 0) limit = 20;
        const skip = (page - 1) * limit;

        const tenantFilter = this.getTenantFilter(search);

        const [data, totalDoc] = await Promise.all([
            this.model.find({ ...(tenantFilter ?? {}) })
                .skip(skip)
                .limit(limit)
                .populate(populate)
                .sort(sort),
            this.model.countDocuments({ ...(tenantFilter ?? {}) })
        ]);
        const totalPages = Math.ceil(totalDoc! / limit);
        // console.log(
        //     await this.model.find({})
        // );
        return {
            meta: {
                currentPage: page,
                totalPages,
                limit,
                totalDoc
            },
            data
        };
    }
}

export default BaseRepository;