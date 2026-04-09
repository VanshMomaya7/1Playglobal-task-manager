import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryTasksDto, userId: string) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (status) where.status = status;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number, userId: string) {
    const task = await this.prisma.task.findUnique({ where: { id } });
    if (!task || task.userId !== userId) {
      throw new NotFoundException(`Task not found or unauthorized`);
    }
    return task;
  }

  async create(dto: CreateTaskDto, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(
        'No matching user for this session. Sign in with Google again, or set AUTH_BYPASS_USER_ID on the server to a valid User.id from the database.',
      );
    }

    let dueDate: Date | null = null;
    if (dto.dueDate) {
      const d = new Date(dto.dueDate);
      if (Number.isNaN(d.getTime())) {
        throw new BadRequestException('Invalid dueDate');
      }
      dueDate = d;
    }

    try {
      return await this.prisma.task.create({
        data: {
          title: dto.title,
          description: dto.description,
          status: dto.status ?? 'todo',
          userId,
          dueDate,
        },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2003'
      ) {
        throw new BadRequestException(
          'Task could not be linked to your user (foreign key). Sign in again or fix AUTH_BYPASS_USER_ID.',
        );
      }
      throw e;
    }
  }

  async update(id: number, dto: UpdateTaskDto, userId: string) {
    await this.findOne(id, userId); // throws 404 if not found or unauthorized
    return this.prisma.task.update({
      where: { id },
      data: {
        ...(dto.title !== undefined && { title: dto.title }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.dueDate !== undefined && {
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        }),
      },
    });
  }

  async remove(id: number, userId: string) {
    await this.findOne(id, userId); // throws 404 if not found or unauthorized
    await this.prisma.task.delete({ where: { id } });
    return { message: `Task ${id} deleted successfully` };
  }
}
