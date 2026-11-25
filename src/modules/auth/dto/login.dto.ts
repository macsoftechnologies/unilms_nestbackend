import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'AIT', description: 'Institution / Campus Code' })
  @IsNotEmpty()
  @IsString()
  orgCode: string;

  @ApiProperty({ example: '26CSE001', description: 'Student Roll No, Employee Code, or Email' })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Password@123', description: 'User password' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class SuperAdminLoginDto {
  @ApiProperty({ example: 'admin@superadmin.com' })
  @IsNotEmpty()
  @IsString()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsNotEmpty()
  @IsString()
  password: string;
}

export class RefreshTokenDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}

