import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { RequestWithUser } from "@shared/types/auth.types";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { CommunityService } from "./community.service";
import {
  AdopterSearchDto,
  CommunityMessageDto,
  DirectMessageDto,
  RequestActionDto,
  TargetUserDto,
  TimelineDto,
} from "./community.dto";

@UseGuards(JwtAuthGuard)
@Controller()
export class CommunityController {
  constructor(private readonly service: CommunityService) {}
  @Get("community/access") access(@Req() r: RequestWithUser) {
    return this.service.access(r.user);
  }
  @Get("community/messages") messages(
    @Req() r: RequestWithUser,
    @Query() q: TimelineDto,
  ) {
    return this.service.messages(r.user, q.before);
  }
  @Post("community/messages")
  @UseInterceptors(
    FileInterceptor("photo", {
      limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 2 },
    }),
  )
  send(
    @Req() r: RequestWithUser,
    @Body() dto: CommunityMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.service.send(r.user, dto, file);
  }
  @Delete("community/messages/:id") delete(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.deleteMessage(r.user, id);
  }
  @Get("community/messages/:id/image")
  async image(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const photo = await this.service.image(r.user, id);
    res.setHeader("Content-Type", photo.image_type);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(photo.image);
  }
  @Get("community/blocks") blocks(@Req() r: RequestWithUser) {
    return this.service.blocks(r.user);
  }
  @Post("community/blocks") block(
    @Req() r: RequestWithUser,
    @Body() dto: TargetUserDto,
  ) {
    return this.service.block(r.user, dto.userId);
  }
  @Delete("community/blocks/:id") unblock(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.block(r.user, id, true);
  }
  @Post("presence/heartbeat") heartbeat(@Req() r: RequestWithUser) {
    return this.service.heartbeat(r.user);
  }
  @Get("public-profiles/:id") profile(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    this.service.adopter(r.user);
    return this.service.profile(id);
  }
  @Get("adopters/search") searchAdopters(
    @Req() r: RequestWithUser,
    @Query() query: AdopterSearchDto,
  ) {
    return this.service.searchAdopters(r.user, query.name);
  }
  @Get("friends") friends(@Req() r: RequestWithUser) {
    return this.service.friends(r.user);
  }
  @Delete("friends/:id") removeFriend(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.removeFriend(r.user, id);
  }
  @Get("friend-requests") requests(@Req() r: RequestWithUser) {
    return this.service.requests(r.user);
  }
  @Post("friend-requests") request(
    @Req() r: RequestWithUser,
    @Body() dto: TargetUserDto,
  ) {
    return this.service.request(r.user, dto.userId);
  }
  @Patch("friend-requests/:id") respond(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RequestActionDto,
  ) {
    return this.service.respond(r.user, id, dto.action);
  }
  @Get("direct-conversations") conversations(@Req() r: RequestWithUser) {
    return this.service.conversations(r.user);
  }
  @Post("direct-conversations") start(
    @Req() r: RequestWithUser,
    @Body() dto: TargetUserDto,
  ) {
    return this.service.startConversation(r.user, dto.userId);
  }
  @Get("direct-conversations/:id/messages") directMessages(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() q: TimelineDto,
  ) {
    return this.service.directMessages(r.user, id, q.before);
  }
  @Post("direct-conversations/:id/messages") sendDirect(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: DirectMessageDto,
  ) {
    return this.service.sendDirect(r.user, id, dto.text);
  }
  @Patch("direct-conversations/:id/read") read(
    @Req() r: RequestWithUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.service.read(r.user, id);
  }
}
