// =============================================================================
// IAM Module - Identity and Access Management
// =============================================================================

import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';

@Module({
  imports: [AuthModule, UsersModule, TenantsModule],
  exports: [AuthModule, UsersModule, TenantsModule],
})
export class IamModule {}

