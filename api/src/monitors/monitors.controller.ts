import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { CreateMonitorDto } from './dto/create-monitor.dto';
import { UpdateMonitorDto } from './dto/update-monitor.dto';
import { MonitorsService } from './monitors.service';

@Controller('monitors')
export class MonitorsController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Post()
  create(@Body() dto: CreateMonitorDto) {
    return this.monitorsService.create(dto);
  }

  @Get()
  findAll() {
    return this.monitorsService.findAll();
  }

  @Get(':uuid')
  findOne(@Param('uuid') uuid: string) {
    return this.monitorsService.findOne(uuid);
  }

  @Put(':uuid')
  update(@Param('uuid') uuid: string, @Body() dto: UpdateMonitorDto) {
    return this.monitorsService.update(uuid, dto);
  }

  @Post(':uuid/suppress')
  suppress(@Param('uuid') uuid: string) {
    return this.monitorsService.suppress(uuid);
  }

  @Delete(':uuid')
  @HttpCode(204)
  async remove(@Param('uuid') uuid: string) {
    await this.monitorsService.remove(uuid);
  }
}

@Controller()
export class MonitorAckController {
  constructor(private readonly monitorsService: MonitorsService) {}

  @Get('ack/:uuid')
  async ack(@Param('uuid') uuid: string) {
    await this.monitorsService.acknowledge(uuid);
    return { acknowledged: true };
  }
}
