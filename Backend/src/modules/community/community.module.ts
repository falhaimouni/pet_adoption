import { NotificationsModule } from "../notifications/notifications.module";
import { Module } from "@nestjs/common";
import { CommunityController } from "./community.controller";
import { CommunityService } from "./community.service";
@Module({ imports: [NotificationsModule], controllers: [CommunityController], providers: [CommunityService] })
export class CommunityModule {}
