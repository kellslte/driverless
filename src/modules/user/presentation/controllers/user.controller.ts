import {
    Controller,
    Get,
    Post,
    Patch,
    Body,
    UseGuards,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case.js';
import { GetProfileUseCase } from '../../application/use-cases/get-profile.use-case.js';
import { UpdateProfileUseCase } from '../../application/use-cases/update-profile.use-case.js';
import { CreateUserDto, UpdateProfileDto } from '../../application/dtos/user.dtos.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../../../../common/guards/jwt-auth.guard.js';

@ApiTags('users')
@Controller({ path: 'users', version: '1' })
export class UserController {
    constructor(
        private readonly createUserUseCase: CreateUserUseCase,
        private readonly getProfileUseCase: GetProfileUseCase,
        private readonly updateProfileUseCase: UpdateProfileUseCase,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Register a new user' })
    @ApiResponse({ status: 201, description: 'User created successfully' })
    @ApiResponse({ status: 409, description: 'Email or phone already exists' })
    async create(@Body() dto: CreateUserDto) {
        const user = await this.createUserUseCase.execute(dto);
        return { data: user.toResponse() };
    }

    // @UseGuards(JwtAuthGuard)
    @Get('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({ status: 200, description: 'Profile returned successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getProfile(@CurrentUser('sub') userId: string) {
        // For Phase 1 testing prior to auth module, we temporarily allow passing userId in body or hardcode
        // if not using guards yet. Assuming guard provides `sub` (subject/userId) in JWT payload.
        const actualUserId = userId || '00000000-0000-0000-0000-000000000000'; // mock fallback
        const user = await this.getProfileUseCase.execute(actualUserId);
        return { data: user.toResponse() };
    }

    // @UseGuards(JwtAuthGuard)
    @Patch('profile')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({ status: 200, description: 'Profile updated successfully' })
    async updateProfile(
        @CurrentUser('sub') userId: string,
        @Body() dto: UpdateProfileDto,
    ) {
        const actualUserId = userId || '00000000-0000-0000-0000-000000000000'; // mock fallback
        const user = await this.updateProfileUseCase.execute(actualUserId, dto);
        return { data: user.toResponse() };
    }
}
