"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const tenant_storage_1 = require("../../common/services/tenant.storage");
class BaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    getTenantFilter(filter = {}) {
        const companyId = tenant_storage_1.tenantStorage.getCompanyId();
        if (!companyId || this.model.modelName === "Company") {
            return filter;
        }
        return { ...filter, companyId };
    }
    async create(data) {
        const companyId = tenant_storage_1.tenantStorage.getCompanyId();
        if (companyId && this.model.modelName !== "Company") {
            data.companyId = new mongoose_1.Types.ObjectId(companyId);
        }
        return this.model.create(data);
    }
    async findById(id) {
        return this.findOne({ filter: { _id: id } });
    }
    async findOne({ filter, projection, options }) {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.findOne(tenantFilter, projection, options);
    }
    async find({ filter, projection, options }) {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.find(tenantFilter, projection)
            .sort(options?.sort)
            .skip(options?.skip)
            .limit(options?.limit)
            .populate(options?.populate);
    }
    async update(filter, data) {
        const tenantFilter = this.getTenantFilter(filter);
        return await this.model.findOneAndUpdate(tenantFilter, data, { new: true }).exec();
    }
    async delete(id) {
        const companyId = tenant_storage_1.tenantStorage.getCompanyId();
        if (companyId && this.model.modelName !== "Company") {
            return this.model.findOneAndDelete({ _id: id, companyId });
        }
        return this.model.findByIdAndDelete(id);
    }
    async count(filter = {}) {
        const tenantFilter = this.getTenantFilter(filter);
        return this.model.countDocuments(tenantFilter);
    }
    async paginate({ page, limit, sort, populate, search }) {
        page = +page || 1;
        limit = +limit || 20;
        if (page < 0)
            page = 1;
        if (limit < 0)
            limit = 20;
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
        const totalPages = Math.ceil(totalDoc / limit);
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
exports.default = BaseRepository;
