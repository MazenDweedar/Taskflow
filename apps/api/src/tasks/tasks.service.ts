import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Task } from './entities/task.entity.js';
import { Project } from '../projects/entities/project.entity.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FilterTasksDto } from './dto/filter-tasks.dto.js';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  /**
   * Verify the project exists and belongs to the authenticated user.
   * Returns 404 if the project doesn't exist or isn't owned by the user.
   */
  private async verifyProjectOwnership(
    projectId: string,
    ownerId: string,
  ): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id: projectId, ownerId },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  /**
   * Find a task by ID, verifying ownership via task → project → owner join.
   * Returns 404 on mismatch to avoid leaking existence of other users' data.
   */
  private async findOwnedTask(
    taskId: string,
    ownerId: string,
  ): Promise<Task> {
    const task = await this.taskRepo
      .createQueryBuilder('task')
      .innerJoin('task.project', 'project')
      .where('task.id = :taskId', { taskId })
      .andWhere('project.owner_id = :ownerId', { ownerId })
      .getOne();

    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  /**
   * List tasks for a project (nested route).
   * Supports combinable filters: status, priority, search (case-insensitive title match).
   */
  async findAllByProject(
    projectId: string,
    ownerId: string,
    filters: FilterTasksDto,
  ): Promise<Task[]> {
    // Verify ownership first
    await this.verifyProjectOwnership(projectId, ownerId);

    const qb: SelectQueryBuilder<Task> = this.taskRepo
      .createQueryBuilder('task')
      .where('task.project_id = :projectId', { projectId });

    if (filters.status) {
      qb.andWhere('task.status = :status', { status: filters.status });
    }

    if (filters.priority) {
      qb.andWhere('task.priority = :priority', { priority: filters.priority });
    }

    if (filters.search) {
      qb.andWhere('task.title ILIKE :search', {
        search: `%${filters.search}%`,
      });
    }

    qb.orderBy('task.created_at', 'DESC');

    return qb.getMany();
  }

  async create(
    projectId: string,
    ownerId: string,
    dto: CreateTaskDto,
  ): Promise<Task> {
    await this.verifyProjectOwnership(projectId, ownerId);

    const task = this.taskRepo.create({
      ...dto,
      projectId,
    });
    return this.taskRepo.save(task);
  }

  async findOne(taskId: string, ownerId: string): Promise<Task> {
    return this.findOwnedTask(taskId, ownerId);
  }

  async update(
    taskId: string,
    ownerId: string,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const task = await this.findOwnedTask(taskId, ownerId);
    Object.assign(task, dto);
    return this.taskRepo.save(task);
  }

  async remove(taskId: string, ownerId: string): Promise<void> {
    const task = await this.findOwnedTask(taskId, ownerId);
    await this.taskRepo.remove(task);
  }
}
