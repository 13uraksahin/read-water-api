import { MeterProfilesService } from './meter-profiles.service';
import { CreateMeterProfileDto, UpdateMeterProfileDto, MeterProfileQueryDto } from './dto/meter-profile.dto';
export declare class MeterProfilesController {
    private readonly meterProfilesService;
    constructor(meterProfilesService: MeterProfilesService);
    create(dto: CreateMeterProfileDto): Promise<MeterProfile>;
    findAll(query: MeterProfileQueryDto): Promise<import("../../../common/interfaces").PaginatedResult<MeterProfile>>;
    getCommunicationTechFields(): Promise<any>;
    findOne(id: string): Promise<MeterProfile>;
    update(id: string, dto: UpdateMeterProfileDto): Promise<MeterProfile>;
    patch(id: string, dto: UpdateMeterProfileDto): Promise<MeterProfile>;
    delete(id: string): Promise<void>;
}
