import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsDateString,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty({ message: 'title must not be empty' })
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['todo', 'in-progress', 'done'], {
    message: 'status must be one of: todo, in-progress, done',
  })
  status?: string;

  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
