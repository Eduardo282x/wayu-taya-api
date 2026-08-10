import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { ProvidersService } from './providers.service';
import { ProviderDTO } from './providers.dto';

@Controller('proveedores')
export class ProvidersController {
  constructor(private providersService: ProvidersService) {}

  @Get()
  async getProviders() {
    return await this.providersService.getProviders();
  }

  @Post()
  async createProvider(@Body() data: ProviderDTO) {
    return await this.providersService.createProviders(data);
  }

  @Put('/:id')
  async updateProvider(
    @Param('id') providerId: string,
    @Body() data: ProviderDTO,
  ) {
    return await this.providersService.updateProviders(
      Number(providerId),
      data,
    );
  }

  @Delete('/:id')
  async deleteProvider(@Param('id') providerId: string) {
    return await this.providersService.deleteProviders(Number(providerId));
  }
}
