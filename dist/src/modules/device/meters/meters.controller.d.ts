import { MetersService } from './meters.service';
import { CreateMeterDto, UpdateMeterDto, MeterQueryDto, ControlValveDto, LinkDeviceDto, UnlinkDeviceDto } from './dto/meter.dto';
import type { AuthenticatedUser } from '../../../common/interfaces';
export declare class MetersController {
    private readonly metersService;
    constructor(metersService: MetersService);
    create(dto: CreateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    findAll(query: MeterQueryDto, user: AuthenticatedUser): Promise<import("../../../common/interfaces").PaginatedResult<Meter>>;
    findOne(id: string, user: AuthenticatedUser): Promise<Meter>;
    getReadingHistory(id: string, days: number, user: AuthenticatedUser): Promise<{
        bucket: Date;
        total_consumption: number;
        avg_consumption: number;
        reading_count: number;
    }[]>;
    update(id: string, dto: UpdateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    patch(id: string, dto: UpdateMeterDto, user: AuthenticatedUser): Promise<Meter>;
    linkDevice(id: string, dto: LinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    unlinkDevice(id: string, dto: UnlinkDeviceDto, user: AuthenticatedUser): Promise<Meter>;
    controlValve(id: string, dto: ControlValveDto, user: AuthenticatedUser): Promise<Meter>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
}
