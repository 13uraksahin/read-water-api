"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const bullmq_1 = require("@nestjs/bullmq");
const config_1 = require("@nestjs/config");
const core_module_1 = require("./core/core.module");
const iam_module_1 = require("./modules/iam/iam.module");
const assets_module_1 = require("./modules/assets/assets.module");
const ingestion_module_1 = require("./modules/ingestion/ingestion.module");
const worker_module_1 = require("./modules/worker/worker.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const readings_module_1 = require("./modules/readings/readings.module");
const customers_module_1 = require("./modules/customers/customers.module");
const subscriptions_module_1 = require("./modules/subscriptions/subscriptions.module");
const settings_module_1 = require("./modules/settings/settings.module");
const alarms_module_1 = require("./modules/alarms/alarms.module");
const health_module_1 = require("./modules/health/health.module");
const jwt_auth_guard_1 = require("./modules/iam/auth/guards/jwt-auth.guard");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            core_module_1.CoreModule,
            bullmq_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    connection: {
                        host: configService.get('REDIS_HOST', 'localhost'),
                        port: configService.get('REDIS_PORT', 6380),
                        password: configService.get('REDIS_PASSWORD', ''),
                        maxRetriesPerRequest: null,
                    },
                    defaultJobOptions: {
                        attempts: 3,
                        backoff: {
                            type: 'exponential',
                            delay: 1000,
                        },
                        removeOnComplete: {
                            age: 3600,
                            count: 1000,
                        },
                        removeOnFail: {
                            age: 86400,
                        },
                    },
                }),
            }),
            health_module_1.HealthModule,
            iam_module_1.IamModule,
            assets_module_1.AssetsModule,
            ingestion_module_1.IngestionModule,
            worker_module_1.WorkerModule,
            realtime_module_1.RealtimeModule,
            dashboard_module_1.DashboardModule,
            readings_module_1.ReadingsModule,
            customers_module_1.CustomersModule,
            subscriptions_module_1.SubscriptionsModule,
            settings_module_1.SettingsModule,
            alarms_module_1.AlarmsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: jwt_auth_guard_1.JwtAuthGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map