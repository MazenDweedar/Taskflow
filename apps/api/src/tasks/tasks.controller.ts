import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiCookieAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { UpdateTaskDto } from './dto/update-task.dto.js';
import { FilterTasksDto } from './dto/filter-tasks.dto.js';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiTags('Tasks')
@ApiCookieAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // ─── Nested routes (under /projects/:projectId/tasks) ───

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List tasks for a project (with optional filters)' })
  findAll(
    @CurrentUser() user: { userId: string },
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Query() filters: FilterTasksDto,
  ) {
    return this.tasksService.findAllByProject(projectId, user.userId, filters);
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create a task in a project' })
  create(
    @CurrentUser() user: { userId: string },
    @Param('projectId', ParseUUIDPipe) projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    return this.tasksService.create(projectId, user.userId, dto);
  }

  // ─── Flat routes (by task ID) ───

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Get a task by ID' })
  findOne(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.findOne(id, user.userId);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a task' })
  update(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.tasksService.update(id, user.userId, dto);
  }

  @Delete('tasks/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a task' })
  remove(
    @CurrentUser() user: { userId: string },
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tasksService.remove(id, user.userId);
  }
}
