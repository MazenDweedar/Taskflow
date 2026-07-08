import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity.js';
import { CreateProjectDto } from './dto/create-project.dto.js';
import { UpdateProjectDto } from './dto/update-project.dto.js';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
  ) {}

  async findAll(ownerId: string): Promise<Project[]> {
    return this.projectRepo.find({
      where: { ownerId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, ownerId: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id, ownerId },
    });
    if (!project) {
      // Return 404 (not 403) to avoid leaking existence of other users' data
      throw new NotFoundException('Project not found');
    }
    return project;
  }

  async create(ownerId: string, dto: CreateProjectDto): Promise<Project> {
    const project = this.projectRepo.create({
      ...dto,
      ownerId,
    });
    return this.projectRepo.save(project);
  }

  async update(
    id: string,
    ownerId: string,
    dto: UpdateProjectDto,
  ): Promise<Project> {
    const project = await this.findOne(id, ownerId);
    Object.assign(project, dto);
    return this.projectRepo.save(project);
  }

  async remove(id: string, ownerId: string): Promise<void> {
    const project = await this.findOne(id, ownerId);
    await this.projectRepo.remove(project);
  }
}
