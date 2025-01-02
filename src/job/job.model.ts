import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../sequelize";
import { IJob, IPagination, JobType } from "../type";
import memcachedService from "../memcached";

class Job extends Model<Optional<IJob, "createdAt" | "updatedAt" | "id">> {
  // Static method for finding a Job by its primary key with caching
  static async findByPkWithCache<T>(
    this: typeof Job,
    id: string
  ): Promise<T | null> {
    const cacheKey = `job:${id}`;

    // Try to retrieve the result from the cache
    const cachedResult = await memcachedService.get<T>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }

    // If not found in cache, fetch from the database
    const job = (await this.findByPk(id, {
      raw: true,
    })) as any;

    if (job) {
      if (typeof job.job === "string") {
        job.job = JSON.parse(job.job);
      }
      if (typeof job.status_trace === "string") {
        job.status_trace = JSON.parse(job.status_trace);
      }
    }

    // Cache the result if found
    if (job) {
      await memcachedService.set(cacheKey, job);
    }

    return job as any;
  }
  static async findAllByNoteIdWithCache(
    this: typeof Job,
    note_id: string,
    pagination: IPagination
  ): Promise<IJob[]> {
    const cacheKey = `job:note:${note_id}:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<IJob[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const jobs = (await this.findAll({
      raw: true,
      limit: pagination.page_size,
      where: { note_id },
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, jobs);

    return jobs;
  }
  static async findAllWithCache(
    this: typeof Job,
    pagination: IPagination
  ): Promise<IJob[]> {
    const cacheKey = `job:all:${pagination.page}:${pagination.page_size}`;

    const cachedResult = await memcachedService.get<IJob[]>(cacheKey);
    if (cachedResult) {
      console.log("Returning from cache for findAll");
      return cachedResult;
    }

    const jobs = (await this.findAll({
      raw: true,
      limit: pagination.page_size,
      offset: (pagination.page - 1) * pagination.page_size,
    })) as any;

    await memcachedService.set(cacheKey, jobs);

    return jobs;
  }
  // Static method to update a Job by ID with cache invalidation
  static async updateByIdWithCache(
    this: typeof Job,
    id: string,
    values: Partial<IJob>
  ): Promise<void> {
    // Invalidate the cache for the affected Job
    memcachedService.delete(`job:${id}`);

    // Update the Job in the database
    await this.update(values, {
      where: { id },
    });
  }
}

Job.init(
  {
    id: {
      primaryKey: true,
      type: DataTypes.UUID,
      unique: true,
      allowNull: false,
      defaultValue: DataTypes.UUIDV4,
    },
    alias_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    note_id: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    payload: {
      type: DataTypes.JSON,
      allowNull: false,
    },
    job_type: {
      type: DataTypes.ENUM(
        JobType.email_draft,
        JobType.scheduled_task,
        JobType.summarisation
      ),
      allowNull: false,
    },
    status_trace: {
      type: DataTypes.JSON,
      allowNull: false,
    },
  },
  { sequelize, modelName: "Job" }
);

export default Job;
