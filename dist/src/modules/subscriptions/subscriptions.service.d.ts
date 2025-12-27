import { PrismaService } from '../../core/prisma/prisma.service';
import { Subscription } from '@prisma/client';
import { CreateSubscriptionDto, UpdateSubscriptionDto, SubscriptionQueryDto } from './dto/subscription.dto';
import { AuthenticatedUser, PaginatedResult } from '../../common/interfaces';
export declare class SubscriptionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    private hasUserAccessToTenant;
    private getEffectiveTenantPath;
    findAll(query: SubscriptionQueryDto, user: AuthenticatedUser): Promise<PaginatedResult<Subscription>>;
    findOne(id: string, user: AuthenticatedUser): Promise<Subscription>;
    private generateSubscriptionNumber;
    create(dto: CreateSubscriptionDto, user: AuthenticatedUser): Promise<Subscription>;
    update(id: string, dto: UpdateSubscriptionDto, user: AuthenticatedUser): Promise<Subscription>;
    delete(id: string, user: AuthenticatedUser): Promise<void>;
    linkMeter(subscriptionId: string, meterId: string, user: AuthenticatedUser): Promise<Subscription>;
    unlinkMeter(subscriptionId: string, meterId: string, user: AuthenticatedUser): Promise<Subscription>;
}
